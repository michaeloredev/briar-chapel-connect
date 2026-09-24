/**
 * Every event time on the site is shown and entered in Briar Chapel's own
 * timezone, whoever is looking and wherever the page is rendered.
 *
 * Formatting with the runtime's default zone made the server (UTC once
 * hosted) and the browser disagree: detail pages showed times hours off, and
 * the calendar and list hydrated with different days. A fixed zone and a
 * fixed locale make both sides produce identical output. It is also the right
 * meaning for a neighborhood event -- 7:30 PM is 7:30 PM in Briar Chapel, even
 * to a neighbor checking from out of state.
 */
export const SITE_TIME_ZONE = 'America/New_York';
const SITE_LOCALE = 'en-US';

const pad = (n: number) => String(n).padStart(2, '0');

const partsFormatter = new Intl.DateTimeFormat(SITE_LOCALE, {
  timeZone: SITE_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Wall-clock fields of an instant as read in Briar Chapel. */
function siteParts(d: Date) {
  const p: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(d)) p[part.type] = part.value;
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** Milliseconds Briar Chapel is ahead of UTC at `d` (negative: it is behind). */
function siteOffset(d: Date): number {
  const p = siteParts(d);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - Math.floor(d.getTime() / 1000) * 1000;
}

/** The YYYY-MM-DD day an instant falls on in Briar Chapel. */
export function siteDayKey(d: Date): string {
  const p = siteParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Today in Briar Chapel, as YYYY-MM-DD. */
export function siteToday(): string {
  return siteDayKey(new Date());
}

/** Shift a YYYY-MM-DD key by whole days. Pure calendar math, no timezone. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** The instant a Briar Chapel wall-clock time refers to. */
function siteWallTimeToDate(y: number, m: number, d: number, hh: number, mm: number): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = siteOffset(new Date(guess));
  const instant = guess - first;
  // Re-check at the result: the guess can sit on the other side of a DST
  // change from the answer.
  const second = siteOffset(new Date(instant));
  return new Date(second === first ? instant : guess - second);
}

/** Start of a Briar Chapel day, as an instant -- for querying by day. */
export function siteDayStart(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return siteWallTimeToDate(y, m, d, 0, 0);
}

/**
 * Formats a Date object as YYYY-MM-DD from its runtime-local fields.
 * Calendar arithmetic only (e.g. `new Date(year, month, day)`), where the
 * zone round-trips and cannot matter. For an event's instant use siteDayKey.
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Formats a Date object as a YYYY-MM month key. Calendar arithmetic only, as above. */
export function formatLocalMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

const dateTimeFormatter = new Intl.DateTimeFormat(SITE_LOCALE, {
  timeZone: SITE_TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const timeFormatter = new Intl.DateTimeFormat(SITE_LOCALE, {
  timeZone: SITE_TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
});

/** Formats an event's start and optional end, in Briar Chapel time. */
export function formatDateRange(startISO: string, endISO: string | null): string {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return '';
  const startStr = dateTimeFormatter.format(start);
  const end = endISO ? new Date(endISO) : null;
  if (!end || Number.isNaN(end.getTime())) return startStr;
  const sameDay = siteDayKey(start) === siteDayKey(end);
  return `${startStr} – ${(sameDay ? timeFormatter : dateTimeFormatter).format(end)}`;
}

/** "Wednesday, September 23" for a YYYY-MM-DD key. */
export function formatDayHeading(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  // Noon UTC formatted as UTC: the key is a calendar day, not an instant.
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(SITE_LOCALE, {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** "September 2026" for a zero-based year/month. */
export function formatMonthHeading(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 15)).toLocaleDateString(SITE_LOCALE, {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Every Briar Chapel calendar day an event covers, as YYYY-MM-DD keys.
 * The calendar dots and the day list must both bucket through this, so a day
 * with a dot always has matching entries in the list.
 */
export function eventDayKeys(startISO: string, endISO: string | null): string[] {
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return [];
  const end = endISO ? new Date(endISO) : start;
  const last = isNaN(end.getTime()) || end < start ? start : end;

  const keys: string[] = [];
  const stop = siteDayKey(last);
  let cursor = siteDayKey(start);
  // Guard against a malformed multi-year range pinning the main thread.
  for (let i = 0; cursor <= stop && i < 366; i++) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return keys;
}

/**
 * Format an ISO timestamp for a `datetime-local` input, as Briar Chapel wall
 * time. The input has no timezone of its own, so what it shows is whatever
 * zone we choose to read the instant in -- here, always the site's.
 */
export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = siteParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * The inverse: read a `datetime-local` value as Briar Chapel wall time and
 * return the ISO instant. `new Date(value)` would read it in the *browser's*
 * zone, so an admin travelling out of state would save the wrong time.
 * Returns null for anything that is not a complete YYYY-MM-DDTHH:mm value.
 */
export function fromDateTimeLocalValue(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [y, m, d, hh, mm] = match.slice(1).map(Number);
  const instant = siteWallTimeToDate(y, m, d, hh, mm);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}
