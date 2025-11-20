'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategoryMeta } from '@/lib/data/event-categories';

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function EventCalendar({
  initialDateYMD,
  dayCategories,
}: {
  initialDateYMD: string;
  dayCategories?: Record<string, string[]>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [viewYear, setViewYear] = React.useState(() => {
    const [y, m, d] = initialDateYMD.split('-').map((n) => Number(n));
    return new Date(y, (m || 1) - 1, d || 1).getFullYear();
  });
  const [viewMonth, setViewMonth] = React.useState(() => {
    const [y, m, d] = initialDateYMD.split('-').map((n) => Number(n));
    return new Date(y, (m || 1) - 1, d || 1).getMonth();
  }); // 0..11
  const [selectedISO, setSelectedISO] = React.useState(initialDateYMD);

  function prevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }
  function nextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function onSelect(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    const iso = formatISODate(d);
    setSelectedISO(iso);
    const sp = new URLSearchParams(params ?? undefined);
    sp.set('date', iso);
    router.push(`/events?${sp.toString()}`);
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

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{monthName}</div>
        <button
          type="button"
          onClick={nextMonth}
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
      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.map((w, wi) =>
          w.map((d, di) => {
            if (d === null) {
              return <div key={`${wi}-${di}`} className="h-12" />;
            }
            const iso = formatISODate(new Date(viewYear, viewMonth, d));
            const isSelected = selectedISO === iso;
            const cats = (dayCategories?.[iso] || []).slice(0, 3);
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
                    {cats.map((c, idx) => {
                      const meta = getCategoryMeta(c);
                      return <span key={c + idx} className={['w-2 h-2 rounded-full', meta.dotClasses].join(' ')} />;
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


