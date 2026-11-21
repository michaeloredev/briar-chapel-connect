import Link from 'next/link';
import { ArrowRight, Briefcase, Calendar, Lock, Newspaper, ShoppingBag, Users, type LucideIcon } from 'lucide-react';
import { eventsReader } from '@/lib/api/event-reader';
import type { Database } from '@/lib/supabase/types';
import DateTile from '@/components/events/DateTile';
import { formatPostTime, formatTime } from '@/lib/utils/date';
import { loadNewsFeed, newsReader } from '@/lib/api/news';
import { newsCategory } from '@/lib/data/news-categories';

const UPCOMING_LIMIT = 3;
const NEWS_PREVIEW_LIMIT = 3;

type Section = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  /** Icon color, light and dark; the tile behind it is slate on every card. */
  iconColor: string;
};

const SECTIONS: Section[] = [
  {
    href: '/events',
    icon: Calendar,
    title: 'Community events',
    description: 'Yard sales, block parties, meetups and everything happening nearby.',
    cta: 'See events',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    href: '/groups',
    icon: Users,
    title: 'Groups & clubs',
    description: 'Find your people — golf, tennis, dog walkers, book clubs and more.',
    cta: 'Find a group',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    href: '/marketplace',
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy, sell and give away with neighbors — no shipping required.',
    cta: 'Start browsing',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/services',
    icon: Briefcase,
    title: 'Local services',
    description: 'Plumbers, tutors, cleaners and more, recommended by neighbors.',
    cta: 'Find a pro',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
];

export default async function Home() {
  // The next few events that haven't finished yet. Overlap, not start date,
  // so a multi-day event already under way still shows.
  const nowISO = new Date().toISOString();
  // Private groups' events show only to their members (and site admins).
  const supabase = await eventsReader();
  type Row = Database['public']['Tables']['events']['Row'];
  const { data: upcoming, error } = await supabase
    .from('events')
    .select('*')
    .neq('status', 'cancelled')
    .or(`end_date.gte."${nowISO}",and(end_date.is.null,event_date.gte."${nowISO}")`)
    .order('event_date', { ascending: true })
    .limit(UPCOMING_LIMIT)
    .returns<Row[]>();
  if (error) {
    // Non-fatal: the panel falls back to its empty state
    console.error('Failed to load upcoming events:', error.message);
  }
  const events = upcoming ?? [];

  // News is members-only: signed out, the reader is null and a teaser shows instead.
  const newsClient = await newsReader();
  const latestNews = newsClient ? (await loadNewsFeed(newsClient, { limit: NEWS_PREVIEW_LIMIT })).posts : null;

  return (
    <div className="flex flex-col flex-1 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 grid gap-12 lg:grid-cols-2 items-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Your neighborhood,
              <span className="block text-blue-600 dark:text-blue-400">all in one place</span>
            </h2>
            <p className="max-w-xl text-lg sm:text-xl text-slate-600 dark:text-slate-300">
              Find local services, buy and sell with neighbors, and never miss what&apos;s happening around Briar Chapel.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                See what&apos;s on
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex min-h-12 items-center rounded-full border-2 border-blue-600 px-6 font-semibold text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
              >
                Browse the marketplace
              </Link>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Coming up</h3>
              <Link href="/events" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                All events
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                Nothing on the calendar yet — check back soon.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {events.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.id}`}
                      className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors dark:bg-slate-900/50 dark:hover:bg-slate-900"
                    >
                      <DateTile iso={event.event_date} category={event.category} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">{event.title}</span>
                        <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                          {formatTime(event.event_date)} · {event.location}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {latestNews ? (
          <section aria-labelledby="latest-news" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3">
                <h2 id="latest-news" className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden />
                  Latest from the neighborhood
                </h2>
                <Link href="/news" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  See all
                </Link>
              </div>
              {latestNews.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                  No posts yet.{' '}
                  <Link href="/news" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    Share something with your neighbors
                  </Link>
                  .
                </p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-3">
                  {latestNews.map((post) => {
                    const category = newsCategory(post.category);
                    return (
                      <li key={post.id}>
                        <Link
                          href={`/news/${post.id}`}
                          className="flex h-full flex-col gap-2 rounded-xl bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:bg-slate-900/50 dark:hover:bg-slate-900"
                        >
                          <span className="flex flex-wrap items-center gap-2 text-sm">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${category.chip}`}>{category.label}</span>
                            <span className="text-slate-500 dark:text-slate-400">{formatPostTime(post.created_at)}</span>
                          </span>
                          <span className="line-clamp-3 text-slate-800 dark:text-slate-200">{post.content}</span>
                          <span className="mt-auto text-sm text-slate-600 dark:text-slate-300">
                            {post.author_name || 'Community member'}
                            {post.comment_count > 0
                              ? ` · ${post.comment_count} ${post.comment_count === 1 ? 'reply' : 'replies'}`
                              : ''}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        ) : (
          <section aria-labelledby="news-teaser" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  <Newspaper className="h-6 w-6" aria-hidden />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 id="news-teaser" className="text-lg font-bold text-slate-900 dark:text-white">
                    See what neighbors are saying
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    News, lost &amp; found, safety alerts and recommendations from around Briar Chapel.
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    For signed-in neighbors only
                  </p>
                </div>
              </div>
              {/* /news is protected: middleware sends a signed-out visitor to sign in, then back here. */}
              <Link
                href="/news"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                Sign in to read
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>
        )}

        {/* Sections */}
        <section aria-labelledby="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 id="explore" className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
            Explore the neighborhood
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map(({ href, icon: Icon, title, description, cta, iconColor }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              >
                {/* Slate tile with a light blue border, colored icon: the services icon look. */}
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-300 bg-slate-100 dark:border-blue-400 dark:bg-slate-600">
                  <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden />
                </span>
                <span className="text-xl font-semibold text-slate-900 dark:text-white">{title}</span>
                <span className="text-slate-600 dark:text-slate-300">{description}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-semibold text-blue-600 dark:text-blue-400">
                  {cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-blue-50 p-8 sm:p-10 dark:bg-slate-800">
            <div className="flex max-w-2xl flex-col gap-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Got something to share?</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Sell, swap or give away something you no longer need. Listing it only takes a minute.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex min-h-12 items-center rounded-full bg-blue-600 px-7 font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              List an item
            </Link>
          </div>
        </section>
      </main>

    </div>
  );
}
