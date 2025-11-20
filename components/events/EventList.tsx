'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

type EventListItem = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO
  endDate: string | null; // ISO
  location: string;
  status: string;
};

function formatDateRange(startISO: string, endISO: string | null) {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const startStr = start.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (!end) return startStr;
  const sameDay = start.toDateString() === end.toDateString();
  const endStr = end.toLocaleString(undefined, {
    ...(sameDay ? { hour: '2-digit', minute: '2-digit' } : { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  });
  return `${startStr} – ${endStr}`;
}

export default function EventList({ initialDateISO, events }: { initialDateISO: string; events: EventListItem[] }) {
  const params = useSearchParams();
  const selected = params.get('date') || initialDateISO.slice(0, 10);
  const selectedDate = new Date(selected);
  const filtered = events.filter((e) => {
    const start = new Date(e.date);
    const end = e.endDate ? new Date(e.endDate) : start;
    // Compare by date (ignore time)
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const ed = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const sel = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return sel >= s && sel <= ed;
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Events on {new Date(selected).toLocaleDateString()}</h2>
      {filtered.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No events scheduled.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {filtered.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{e.title}</div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 capitalize">
                  {e.status.replace('_', ' ')}
                </span>
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


