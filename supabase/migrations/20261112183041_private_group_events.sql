-- Events of a private group are for its members.
--
-- An event linked to a private group was still readable by anyone, so the
-- group's meetups showed on the public calendar and the home page even though
-- everything else about the group is members-only. Visibility now follows the
-- group: can_read_group() (20261112175154_private_groups) decides, the same as
-- for its discussion, polls and sign-ups. Events without a group are
-- unchanged, and so is any event whose group was deleted (group_id is set to
-- null).
--
-- Site admins moderate every group, so the app reads events through the
-- service role for them; everyone else reads with their own token and gets
-- exactly what this policy allows.

DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT TO PUBLIC
  USING (group_id IS NULL OR public.can_read_group(group_id::text));

-- An event's comment thread follows the event: the subquery runs under the
-- events policy above, so a thread is visible exactly when its event is.
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT TO PUBLIC
  USING (
    CASE entity_type
      WHEN 'group' THEN public.can_read_group(entity_id)
      WHEN 'event' THEN EXISTS (
        SELECT 1 FROM public.events e WHERE e.id::text = comments.entity_id
      )
      ELSE true
    END
  );
