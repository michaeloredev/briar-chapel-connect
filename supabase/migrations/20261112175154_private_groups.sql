-- Private groups and join requests.
--
-- A private group is still listed: its card and header (name, picture,
-- description, member count) stay public so people can find it and ask to
-- join. Its content (discussion, polls, sign-ups) is for members only. Joining
-- takes a request with a short note, approved by the group's owner or a site
-- admin. A declined request is simply deleted, so the person can ask again.
--
-- Members-only has to hold in the database, not just the page: the anon key is
-- public, and every content table below was readable by anyone through
-- PostgREST. The app's own reads of private content are authorized in code and
-- then go through the service role.

-- 1. The switch ----------------------------------------------------------------

ALTER TABLE public.groups
  ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- 2. Who may read a group's content -------------------------------------------

-- Anyone, for a public group; active members, for a private one. Takes text
-- because comments.entity_id is text. SECURITY DEFINER so the lookups are not
-- themselves filtered by RLS on groups (which hides inactive groups) and
-- group_members (which shows a user only their own rows). It only ever reveals
-- whether the caller can read a group, nothing else.
CREATE OR REPLACE FUNCTION public.can_read_group(group_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  gid uuid;
  private boolean;
BEGIN
  IF group_id IS NULL
     OR group_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  gid := group_id::uuid;

  SELECT g.is_private INTO private FROM public.groups g WHERE g.id = gid;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF NOT private THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM public.group_members gm
     WHERE gm.group_id = gid
       AND gm.user_id = (auth.jwt() ->> 'sub')
       AND gm.status = 'active'
  );
END;
$$;

-- 3. Members-only reads on group content --------------------------------------

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT TO PUBLIC
  USING (entity_type <> 'group' OR public.can_read_group(entity_id));

DROP POLICY IF EXISTS "Anyone can view group polls" ON public.group_polls;
CREATE POLICY "Readers of the group can view its polls" ON public.group_polls
  FOR SELECT TO PUBLIC
  USING (public.can_read_group(group_id::text));

DROP POLICY IF EXISTS "Anyone can view group poll options" ON public.group_poll_options;
CREATE POLICY "Readers of the group can view poll options" ON public.group_poll_options
  FOR SELECT TO PUBLIC
  USING (EXISTS (
    SELECT 1 FROM public.group_polls p
     WHERE p.id = group_poll_options.poll_id
       AND public.can_read_group(p.group_id::text)
  ));

DROP POLICY IF EXISTS "Anyone can view group poll votes" ON public.group_poll_votes;
CREATE POLICY "Readers of the group can view poll votes" ON public.group_poll_votes
  FOR SELECT TO PUBLIC
  USING (EXISTS (
    SELECT 1 FROM public.group_polls p
     WHERE p.id = group_poll_votes.poll_id
       AND public.can_read_group(p.group_id::text)
  ));

DROP POLICY IF EXISTS "Anyone can view group signups" ON public.group_signups;
CREATE POLICY "Readers of the group can view its signups" ON public.group_signups
  FOR SELECT TO PUBLIC
  USING (public.can_read_group(group_id::text));

DROP POLICY IF EXISTS "Anyone can view group signup slots" ON public.group_signup_slots;
CREATE POLICY "Readers of the group can view signup slots" ON public.group_signup_slots
  FOR SELECT TO PUBLIC
  USING (EXISTS (
    SELECT 1 FROM public.group_signups s
     WHERE s.id = group_signup_slots.signup_id
       AND public.can_read_group(s.group_id::text)
  ));

DROP POLICY IF EXISTS "Anyone can view group signup claims" ON public.group_signup_claims;
CREATE POLICY "Readers of the group can view signup claims" ON public.group_signup_claims
  FOR SELECT TO PUBLIC
  USING (EXISTS (
    SELECT 1
      FROM public.group_signup_slots sl
      JOIN public.group_signups s ON s.id = sl.signup_id
     WHERE sl.id = group_signup_claims.slot_id
       AND public.can_read_group(s.group_id::text)
  ));

-- 4. Joining directly only works for public groups ------------------------------

-- Members of a private group are added by the approval route through the
-- service role. This keeps the role/status/active-group checks from
-- 20261108034749_restrict_group_member_insert and adds NOT is_private.
DROP POLICY IF EXISTS "Users can join groups (insert own membership)" ON public.group_members;
CREATE POLICY "Users can join groups (insert own membership)" ON public.group_members
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
         AND NOT g.is_private
    )
  );

-- 5. Join requests -------------------------------------------------------------

CREATE TABLE public.group_join_requests (
  id         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  group_id   uuid                     NOT NULL,
  user_id    text                     NOT NULL,
  message    text                     NOT NULL,
  CONSTRAINT group_join_requests_pkey PRIMARY KEY (id),
  CONSTRAINT group_join_requests_group_id_fkey FOREIGN KEY (group_id)
    REFERENCES public.groups(id) ON DELETE CASCADE,
  CONSTRAINT group_join_requests_group_id_user_id_key UNIQUE (group_id, user_id),
  CONSTRAINT group_join_requests_message_check
    CHECK (char_length(btrim(message)) BETWEEN 1 AND 500)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- A requester can see their own pending request. Approvers read the list
-- through the service role after the route checks they own the group or are a
-- site admin, and every write goes through /api/group-join-requests the same
-- way. No write policy, and the REVOKE is the second line of defense in case
-- one is ever added by mistake.
CREATE POLICY "Users can view their own join requests" ON public.group_join_requests
  FOR SELECT TO PUBLIC
  USING ((auth.jwt() ->> 'sub'::text) = user_id);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.group_join_requests
  FROM anon, authenticated;
