'use client';

import Link from 'next/link';
import RoleGate from '@/components/auth/RoleGate';
import EventFormDialog from '@/components/events/EventFormDialog';
import { getCategoryMeta } from '@/lib/data/event-categories';
import { eventDayKeys, formatDateRange, parseYMD } from '@/lib/utils/date';
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
  const selectedDate = parseYMD(selectedYMD);
  const filtered = events.filter((e) => eventDayKeys(e.date, e.endDate).includes(selectedYMD));

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Events on {selectedDate.toLocaleDateString()}
      </h2>
      {filtered.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No events scheduled.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {filtered.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/events/${e.id}`}
                  className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded truncate"
                >
                  {e.title}
                </Link>
                <div className="flex items-center gap-2">
                  {(() => {
                    const meta = getCategoryMeta(e.category || 'other');
                    return (
                      <span className={['text-xs px-2 py-0.5 rounded-full', meta.badgeClasses].join(' ')}>
                        {meta.label}
                      </span>
                    );
                  })()}
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
                      }}
                    />
                  </RoleGate>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {formatDateRange(e.date, e.endDate)} • {e.location}
              </div>
              {e.description ? (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{e.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
