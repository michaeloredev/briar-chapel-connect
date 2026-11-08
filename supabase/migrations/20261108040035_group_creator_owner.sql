-- Make a group's creator its owner.
--
-- group_members.role has always allowed 'owner', but nothing ever wrote it:
-- creating a group did not add the creator as a member at all. This gives every
-- group an owner row, as the base for group-level permissions.
--
-- 1. One membership per user per group. Nothing enforced this before, so a
--    double-click or race on Join could leave duplicate rows. Duplicates are
--    collapsed first, keeping the highest role, preferring an active row, then
--    the oldest.
-- 2. A trigger adds the creator as an active 'owner' whenever a group is
--    inserted. It runs in the same transaction as the insert, so a group can
--    never exist without its owner row. Groups are only ever inserted through
--    the service-role client (RLS has no write policy on groups), which
--    bypasses RLS on group_members too, so the trigger does not need SECURITY
--    DEFINER. Keep it that way: the browser must never be able to write an
--    owner row.
-- 3. Existing groups are backfilled: their creator (groups.user_id) becomes
--    owner, upgrading a membership they already have.

-- 1. Deduplicate, then enforce uniqueness ------------------------------------

DELETE FROM public.group_members gm
 USING (
   SELECT id,
          row_number() OVER (
            PARTITION BY group_id, user_id
            ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
                     CASE status WHEN 'active' THEN 0 ELSE 1 END,
                     created_at,
                     id
          ) AS rn
     FROM public.group_members
 ) ranked
 WHERE gm.id = ranked.id
   AND ranked.rn > 1;

ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);

-- 2. Creator becomes owner on insert -----------------------------------------

CREATE OR REPLACE FUNCTION public.add_group_creator_as_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'active')
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET role = 'owner', status = 'active';
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_group_creator_as_owner
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_creator_as_owner();

-- 3. Backfill existing groups ------------------------------------------------

INSERT INTO public.group_members (group_id, user_id, role, status)
SELECT g.id, g.user_id, 'owner', 'active'
  FROM public.groups g
ON CONFLICT (group_id, user_id)
DO UPDATE SET role = 'owner', status = 'active';
