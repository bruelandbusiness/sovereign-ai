/**
 * Comprehensive date/time utilities for the Sovereign AI platform.
 *
 * All functions use native Date and Intl APIs -- no external date libraries.
 * Every public symbol is exported for maximum reuse.
 */

// ── Type Definitions ─────────────────────────────────────────

/** Accepted date input: Date object, ISO string, or Unix timestamp (ms). */
export type DateInput = Date | string | number;

/** A closed date range with inclusive start and end. */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/** Named time periods used by getStartOfPeriod / getEndOfPeriod. */
export type TimePeriod =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

/** Options for the formatDate() function. */
export interface DateFormatOptions {
  /** Display style: short, medium, long, or full. */
  readonly style?: "short" | "medium" | "long" | "full";
  /** BCP 47 locale string. Defaults to "en-US". */
  readonly locale?: string;
  /** Whether to include time in the output. Defaults to false. */
  readonly includeTime?: boolean;
}

/** Preset identifiers accepted by getDateRange(). */
export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "thisYear";

/** Legacy look-back period keys (backward compatibility). */
export type Period = "7d" | "30d" | "90d" | "1y";

// ── Internal Helpers ─────────────────────────────────────────

const DEFAULT_LOCALE = "en-US";

function toDate(input: DateInput): Date {
  if (input instanceof Date) {
    return input;
  }
  return new Date(input);
}

/** Midnight (00:00:00.000) of the given date in local time. */
function startOfDayLocal(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** 23:59:59.999 of the given date in local time. */
function endOfDayLocal(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Number of milliseconds in one day. */
const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1_000;

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatAmPm(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${padTwo(minutes)} ${period}`;
}

// ── Formatting Functions ─────────────────────────────────────

/**
 * Format a date with locale support using Intl.DateTimeFormat.
 *
 * @param date    - The date to format.
 * @param options - Style, locale, and time inclusion settings.
 * @returns The formatted date string.
 */
export function formatDate(
  date: DateInput,
  options: DateFormatOptions = {},
): string {
  const d = toDate(date);
  const locale = options.locale ?? DEFAULT_LOCALE;
  const style = options.style ?? "medium";
  const includeTime = options.includeTime ?? false;

  const dateStyleMap: Record<string, Intl.DateTimeFormatOptions["dateStyle"]> = {
    short: "short",
    medium: "medium",
    long: "long",
    full: "full",
  };

  const intlOptions: Intl.DateTimeFormatOptions = {
    dateStyle: dateStyleMap[style],
    ...(includeTime ? { timeStyle: "short" } : {}),
  };

  return new Intl.DateTimeFormat(locale, intlOptions).format(d);
}

/**
 * Format a date as a human-readable relative string.
 *
 * Examples: "2 hours ago", "in 3 days", "yesterday", "just now".
 *
 * @param date - The date to compare against now.
 * @returns A relative time string.
 */
export function formatRelative(date: DateInput): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs > 0;

  const wrap = (value: string): string =>
    isPast ? `${value} ago` : `in ${value}`;

  if (absDiff < MS_PER_MINUTE) {
    return isPast ? "just now" : "in a few seconds";
  }

  const minutes = Math.floor(absDiff / MS_PER_MINUTE);
  if (minutes < 60) {
    const label = minutes === 1 ? "1 minute" : `${minutes} minutes`;
    return wrap(label);
  }

  const hours = Math.floor(absDiff / MS_PER_HOUR);
  if (hours < 24) {
    const label = hours === 1 ? "1 hour" : `${hours} hours`;
    return wrap(label);
  }

  const days = Math.floor(absDiff / MS_PER_DAY);
  if (days === 1) {
    return isPast ? "yesterday" : "tomorrow";
  }
  if (days < 7) {
    return wrap(`${days} days`);
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const label = weeks === 1 ? "1 week" : `${weeks} weeks`;
    return wrap(label);
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    const label = months === 1 ? "1 month" : `${months} months`;
    return wrap(label);
  }

  const years = Math.floor(days / 365);
  const label = years === 1 ? "1 year" : `${years} years`;
  return wrap(label);
}

/**
 * Format a duration (in milliseconds) as a human-readable string.
 *
 * Examples: "2h 15m", "3 days 4 hours", "45s".
 *
 * @param ms - Duration in milliseconds.
 * @returns A compact duration string.
 */
export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);

  if (abs < MS_PER_SECOND) {
    return "0s";
  }

  const days = Math.floor(abs / MS_PER_DAY);
  const hours = Math.floor((abs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((abs % MS_PER_HOUR) / MS_PER_MINUTE);
  const seconds = Math.floor((abs % MS_PER_MINUTE) / MS_PER_SECOND);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(days === 1 ? "1 day" : `${days} days`);
  }
  if (hours > 0) {
    parts.push(days > 0 ? (hours === 1 ? "1 hour" : `${hours} hours`) : `${hours}h`);
  }
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0 && days === 0 && hours === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

// ── Legacy Formatting (backward compatibility) ───────────────

/**
 * Short date: "Mar 28, 2026".
 *
 * @param date - The date to format.
 */
export function formatShort(date: DateInput): string {
  const d = toDate(date);
  const month = MONTHS_SHORT[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Full date with time: "March 28, 2026 at 2:30 PM".
 *
 * @param date - The date to format.
 */
export function formatFull(date: DateInput): string {
  const d = toDate(date);
  const month = MONTHS_FULL[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const time = formatAmPm(d.getHours(), d.getMinutes());
  return `${month} ${day}, ${year} at ${time}`;
}

/**
 * Date range: "Mar 22 - Mar 28, 2026".
 * When both dates share the same year, the year appears only at the end.
 *
 * @param start - Range start date.
 * @param end   - Range end date.
 */
export function formatDateRange(start: DateInput, end: DateInput): string {
  const s = toDate(start);
  const e = toDate(end);

  const fmt = (d: Date, includeYear: boolean): string => {
    const month = MONTHS_SHORT[d.getMonth()];
    const day = d.getDate();
    return includeYear ? `${month} ${day}, ${d.getFullYear()}` : `${month} ${day}`;
  };

  const sameYear = s.getFullYear() === e.getFullYear();
  return sameYear
    ? `${fmt(s, false)} - ${fmt(e, true)}`
    : `${fmt(s, true)} - ${fmt(e, true)}`;
}

/**
 * ISO date string (date only): "2026-03-28".
 *
 * @param date - The date to format.
 */
export function toISODateString(date: DateInput): string {
  const d = toDate(date);
  const year = d.getFullYear();
  const month = padTwo(d.getMonth() + 1);
  const day = padTwo(d.getDate());
  return `${year}-${month}-${day}`;
}

// ── Range Functions ──────────────────────────────────────────

/**
 * Create a DateRange from a named preset.
 *
 * @param preset - One of the recognized preset names.
 * @returns A DateRange with start and end Dates.
 */
export function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = startOfDayLocal(now);

  switch (preset) {
    case "today":
      return { start: today, end: endOfDayLocal(now) };

    case "yesterday": {
      const yesterday = new Date(today.getTime() - MS_PER_DAY);
      return { start: yesterday, end: endOfDayLocal(yesterday) };
    }

    case "last7days":
      return {
        start: new Date(today.getTime() - 6 * MS_PER_DAY),
        end: endOfDayLocal(now),
      };

    case "last30days":
      return {
        start: new Date(today.getTime() - 29 * MS_PER_DAY),
        end: endOfDayLocal(now),
      };

    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }

    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }

    case "thisQuarter": {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qStart, 1);
      const end = new Date(now.getFullYear(), qStart + 3, 0, 23, 59, 59, 999);
      return { start, end };
    }

    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

/**
 * Check whether a date falls within a range (inclusive).
 *
 * @param date  - The date to test.
 * @param range - The range to test against.
 * @returns True if the date is within [range.start, range.end].
 */
export function isWithinRange(date: DateInput, range: DateRange): boolean {
  const ts = toDate(date).getTime();
  return ts >= range.start.getTime() && ts <= range.end.getTime();
}

/**
 * Count the number of overlapping calendar days between two ranges.
 *
 * @param a - First date range.
 * @param b - Second date range.
 * @returns The number of overlapping days (0 if no overlap).
 */
export function getOverlappingDays(a: DateRange, b: DateRange): number {
  const overlapStart = Math.max(a.start.getTime(), b.start.getTime());
  const overlapEnd = Math.min(a.end.getTime(), b.end.getTime());

  if (overlapStart > overlapEnd) {
    return 0;
  }

  const startDay = startOfDayLocal(new Date(overlapStart));
  const endDay = startOfDayLocal(new Date(overlapEnd));

  return Math.floor((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1;
}

// ── Legacy Range Helper (backward compatibility) ─────────────

/**
 * Returns true when `date` is within the last `days` days (inclusive).
 *
 * @param date - The date to check.
 * @param days - Number of look-back days.
 */
export function isWithinDays(date: DateInput, days: number): boolean {
  const cutoff = startOfDayLocal(
    new Date(new Date().getTime() - days * MS_PER_DAY),
  );
  return toDate(date).getTime() >= cutoff.getTime();
}

// ── Business Logic ───────────────────────────────────────────

/**
 * Check whether a date is a business day (Monday-Friday).
 *
 * @param date - The date to check.
 * @returns True if the date falls on Monday through Friday.
 */
export function isBusinessDay(date: DateInput): boolean {
  const day = toDate(date).getDay();
  return day >= 1 && day <= 5;
}

/**
 * Count business days (Mon-Fri) between two dates, exclusive of both ends.
 *
 * To count inclusive of start, use startDate - 1 day.
 *
 * @param startDate - The start date (exclusive).
 * @param endDate   - The end date (exclusive).
 * @returns Number of business days between the two dates.
 */
export function getBusinessDays(
  startDate: DateInput,
  endDate: DateInput,
): number {
  const start = startOfDayLocal(toDate(startDate));
  const end = startOfDayLocal(toDate(endDate));

  if (start.getTime() >= end.getTime()) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor.getTime() < end.getTime()) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/**
 * Add N business days to a date, skipping weekends.
 *
 * @param date - The starting date.
 * @param days - Number of business days to add (can be negative).
 * @returns A new Date after adding the business days.
 */
export function addBusinessDays(date: DateInput, days: number): Date {
  const result = new Date(toDate(date));
  const direction = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);

  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    const dow = result.getDay();
    if (dow >= 1 && dow <= 5) {
      remaining--;
    }
  }

  return result;
}

/**
 * Get the quarter number (1-4) for a date.
 *
 * @param date - The date to evaluate.
 * @returns The quarter as a number: 1, 2, 3, or 4.
 */
export function getQuarter(date: DateInput): number {
  return Math.floor(toDate(date).getMonth() / 3) + 1;
}

/**
 * Get the start of a time period for a given date.
 *
 * @param period - The time period: day, week, month, quarter, or year.
 * @param date   - The reference date. Defaults to now.
 * @returns A new Date at the start of the period.
 */
export function getStartOfPeriodByUnit(
  period: TimePeriod,
  date: DateInput = new Date(),
): Date {
  const d = toDate(date);

  switch (period) {
    case "day":
      return startOfDayLocal(d);

    case "week": {
      const result = startOfDayLocal(d);
      const dow = result.getDay();
      // Start of week = Sunday (day 0)
      result.setDate(result.getDate() - dow);
      return result;
    }

    case "month":
      return new Date(d.getFullYear(), d.getMonth(), 1);

    case "quarter": {
      const qStart = Math.floor(d.getMonth() / 3) * 3;
      return new Date(d.getFullYear(), qStart, 1);
    }

    case "year":
      return new Date(d.getFullYear(), 0, 1);
  }
}

/**
 * Get the end of a time period for a given date.
 *
 * @param period - The time period: day, week, month, quarter, or year.
 * @param date   - The reference date. Defaults to now.
 * @returns A new Date at the end of the period (23:59:59.999).
 */
export function getEndOfPeriod(
  period: TimePeriod,
  date: DateInput = new Date(),
): Date {
  const d = toDate(date);

  switch (period) {
    case "day":
      return endOfDayLocal(d);

    case "week": {
      const result = startOfDayLocal(d);
      const dow = result.getDay();
      result.setDate(result.getDate() + (6 - dow));
      return endOfDayLocal(result);
    }

    case "month":
      return new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23, 59, 59, 999,
      );

    case "quarter": {
      const qEnd = Math.floor(d.getMonth() / 3) * 3 + 3;
      return new Date(d.getFullYear(), qEnd, 0, 23, 59, 59, 999);
    }

    case "year":
      return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }
}

/**
 * Legacy getStartOfPeriod: returns the start Date for a look-back period.
 *
 * @param period - One of "7d", "30d", "90d", "1y".
 * @returns A Date at midnight for the start of the look-back window.
 */
export function getStartOfPeriod(period: Period): Date {
  const now = new Date();

  const periodDays: Record<Period, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };

  const days = periodDays[period];
  const result = new Date(now.getTime() - days * MS_PER_DAY);
  return startOfDayLocal(result);
}

// ── Comparison Functions ─────────────────────────────────────

/**
 * Check whether two dates fall on the same calendar day.
 *
 * @param a - First date.
 * @param b - Second date.
 */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Check whether two dates fall in the same calendar month and year.
 *
 * @param a - First date.
 * @param b - Second date.
 */
export function isSameMonth(a: DateInput, b: DateInput): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth()
  );
}

/**
 * Check whether two dates fall in the same calendar year.
 *
 * @param a - First date.
 * @param b - Second date.
 */
export function isSameYear(a: DateInput, b: DateInput): boolean {
  return toDate(a).getFullYear() === toDate(b).getFullYear();
}

/**
 * Count the number of calendar days between two dates.
 *
 * The result is always non-negative regardless of argument order.
 *
 * @param a - First date.
 * @param b - Second date.
 * @returns Absolute number of days between the two dates.
 */
export function daysBetween(a: DateInput, b: DateInput): number {
  const da = startOfDayLocal(toDate(a));
  const db = startOfDayLocal(toDate(b));
  return Math.round(Math.abs(da.getTime() - db.getTime()) / MS_PER_DAY);
}
