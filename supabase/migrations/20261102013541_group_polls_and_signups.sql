-- Polls and sign-up sheets inside groups, and members-only group discussion.
--
-- Anyone can read a group's polls, sign-ups and comments; only its members can
-- take part. The six new tables follow the rule from
-- 20260923020144_close_privileged_write_rls_gap.sql: they have no legitimate
-- browser-side writer, so they get a public SELECT policy and no write policy
-- at all. Every write goes through app/api/group-* , which checks membership
-- or ownership and then uses the service-role client. The REVOKE below is the
-- second line of defense in case a write policy is ever added by mistake.
--
-- Comments are the exception, because the browser-facing comment routes write
-- with the user's own token. Their insert policy is tightened so a comment on
-- a group needs an active membership; until now any signed-in user could post
-- to any group straight through PostgREST.

-- Polls ---------------------------------------------------------------------

CREATE TABLE "public"."group_polls" (
  "id"                   uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "group_id"             uuid                     NOT NULL,
  "user_id"              text                     NOT NULL,
  "question"             text                     NOT NULL,
  "allow_multiple"       boolean                  NOT NULL DEFAULT false,
  "allow_member_options" boolean                  NOT NULL DEFAULT false,
  "closes_at"            timestamp with time zone,
  "closed_at"            timestamp with time zone,
  CONSTRAINT "group_polls_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_polls_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE
);

CREATE TABLE "public"."group_poll_options" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "poll_id"    uuid                     NOT NULL,
  "user_id"    text                     NOT NULL,
  "label"      text                     NOT NULL,
  "position"   integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "group_poll_options_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_poll_options_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES public.group_polls(id) ON DELETE CASCADE
);

CREATE TABLE "public"."group_poll_votes" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "poll_id"    uuid                     NOT NULL,
  "option_id"  uuid                     NOT NULL,
  "user_id"    text                     NOT NULL,
  CONSTRAINT "group_poll_votes_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_poll_votes_option_user_key" UNIQUE (option_id, user_id),
  CONSTRAINT "group_poll_votes_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES public.group_polls(id) ON DELETE CASCADE,
  CONSTRAINT "group_poll_votes_option_id_fkey" FOREIGN KEY (option_id) REFERENCES public.group_poll_options(id) ON DELETE CASCADE
);

-- Sign-up sheets ------------------------------------------------------------

CREATE TABLE "public"."group_signups" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "group_id"    uuid                     NOT NULL,
  "user_id"     text                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text,
  "closed_at"   timestamp with time zone,
  CONSTRAINT "group_signups_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_signups_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE
);

CREATE TABLE "public"."group_signup_slots" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "signup_id"  uuid                     NOT NULL,
  "label"      text                     NOT NULL,
  "capacity"   integer                  NOT NULL DEFAULT 1,
  "position"   integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "group_signup_slots_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_signup_slots_capacity_check" CHECK (capacity > 0),
  CONSTRAINT "group_signup_slots_signup_id_fkey" FOREIGN KEY (signup_id) REFERENCES public.group_signups(id) ON DELETE CASCADE
);

CREATE TABLE "public"."group_signup_claims" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "slot_id"    uuid                     NOT NULL,
  "user_id"    text                     NOT NULL,
  "note"       text,
  CONSTRAINT "group_signup_claims_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_signup_claims_slot_user_key" UNIQUE (slot_id, user_id),
  CONSTRAINT "group_signup_claims_slot_id_fkey" FOREIGN KEY (slot_id) REFERENCES public.group_signup_slots(id) ON DELETE CASCADE
);

-- Indexes on every foreign key (the UNIQUE constraints already cover
-- group_poll_votes.option_id and group_signup_claims.slot_id).
CREATE INDEX idx_group_polls_group_id ON public.group_polls USING btree (group_id);
CREATE INDEX idx_group_poll_options_poll_id ON public.group_poll_options USING btree (poll_id);
CREATE INDEX idx_group_poll_votes_poll_id ON public.group_poll_votes USING btree (poll_id);
CREATE INDEX idx_group_signups_group_id ON public.group_signups USING btree (group_id);
CREATE INDEX idx_group_signup_slots_signup_id ON public.group_signup_slots USING btree (signup_id);

-- Slot capacity ---------------------------------------------------------------

-- Checked in the database, not the route: two neighbors claiming the last
-- spot at the same moment would both pass a count done in application code.
-- Locking the slot row serializes claims on that slot, so the second insert
-- sees the first and is refused.
CREATE OR REPLACE FUNCTION "public"."enforce_signup_slot_capacity"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  slot_capacity integer;
  claimed integer;
BEGIN
  SELECT capacity INTO slot_capacity
    FROM public.group_signup_slots
    WHERE id = NEW.slot_id
    FOR UPDATE;

  SELECT count(*) INTO claimed
    FROM public.group_signup_claims
    WHERE slot_id = NEW.slot_id;

  IF claimed >= slot_capacity THEN
    RAISE EXCEPTION 'slot is full' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "enforce_signup_slot_capacity"
  BEFORE INSERT ON "public"."group_signup_claims"
  FOR EACH ROW EXECUTE FUNCTION "public"."enforce_signup_slot_capacity"();

-- Row level security ----------------------------------------------------------

ALTER TABLE "public"."group_polls"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_poll_options"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_poll_votes"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_signups"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_signup_slots"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_signup_claims" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group polls" ON "public"."group_polls"
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view group poll options" ON "public"."group_poll_options"
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view group poll votes" ON "public"."group_poll_votes"
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view group signups" ON "public"."group_signups"
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view group signup slots" ON "public"."group_signup_slots"
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Anyone can view group signup claims" ON "public"."group_signup_claims"
  FOR SELECT TO PUBLIC USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  "public"."group_polls",
  "public"."group_poll_options",
  "public"."group_poll_votes",
  "public"."group_signups",
  "public"."group_signup_slots",
  "public"."group_signup_claims"
FROM "anon", "authenticated";

-- Members-only group discussion -----------------------------------------------

-- group_members' own SELECT policy lets a user see their own rows, which is
-- all this subquery needs to find their membership.
DROP POLICY IF EXISTS "Users can insert own comments" ON "public"."comments";
CREATE POLICY "Users can insert own comments" ON "public"."comments"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    ((auth.jwt() ->> 'sub'::text) = user_id)
    AND (
      entity_type <> 'group'
      OR EXISTS (
        SELECT 1
        FROM public.group_members gm
        WHERE gm.group_id::text = comments.entity_id
          AND gm.user_id = (auth.jwt() ->> 'sub'::text)
          AND gm.status = 'active'
      )
    )
  );
