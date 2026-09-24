-- Events of every status are public.
--
-- The only SELECT policy allowed 'upcoming' and 'ongoing', so the moment an
-- admin cancelled an event, every anon or signed-in read of it came back
-- empty: its detail page 404'd and it vanished from the calendar and day list
-- -- the opposite of the intent, which is to keep it visible with a
-- "Cancelled" badge so people who planned to go find out.
--
-- Events are community-wide announcements with nothing private in them, so
-- the rule is simply "anyone can read". Writes are unaffected: there are still
-- no INSERT/UPDATE/DELETE policies, so those go only through the service-role
-- client behind requireRole() (see 20260923020144_close_privileged_write_rls_gap).

DROP POLICY IF EXISTS "Anyone can view upcoming events" ON "public"."events";

CREATE POLICY "Anyone can view events" ON "public"."events"
  FOR SELECT
  TO PUBLIC
  USING (true);
