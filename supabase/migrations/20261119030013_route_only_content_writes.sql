-- Comments, marketplace listings and service reviews are written only through
-- their API routes.
--
-- The routes now run a profanity check (lib/moderation/profanity.ts) before
-- saving. These three tables still had insert and update policies letting any
-- signed-in user write their own rows straight through PostgREST with the
-- public anon key and a Clerk token, which would skip that check and anything
-- else the route enforces. The routes authenticate the caller, run every
-- check, set user_id themselves, and write through the service role, the same
-- pattern the group poll and sign-up tables already use.
--
-- Group membership for group comments was the only rule the old insert policy
-- added; /api/comments checks it before writing.
--
-- Delete policies stay: people still delete their own rows through the routes
-- with their own token, and a delete cannot introduce content.
--
-- The app has no edit feature for any of these, so nothing used the update
-- policies.

DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;

DROP POLICY IF EXISTS "Users can insert their own marketplace items" ON public.marketplace_items;
DROP POLICY IF EXISTS "Users can update their own marketplace items" ON public.marketplace_items;

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.service_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.service_reviews;

-- Second line of defense in case a write policy is ever added back by mistake.
-- Revoked privileges are not captured by `supabase db pull` (see CLAUDE.md).
REVOKE INSERT, UPDATE ON TABLE public.comments FROM anon, authenticated;
REVOKE INSERT, UPDATE ON TABLE public.marketplace_items FROM anon, authenticated;
REVOKE INSERT, UPDATE ON TABLE public.service_reviews FROM anon, authenticated;
