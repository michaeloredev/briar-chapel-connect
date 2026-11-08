-- Restrict what a user can write when joining a group.
--
-- The old insert policy only checked that a user was adding themselves
-- (auth.jwt() ->> 'sub' = user_id). It never looked at role or status. The
-- anon key ships to the browser and Supabase accepts any valid Clerk JWT, so a
-- signed-in user could skip /api/group-members and insert themselves straight
-- through PostgREST as role 'owner' or 'admin' of any group, including an
-- inactive one. Nothing reads group_members.role yet, but group-level
-- permissions are planned, and this would hand every user ownership of every
-- group.
--
-- The policy now allows exactly what the route writes: yourself, as an active
-- 'member', of an active group. Owner and admin rows are for server code using
-- the service-role client, which bypasses RLS, after its own permission check.
--
-- There is no UPDATE policy on group_members, so a member cannot promote
-- themselves after joining either. Leave it that way.
--
-- TO PUBLIC is kept from the original policy. A request without a Clerk token
-- has no 'sub', so it still fails the first check.

DROP POLICY IF EXISTS "Users can join groups (insert own membership)" ON "public"."group_members";

CREATE POLICY "Users can join groups (insert own membership)" ON "public"."group_members"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    (auth.jwt() ->> 'sub'::text) = user_id
    AND role = 'member'::text
    AND status = 'active'::text
    AND EXISTS (
      SELECT 1
        FROM public.groups g
       WHERE g.id = group_members.group_id
         AND g.status = 'active'::text
    )
  );
