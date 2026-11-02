import Link from 'next/link';
import { ArrowRight, ArrowUp, Briefcase, Calendar, LifeBuoy, ShoppingBag, Users, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import DateTile from '@/components/events/DateTile';
import { formatTime } from '@/lib/utils/date';

const UPCOMING_LIMIT = 3;

type Section = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  tile: string;
};

const SECTIONS: Section[] = [
  {
    href: '/events',
    icon: Calendar,
    title: 'Community events',
    description: 'Yard sales, block parties, meetups and everything happening nearby.',
    cta: 'See events',
    tile: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  },
  {
    href: '/groups',
    icon: Users,
    title: 'Groups & clubs',
    description: 'Find your people — golf, tennis, dog walkers, book clubs and more.',
    cta: 'Find a group',
    tile: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
  },
  {
    href: '/marketplace',
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy, sell and give away with neighbors — no shipping required.',
    cta: 'Start browsing',
    tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
  },
  {
    href: '/services',
    icon: Briefcase,
    title: 'Local services',
    description: 'Plumbers, tutors, cleaners and more, recommended by neighbors.',
    cta: 'Find a pro',
    tile: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  },
];

export default async function Home() {
  // The next few events that haven't finished yet. Overlap, not start date,
  // so a multi-day event already under way still shows.
  const nowISO = new Date().toISOString();
  const supabase = await createClient();
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

  return (
    <div id="top" className="flex flex-col flex-1 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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

        {/* Sections */}
        <section aria-labelledby="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 id="explore" className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
            Explore the neighborhood
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map(({ href, icon: Icon, title, description, cta, tile }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tile}`}>
                  <Icon className="h-6 w-6" aria-hidden />
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-900 dark:text-white">Briar Chapel Connect</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">© 2026 · Made by neighbors, for neighbors.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/support"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden />
              Support
            </Link>
            <a
              href="#top"
              aria-label="Back to top"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <ArrowUp className="h-5 w-5" aria-hidden />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
