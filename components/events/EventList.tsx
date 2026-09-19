'use client';

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
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{e.title}</div>
                {(() => {
                  const meta = getCategoryMeta(e.category || 'other');
                  return (
                    <span className={['text-xs px-2 py-0.5 rounded-full', meta.badgeClasses].join(' ')}>
                      {meta.label}
                    </span>
                  );
                })()}
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
