-- Close a privilege gap on services, events and groups.
--
-- Creating a provider requires superadmin, and creating an event or a group
-- requires admin -- but only in the API routes. The RLS write policies on these
-- three tables were the generic "users can manage their own rows" pattern keyed
-- on auth.jwt() ->> 'sub' = user_id, which grants every signed-in user those
-- writes. NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the browser and Supabase
-- accepts any valid Clerk JWT, so a 'client' could POST straight to PostgREST,
-- skip the route and its requireRole() entirely, and publish a provider, event
-- or group that renders on the public pages -- then update or delete it.
--
-- This is the same shape as the user_roles hole: app-level checks only cover
-- traffic that goes through the route, and where RLS and the app disagree the
-- weaker one wins.
--
-- These tables have no legitimate browser-side writer. Every write goes through
-- app/api/{providers,events,groups}, which now uses the service-role client
-- after its requireRole() check, and the seed scripts use the service role too;
-- both bypass RLS. So the write policies are removed outright rather than
-- rewritten to test for a role -- a role test would have to read user_roles,
-- which anon and authenticated are deliberately revoked from.
--
-- The SELECT policies are untouched: public browsing of active rows still works
-- exactly as before, and reads are what the browser client is actually for.

-- services: create/edit/delete provider is superadmin-only
DROP POLICY IF EXISTS "Users can insert their own services" ON "public"."services";
DROP POLICY IF EXISTS "Users can update their own services" ON "public"."services";
DROP POLICY IF EXISTS "Users can delete their own services" ON "public"."services";

-- events: create event is admin-only
DROP POLICY IF EXISTS "Users can insert their own events" ON "public"."events";
DROP POLICY IF EXISTS "Users can update their own events" ON "public"."events";
DROP POLICY IF EXISTS "Users can delete their own events" ON "public"."events";

-- groups: create group is admin-only
DROP POLICY IF EXISTS "Users can insert their own groups" ON "public"."groups";
DROP POLICY IF EXISTS "Users can update their own groups" ON "public"."groups";
DROP POLICY IF EXISTS "Users can delete their own groups" ON "public"."groups";
