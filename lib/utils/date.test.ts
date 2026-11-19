import { describe, expect, it } from 'vitest';
import {
  addDays,
  eventDayKeys,
  formatDateRange,
  formatDayHeading,
  formatMonthHeading,
  formatPostTime,
  fromDateTimeLocalValue,
  isValidYM,
  isValidYMD,
  siteDayKey,
  siteDayStart,
  toDateTimeLocalValue,
} from '@/lib/utils/date';

// Every assertion here is in Briar Chapel time (America/New_York), whatever
// zone the test machine runs in. In 2026, DST starts March 8 and ends
// November 1.

describe('siteDayKey', () => {
  it('uses the Briar Chapel day, not the UTC day', () => {
    // 10 PM EST on Nov 14 is already Nov 15 in UTC.
    expect(siteDayKey(new Date('2026-11-15T03:00:00Z'))).toBe('2026-11-14');
    expect(siteDayKey(new Date('2026-11-15T05:00:00Z'))).toBe('2026-11-15');
  });

  it('follows daylight saving time', () => {
    // 11:30 PM EDT on Jul 4 is 03:30 UTC on Jul 5.
    expect(siteDayKey(new Date('2026-07-05T03:30:00Z'))).toBe('2026-07-04');
  });
});

describe('addDays', () => {
  it('rolls over months and years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('is not thrown off by DST changes', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });
});

describe('siteDayStart', () => {
  it('is local midnight in standard and daylight time', () => {
    expect(siteDayStart('2026-01-15').toISOString()).toBe('2026-01-15T05:00:00.000Z');
    expect(siteDayStart('2026-07-15').toISOString()).toBe('2026-07-15T04:00:00.000Z');
  });

  it('is right on the days the clocks change', () => {
    expect(siteDayStart('2026-03-08').toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(siteDayStart('2026-11-01').toISOString()).toBe('2026-11-01T04:00:00.000Z');
  });
});

describe('datetime-local round trip', () => {
  it('reads input as Briar Chapel wall time', () => {
    expect(fromDateTimeLocalValue('2026-07-04T19:30')).toBe('2026-07-04T23:30:00.000Z');
    expect(fromDateTimeLocalValue('2026-12-25T19:30')).toBe('2026-12-26T00:30:00.000Z');
  });

  it('takes the first 1:30 AM on the night the clocks fall back', () => {
    expect(fromDateTimeLocalValue('2026-11-01T01:30')).toBe('2026-11-01T05:30:00.000Z');
  });

  it('rejects incomplete values', () => {
    expect(fromDateTimeLocalValue('')).toBeNull();
    expect(fromDateTimeLocalValue('2026-07-04')).toBeNull();
    expect(fromDateTimeLocalValue('not a date')).toBeNull();
  });

  it('shows an instant as Briar Chapel wall time', () => {
    expect(toDateTimeLocalValue('2026-11-15T03:00:00Z')).toBe('2026-11-14T22:00');
    expect(toDateTimeLocalValue(null)).toBe('');
    expect(toDateTimeLocalValue('garbage')).toBe('');
  });

  it('round-trips', () => {
    for (const value of ['2026-01-10T08:05', '2026-06-21T23:59', '2026-11-01T12:00']) {
      expect(toDateTimeLocalValue(fromDateTimeLocalValue(value))).toBe(value);
    }
  });
});

describe('eventDayKeys', () => {
  it('puts an evening event on its local day, even when it ends after UTC midnight', () => {
    // 9-11 PM EST on Nov 14 is 02:00-04:00 UTC on Nov 15.
    expect(eventDayKeys('2026-11-15T02:00:00Z', '2026-11-15T04:00:00Z')).toEqual(['2026-11-14']);
  });

  it('covers every day of a multi-day event', () => {
    expect(eventDayKeys('2026-11-14T15:00:00Z', '2026-11-16T15:00:00Z')).toEqual([
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
    ]);
  });

  it('treats a missing, invalid or earlier end as a one-day event', () => {
    expect(eventDayKeys('2026-11-14T15:00:00Z', null)).toEqual(['2026-11-14']);
    expect(eventDayKeys('2026-11-14T15:00:00Z', 'garbage')).toEqual(['2026-11-14']);
    expect(eventDayKeys('2026-11-14T15:00:00Z', '2026-11-10T15:00:00Z')).toEqual(['2026-11-14']);
  });

  it('returns nothing for an invalid start', () => {
    expect(eventDayKeys('garbage', null)).toEqual([]);
  });

  it('caps a runaway range at 366 days', () => {
    expect(eventDayKeys('2026-01-01T15:00:00Z', '2030-01-01T15:00:00Z')).toHaveLength(366);
  });
});

describe('date validation', () => {
  it('accepts real days only', () => {
    expect(isValidYMD('2026-02-28')).toBe(true);
    expect(isValidYMD('2028-02-29')).toBe(true);
    expect(isValidYMD('2026-02-29')).toBe(false);
    expect(isValidYMD('2026-02-31')).toBe(false);
    expect(isValidYMD('2026-2-3')).toBe(false);
    expect(isValidYMD('abc')).toBe(false);
    expect(isValidYMD(null)).toBe(false);
  });

  it('accepts real months only', () => {
    expect(isValidYM('2026-01')).toBe(true);
    expect(isValidYM('2026-12')).toBe(true);
    expect(isValidYM('2026-00')).toBe(false);
    expect(isValidYM('2026-13')).toBe(false);
    expect(isValidYM(undefined)).toBe(false);
  });
});

describe('formatting', () => {
  it('shows only the end time for a same-day event', () => {
    // \s also matches the narrow no-break space newer ICU puts before "PM".
    expect(formatDateRange('2026-11-15T00:30:00Z', '2026-11-15T02:00:00Z')).toMatch(
      /^Sat, Nov 14, 7:30\sPM – 9:00\sPM$/,
    );
  });

  it('shows the end date for a multi-day event', () => {
    expect(formatDateRange('2026-11-14T15:00:00Z', '2026-11-15T15:00:00Z')).toMatch(
      /^Sat, Nov 14, 10:00\sAM – Sun, Nov 15, 10:00\sAM$/,
    );
  });

  it('returns an empty string for an invalid start', () => {
    expect(formatDateRange('garbage', null)).toBe('');
  });

  it('formats day and month headings from calendar keys', () => {
    expect(formatDayHeading('2026-09-23')).toBe('Wednesday, September 23');
    expect(formatMonthHeading(2026, 8)).toBe('September 2026');
  });
});

describe('formatPostTime', () => {
  const now = new Date('2026-11-18T17:00:00Z'); // noon in Briar Chapel

  it('counts minutes and hours for the last day', () => {
    expect(formatPostTime('2026-11-18T16:59:30Z', now)).toBe('Just now');
    expect(formatPostTime('2026-11-18T16:48:00Z', now)).toBe('12m ago');
    expect(formatPostTime('2026-11-18T12:00:00Z', now)).toBe('5h ago');
    expect(formatPostTime('2026-11-17T17:00:01Z', now)).toBe('23h ago');
  });

  it('shows the Briar Chapel date after a day', () => {
    // 02:00 UTC on Nov 13 is still Nov 12 in Briar Chapel.
    expect(formatPostTime('2026-11-13T02:00:00Z', now)).toBe('Nov 12');
  });

  it('adds the year for an earlier year, judged in Briar Chapel', () => {
    expect(formatPostTime('2025-12-24T15:00:00Z', now)).toBe('Dec 24, 2025');
    // Already 2026 in UTC, still New Year's Eve 2025 in Briar Chapel.
    expect(formatPostTime('2026-01-01T03:00:00Z', now)).toBe('Dec 31, 2025');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatPostTime('not a date', now)).toBe('');
  });
});
