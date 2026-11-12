-- A group's owner cannot leave it.
--
-- Owners now edit their group, approve join requests and moderate its
-- content. The leave policy let any member delete their own membership row,
-- the owner included, which would leave the group with no owner. The route
-- refuses this too, but the anon key is public and this policy is what
-- PostgREST enforces. Ownership has to move first (or a site admin deletes the
-- group, which removes every membership through the foreign key).

DROP POLICY IF EXISTS "Users can leave groups (delete own membership)" ON public.group_members;
CREATE POLICY "Users can leave groups (delete own membership)" ON public.group_members
  FOR DELETE
  TO PUBLIC
  USING (
    (auth.jwt() ->> 'sub'::text) = user_id
    AND role <> 'owner'::text
  );
