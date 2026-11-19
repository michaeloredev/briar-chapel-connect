-- Neighborhood news: a members-only feed of posts (issue #6).
--
-- Everything here is for signed-in members only, and that includes the
-- replies. A post is readable by any signed-in user and by nobody signed out:
-- the anon key is public, so "hidden in the UI" is not enough, and the SELECT
-- policy below is what actually keeps neighborhood chatter off the open web.
--
-- Writes follow 20261119030013_route_only_content_writes: no insert or update
-- policy, so a post can only be created or pinned through /api/news-posts,
-- which runs the profanity check, validates images and checks the admin role
-- for pinning, then writes through the service role. People delete their own
-- posts with their own token; admins delete anyone's through the service role.

CREATE TABLE "public"."news_posts" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"    text                     NOT NULL,
  "category"   text                     NOT NULL DEFAULT 'chatter',
  "content"    text                     NOT NULL,
  "images"     text[]                   NOT NULL DEFAULT '{}'::text[],
  -- Set by an admin to keep an announcement at the top of the feed.
  "pinned_at"  timestamp with time zone,
  CONSTRAINT "news_posts_pkey" PRIMARY KEY (id),
  -- Mirrors lib/data/news-categories.ts.
  CONSTRAINT "news_posts_category_check"
    CHECK (category IN ('news', 'lost_found', 'safety', 'recommendations', 'chatter')),
  CONSTRAINT "news_posts_content_check" CHECK (char_length(content) BETWEEN 1 AND 5000)
);

-- The feed's order: pinned first, then newest.
CREATE INDEX "news_posts_feed_idx"
  ON public.news_posts (pinned_at DESC NULLS LAST, created_at DESC);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view news posts" ON public.news_posts
  FOR SELECT TO PUBLIC
  USING ((auth.jwt() ->> 'sub') IS NOT NULL);

CREATE POLICY "Users can delete own news posts" ON public.news_posts
  FOR DELETE TO PUBLIC
  USING ((auth.jwt() ->> 'sub') = user_id);

-- Second line of defense in case a write policy is ever added by mistake.
-- Revoked privileges are not captured by `supabase db pull` (see CLAUDE.md).
REVOKE INSERT, UPDATE ON TABLE public.news_posts FROM anon, authenticated;

-- A post's replies are as private as the post. Re-created from
-- 20261112183041_private_group_events with a news_post branch added.
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT TO PUBLIC
  USING (
    CASE entity_type
      WHEN 'group' THEN public.can_read_group(entity_id)
      WHEN 'event' THEN EXISTS (
        SELECT 1 FROM public.events e WHERE e.id::text = comments.entity_id
      )
      WHEN 'news_post' THEN (auth.jwt() ->> 'sub') IS NOT NULL
      ELSE true
    END
  );
