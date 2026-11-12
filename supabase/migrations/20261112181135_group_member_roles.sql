-- Group member roles: one owner per group, and an atomic ownership transfer.
--
-- Promoting, demoting and removing members are single-row writes done by
-- /api/group-members through the service role after its permission check.
-- Transferring ownership touches two rows, so it lives here where it runs in
-- one transaction: the group never has two owners or none, even if the request
-- dies halfway.

-- 1. At most one owner per group ------------------------------------------------

CREATE UNIQUE INDEX group_members_one_owner_per_group
  ON public.group_members (group_id)
  WHERE role = 'owner';

-- 2. Transfer ownership ---------------------------------------------------------

-- The current owner becomes a group admin; the new owner must already be an
-- active member. Raises if they are not, which leaves everything unchanged.
-- Authorization is the route's job (owner or site admin), so only the service
-- role may call this: it is SECURITY INVOKER and EXECUTE is revoked from
-- everyone else, so a browser cannot reach it through PostgREST's /rpc.
CREATE OR REPLACE FUNCTION public.transfer_group_ownership(p_group_id uuid, p_new_owner text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM 1
     FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = p_new_owner
      AND status = 'active'
      AND role <> 'owner'
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'new owner must be an active member who is not already the owner'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Demote first, so the one-owner index never sees two.
  UPDATE public.group_members
     SET role = 'admin'
   WHERE group_id = p_group_id
     AND role = 'owner';

  UPDATE public.group_members
     SET role = 'owner'
   WHERE group_id = p_group_id
     AND user_id = p_new_owner;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, text) TO service_role;
