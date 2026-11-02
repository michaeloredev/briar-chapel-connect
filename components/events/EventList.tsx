'use client';

import Link from 'next/link';
import { CalendarX2, Clock, MapPin } from 'lucide-react';
import RoleGate from '@/components/auth/RoleGate';
import DateTile from '@/components/events/DateTile';
import EventFormDialog from '@/components/events/EventFormDialog';
import { getCategoryMeta } from '@/lib/data/event-categories';
import { eventDayKeys, formatDateRange, formatDayHeading } from '@/lib/utils/date';
import type { EventListItem } from './types';

export default function EventList({
  selectedYMD,
  events,
}: {
  selectedYMD: string;
  events: EventListItem[];
}) {
  // The selected day arrives already validated from the page, and day
  // bucketing runs through the same helper the calendar dots use, so a day
  // with a dot always has matching entries here.
  const filtered = events.filter((e) => eventDayKeys(e.date, e.endDate).includes(selectedYMD));

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{formatDayHeading(selectedYMD)}</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length === 1 ? '1 event' : `${filtered.length} events`}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-slate-50 px-4 py-8 text-center dark:bg-slate-900/50">
          <CalendarX2 className="h-8 w-8 text-slate-400" aria-hidden />
          <p className="text-slate-600 dark:text-slate-300">Nothing scheduled this day.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((e) => {
            const cancelled = e.status === 'cancelled';
            const meta = getCategoryMeta(e.category || 'other');
            return (
              // The title link stretches over the whole card through its ::after,
              // so the entire row is the click target; the admin controls sit
              // above it (relative z-10) to stay clickable on their own.
              <li
                key={e.id}
                className="group relative flex gap-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/60 dark:hover:border-blue-700 dark:hover:bg-slate-700/50 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blue-500"
              >
                <DateTile iso={e.date} category={e.category} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/events/${e.id}`}
                      className={[
                        'font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 focus:outline-none after:absolute after:inset-0 after:rounded-xl',
                        cancelled
                          ? 'text-slate-500 dark:text-slate-400 line-through'
                          : 'text-slate-900 dark:text-white',
                      ].join(' ')}
                    >
                      {e.title}
                    </Link>
                    <div className="relative z-10 flex items-center gap-2">
                      {cancelled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                          Cancelled
                        </span>
                      ) : null}
                      <span className={['text-xs px-2 py-0.5 rounded-full', meta.badgeClasses].join(' ')}>
                        {meta.label}
                      </span>
                      {/* Hides the control only -- PATCH /api/events enforces admin. */}
                      <RoleGate minimum="admin">
                        <EventFormDialog
                          event={{
                            id: e.id,
                            title: e.title,
                            description: e.description,
                            category: e.category ?? null,
                            event_date: e.date,
                            end_date: e.endDate,
                            location: e.location,
                            address: e.address ?? null,
                            status: e.status,
                          }}
                        />
                      </RoleGate>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                      {formatDateRange(e.date, e.endDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
                      {e.location}
                    </span>
                  </div>
                  {e.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{e.description}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
