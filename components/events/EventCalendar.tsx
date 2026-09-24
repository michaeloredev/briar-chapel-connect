'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoryMeta } from '@/lib/data/event-categories';
import { eventDayKeys, formatLocalDate, formatLocalMonth, formatMonthHeading, parseYM } from '@/lib/utils/date';
import type { EventListItem } from './types';

export default function EventCalendar({
  selectedYMD,
  viewedYM,
  events,
}: {
  selectedYMD: string;
  viewedYM: string;
  events: EventListItem[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  // Month on screen comes from the URL, not local state, so paging months
  // refetches that month's events instead of showing an empty grid.
  const { year: viewYear, month: viewMonth } = parseYM(viewedYM);

  const navigate = React.useCallback(
    (next: { date?: string; month?: string }, replace = false) => {
      const sp = new URLSearchParams(params ?? undefined);
      if (next.date) sp.set('date', next.date);
      if (next.month) sp.set('month', next.month);
      const href = `/events?${sp.toString()}`;
      startTransition(() => {
        if (replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [params, router],
  );

  // Bucketing runs through eventDayKeys, the same helper as the day list, and
  // spans every day a multi-day event covers so the dots match the list. A
  // category's dot is faded when every event of it that day is cancelled.
  const dayCategories = React.useMemo(() => {
    const map: Record<string, Array<{ category: string; cancelled: boolean }>> = {};
    for (const e of events) {
      const category = (e.category || 'other').trim() || 'other';
      const cancelled = e.status === 'cancelled';
      for (const key of eventDayKeys(e.date, e.endDate)) {
        const dots = map[key] ?? (map[key] = []);
        const existing = dots.find((dot) => dot.category === category);
        if (existing) existing.cancelled &&= cancelled;
        else if (dots.length < 3) dots.push({ category, cancelled });
      }
    }
    return map;
  }, [events]);

  function goToMonth(delta: number) {
    navigate({ month: formatLocalMonth(new Date(viewYear, viewMonth + delta, 1)) });
  }

  function onSelect(day: number) {
    navigate({ date: formatLocalDate(new Date(viewYear, viewMonth, day)), month: viewedYM });
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstOfMonth.getDay(); // 0..6
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const weeks: Array<Array<number | null>> = [];
  let week: Array<number | null> = Array(startDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const monthName = formatMonthHeading(viewYear, viewMonth);

  return (
    <div
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
      aria-busy={pending}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{monthName}</div>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className={['mt-1 grid grid-cols-7 gap-1 transition-opacity', pending ? 'opacity-60' : ''].join(' ')}>
        {weeks.map((w, wi) =>
          w.map((d, di) => {
            if (d === null) {
              return <div key={`${wi}-${di}`} className="h-12" />;
            }
            const iso = formatLocalDate(new Date(viewYear, viewMonth, d));
            const isSelected = selectedYMD === iso;
            const cats = dayCategories[iso] ?? [];
            return (
              <div key={`${wi}-${di}`} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSelect(d)}
                  className={[
                    'h-9 w-9 rounded-md text-sm flex items-center justify-center',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
                  ].join(' ')}
                  aria-pressed={isSelected}
                  aria-label={`Select ${iso}`}
                >
                  {d}
                </button>
                {cats.length > 0 ? (
                  <div className="mt-1 flex gap-1">
                    {cats.map(({ category, cancelled }) => {
                      const meta = getCategoryMeta(category);
                      return (
                        <span
                          key={category}
                          className={['w-2 h-2 rounded-full', meta.dotClasses, cancelled ? 'opacity-30' : ''].join(' ')}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
