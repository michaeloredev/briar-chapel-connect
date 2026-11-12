-- Group proposals: any signed-in user can propose a group, which waits as
-- 'pending' until a superadmin approves it.
--
-- Nothing else needs to change for a pending group to stay out of sight: the
-- public SELECT policy on groups only shows 'active' rows, and the join policy
-- on group_members only allows joining an 'active' group. The proposer (made
-- owner by add_group_creator_as_owner) and superadmins see it through the
-- service role after the app checks who they are.
--
-- Approving sets the status to 'active'. Rejecting deletes the group, which
-- takes its memberships with it through the foreign key.

ALTER TABLE public.groups DROP CONSTRAINT groups_status_check;
ALTER TABLE public.groups
  ADD CONSTRAINT groups_status_check
  CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'pending'::text]));
