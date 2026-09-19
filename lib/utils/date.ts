/**
 * Formats a Date object as YYYY-MM-DD using local timezone.
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formats a Date object as a YYYY-MM month key using local timezone.
 */
export function formatLocalMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date (midnight).
 * Callers should validate with `isValidYMD` first; an unparseable
 * string yields an Invalid Date rather than throwing.
 */
export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Parses a YYYY-MM string into zero-based { year, month }. */
export function parseYM(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: (m || 1) - 1 };
}

const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YM_PATTERN = /^\d{4}-\d{2}$/;

/**
 * True when `value` is a real calendar day in YYYY-MM-DD form.
 * Rejects both malformed input ("abc") and impossible dates ("2026-02-31"),
 * so URL params can never produce an Invalid Date downstream.
 */
export function isValidYMD(value: string | null | undefined): value is string {
  if (!value || !YMD_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
}

/** True when `value` is a real month in YYYY-MM form. */
export function isValidYM(value: string | null | undefined): value is string {
  if (!value || !YM_PATTERN.test(value)) return false;
  const month = Number(value.split('-')[1]);
  return month >= 1 && month <= 12;
}

/**
 * Formats a date range from ISO start/end strings into a human-readable string.
 */
export function formatDateRange(startISO: string, endISO: string | null): string {
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : null;
  const startStr = start.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!end) return startStr;
  const sameDay = start.toDateString() === end.toDateString();
  const endStr = end.toLocaleString(undefined, {
    ...(sameDay
      ? { hour: '2-digit' as const, minute: '2-digit' as const }
      : {
          weekday: 'short' as const,
          month: 'short' as const,
          day: 'numeric' as const,
          hour: '2-digit' as const,
          minute: '2-digit' as const,
        }),
  });
  return `${startStr} – ${endStr}`;
}

/**
 * Every local calendar day an event covers, as YYYY-MM-DD keys.
 * Must run in the browser: bucketing an instant into a calendar day
 * depends on the viewer's timezone, not the server's.
 */
export function eventDayKeys(startISO: string, endISO: string | null): string[] {
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return [];
  const end = endISO ? new Date(endISO) : start;
  const last = isNaN(end.getTime()) || end < start ? start : end;

  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const stop = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  // Guard against a malformed multi-year range pinning the main thread.
  for (let i = 0; cursor <= stop && i < 366; i++) {
    keys.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}
