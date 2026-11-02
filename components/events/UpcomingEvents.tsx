'use client';

import Link from 'next/link';
import DateTile from '@/components/events/DateTile';
import { addDays, eventDayKeys, formatTime, siteToday } from '@/lib/utils/date';
import type { EventListItem } from './types';

const LIMIT = 5;

/**
 * The next few events after the selected day, so an empty day still points
 * somewhere. Drawn from the events the page already loaded, which reach about
 * two months past the month on screen.
 */
export default function UpcomingEvents({
  selectedYMD,
  events,
}: {
  selectedYMD: string;
  events: EventListItem[];
}) {
  // Never before today, even when the selected day is in the past.
  const after = [addDays(selectedYMD, 1), siteToday()].sort()[1];
  const upcoming = events
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({ event: e, firstDay: eventDayKeys(e.date, e.endDate)[0] }))
    .filter(({ firstDay }) => firstDay && firstDay >= after)
    .slice(0, LIMIT);

  if (upcoming.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Coming up</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {upcoming.map(({ event }) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.id}`}
              className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900/50 dark:hover:bg-slate-900"
            >
              <DateTile iso={event.date} category={event.category} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-semibold text-slate-900 dark:text-white">{event.title}</span>
                <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                  {formatTime(event.date)} · {event.location}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
