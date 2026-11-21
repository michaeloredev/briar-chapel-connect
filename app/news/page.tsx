import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { PageHeader } from '@/components/common/PageHeader';
import NewsComposer from '@/components/news/NewsComposer';
import NewsPostCard from '@/components/news/NewsPostCard';
import { loadNewsFeed, newsReader } from '@/lib/api/news';
import { getUserRole, hasRole } from '@/lib/auth/roles';
import { isNewsCategory, NEWS_CATEGORIES } from '@/lib/data/news-categories';

export const metadata: Metadata = {
  title: 'News • Briar Chapel Connect',
  description: 'News and chatter from Briar Chapel neighbors',
};

const FEED_LIMIT = 50;

type SearchParams = Promise<{ category?: string; before?: string }>;

/** Builds a feed URL, keeping the category filter. */
function feedHref(category: string | undefined, before?: string): string {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (before) params.set('before', before);
  const query = params.toString();
  return query ? `/news?${query}` : '/news';
}

export default async function NewsPage({ searchParams }: { searchParams: SearchParams }) {
  // Members only. middleware.ts already sends signed-out visitors to sign in;
  // this keeps the page safe if the route is ever opened up there by mistake.
  const { userId } = await auth();
  const supabase = await newsReader();
  if (!userId || !supabase) redirect('/sign-in');

  const { category = '', before: rawBefore = '' } = await searchParams;
  const filter = isNewsCategory(category) ? category : undefined;
  // Only a real timestamp is passed on; anything else shows the first page.
  const before = rawBefore && !Number.isNaN(Date.parse(rawBefore)) ? new Date(rawBefore).toISOString() : undefined;
  const [{ posts, nextBefore }, role] = await Promise.all([
    loadNewsFeed(supabase, { category: filter, limit: FEED_LIMIT, before }),
    getUserRole(userId),
  ]);
  const isAdmin = hasRole(role, 'admin');

  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="flex-1 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader title="News" description="What neighbors are talking about. Only signed-in members can see this page." />

        <NewsComposer />

        <nav aria-label="Filter by category" className="mt-8 flex flex-wrap gap-2">
          <Link href={feedHref(undefined)} className={chip(!filter)} aria-current={!filter ? 'page' : undefined}>
            All
          </Link>
          {NEWS_CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={feedHref(c.value)}
              className={chip(filter === c.value)}
              aria-current={filter === c.value ? 'page' : undefined}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-4">
          {posts.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {before
                ? 'No older posts.'
                : filter
                  ? 'No posts in this category yet.'
                  : 'No posts yet. Be the first to share something.'}
            </p>
          ) : (
            posts.map((post) => (
              <NewsPostCard
                key={post.id}
                post={post}
                canDelete={post.user_id === userId || isAdmin}
                canPin={isAdmin}
              />
            ))
          )}
        </div>

        {before || nextBefore ? (
          <nav aria-label="More posts" className="mt-6 flex items-center justify-between gap-3">
            {before ? (
              <Link href={feedHref(filter)} className={chip(false)}>
                Back to latest
              </Link>
            ) : (
              <span />
            )}
            {nextBefore ? (
              <Link href={feedHref(filter, nextBefore)} className={chip(false)}>
                Older posts
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
