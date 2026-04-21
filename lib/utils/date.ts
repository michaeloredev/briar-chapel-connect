/**
 * Converts an ISO date string to a local YYYY-MM-DD key.
 * Avoids UTC off-by-one issues when comparing calendar days.
 */
export function toLocalYMD(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
 * Parses a YYYY-MM-DD string into a local Date (midnight).
 */
export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
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
