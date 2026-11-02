-- Sign-up slots can be unlimited, and that is now the default.
--
-- A NULL capacity means "no limit": the slot never fills up. The capacity
-- check and the claim trigger from 20261102013541_group_polls_and_signups.sql
-- are relaxed to match; a numeric capacity is enforced exactly as before.

ALTER TABLE "public"."group_signup_slots"
  ALTER COLUMN "capacity" DROP NOT NULL,
  ALTER COLUMN "capacity" DROP DEFAULT;

ALTER TABLE "public"."group_signup_slots"
  DROP CONSTRAINT "group_signup_slots_capacity_check";
ALTER TABLE "public"."group_signup_slots"
  ADD CONSTRAINT "group_signup_slots_capacity_check" CHECK (capacity IS NULL OR capacity > 0);

CREATE OR REPLACE FUNCTION "public"."enforce_signup_slot_capacity"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  slot_capacity integer;
  claimed integer;
BEGIN
  -- Lock the slot either way, so a capacity being set concurrently can't
  -- slip a claim past it.
  SELECT capacity INTO slot_capacity
    FROM public.group_signup_slots
    WHERE id = NEW.slot_id
    FOR UPDATE;

  IF slot_capacity IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO claimed
    FROM public.group_signup_claims
    WHERE slot_id = NEW.slot_id;

  IF claimed >= slot_capacity THEN
    RAISE EXCEPTION 'slot is full' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
