-- Run once. Closes a privilege-escalation hole in user_roles.
--
-- The previous policy was:
--
--   CREATE POLICY "Superadmins can manage roles" ON user_roles
--       FOR ALL USING (true) WITH CHECK (true);
--
-- Despite the name it granted every caller full read/write, deferring the
-- actual superadmin check to application code. That check only runs inside
-- /api/admin/roles. Because NEXT_PUBLIC_SUPABASE_ANON_KEY ships to the browser
-- and Supabase accepts any valid Clerk JWT, a signed-in 'client' could call
-- PostgREST directly and upsert themselves a 'superadmin' row without ever
-- touching the route. requireRole() then trusts that row, so this defeated
-- role enforcement everywhere.
--
-- Every legitimate access path -- getUserRole(), /api/admin/roles,
-- /api/admin/members, and scripts/seed-*.mjs -- uses the service role key,
-- which bypasses RLS. So the table needs no client-facing policy at all:
-- with RLS enabled and zero policies, anon/authenticated callers get nothing
-- and the service role continues to work untouched.

DROP POLICY IF EXISTS "Superadmins can manage roles" ON user_roles;

-- Also drop the blanket SELECT. It exposed the full roster of admins to
-- anyone holding the anon key. Callers that need a role read it through
-- /api/me/role, which runs server-side under the service role and returns
-- only the caller's own role.
DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Belt and braces: PostgREST reaches the table as anon/authenticated, so
-- revoking table privileges blocks it even if a permissive policy is ever
-- reintroduced by mistake.
REVOKE ALL ON user_roles FROM anon, authenticated;
