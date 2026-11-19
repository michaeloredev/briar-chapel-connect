import { auth } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/server';
import { authorNames } from '@/lib/api/user-names';
import type { NewsCategory } from '@/lib/data/news-categories';

type Row = Database['public']['Tables']['news_posts']['Row'];

export type NewsPost = Row & {
  author_name: string | null;
  comment_count: number;
};

/**
 * The client to read news with: the viewer's own token, so the members-only
 * RLS policy lets them in. Null when signed out -- there is nothing for them.
 */
export async function newsReader(): Promise<SupabaseClient<Database> | null> {
  const { userId, getToken } = await auth();
  if (!userId) return null;
  const token = await getToken();
  return token ? createClient(token) : null;
}

/** Fills in author names and reply counts for a page of posts. */
async function withDetails(supabase: SupabaseClient<Database>, rows: Row[]): Promise<NewsPost[]> {
  if (rows.length === 0) return [];
  const [names, counts] = await Promise.all([
    authorNames(rows.map((row) => row.user_id)),
    (async () => {
      const counts = new Map<string, number>();
      const { data, error } = await supabase
        .from('comments')
        .select('entity_id')
        .eq('entity_type', 'news_post')
        .in('entity_id', rows.map((row) => row.id))
        .returns<{ entity_id: string }[]>();
      if (error) console.error('[News] comment count error:', error.message);
      for (const { entity_id } of data ?? []) counts.set(entity_id, (counts.get(entity_id) ?? 0) + 1);
      return counts;
    })(),
  ]);
  return rows.map((row) => ({
    ...row,
    author_name: names.get(row.user_id) ?? null,
    comment_count: counts.get(row.id) ?? 0,
  }));
}

export type NewsFeedPage = {
  posts: NewsPost[];
  /**
   * Pass back as `before` to get the next, older page; null on the last page.
   * The created_at of the oldest unpinned post shown.
   */
  nextBefore: string | null;
};

/**
 * One page of the feed. The first page (no `before`) is pinned posts, then
 * the newest. Later pages are only unpinned posts older than `before`, since
 * the pinned ones were already shown at the top of the first.
 */
export async function loadNewsFeed(
  supabase: SupabaseClient<Database>,
  { category, limit, before }: { category?: NewsCategory; limit: number; before?: string },
): Promise<NewsFeedPage> {
  let query = supabase.from('news_posts').select('*');
  if (before) {
    query = query.is('pinned_at', null).lt('created_at', before);
  } else {
    query = query.order('pinned_at', { ascending: false, nullsFirst: false });
  }
  if (category) query = query.eq('category', category);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<Row[]>();
  if (error) {
    // Non-fatal: the feed falls back to its empty state.
    console.error('[News] feed error:', error.message);
    return { posts: [], nextBefore: null };
  }
  const rows = data ?? [];
  const oldestUnpinned = [...rows].reverse().find((row) => !row.pinned_at);
  return {
    posts: await withDetails(supabase, rows),
    nextBefore: rows.length === limit && oldestUnpinned ? oldestUnpinned.created_at : null,
  };
}

/** One post, or null when it does not exist. */
export async function loadNewsPost(supabase: SupabaseClient<Database>, id: string): Promise<NewsPost | null> {
  const { data, error } = await supabase.from('news_posts').select('*').eq('id', id).maybeSingle<Row>();
  if (error || !data) return null;
  const [post] = await withDetails(supabase, [data]);
  return post;
}
