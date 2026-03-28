import {
  format,
  formatDistanceToNow,
  isAfter,
  subDays,
  subYears,
  startOfDay,
} from "date-fns";

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/**
 * Relative time label: "2 hours ago", "yesterday", etc.
 */
export function formatRelative(date: DateInput): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}

/**
 * Short date: "Mar 28, 2026"
 */
export function formatShort(date: DateInput): string {
  return format(toDate(date), "MMM d, yyyy");
}

/**
 * Full date with time: "March 28, 2026 at 2:30 PM"
 */
export function formatFull(date: DateInput): string {
  return format(toDate(date), "MMMM d, yyyy 'at' h:mm a");
}

/**
 * Date range: "Mar 22 - Mar 28, 2026"
 *
 * When both dates share the same year, the year appears only at the end.
 */
export function formatDateRange(start: DateInput, end: DateInput): string {
  const s = toDate(start);
  const e = toDate(end);

  const sameYear = s.getFullYear() === e.getFullYear();

  if (sameYear) {
    return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
  }

  return `${format(s, "MMM d, yyyy")} - ${format(e, "MMM d, yyyy")}`;
}

/**
 * Returns true when `date` is within the last `days` days (inclusive).
 */
export function isWithinDays(date: DateInput, days: number): boolean {
  const cutoff = startOfDay(subDays(new Date(), days));
  return isAfter(toDate(date), cutoff);
}

const PERIOD_MAP = {
  "7d": () => subDays(new Date(), 7),
  "30d": () => subDays(new Date(), 30),
  "90d": () => subDays(new Date(), 90),
  "1y": () => subYears(new Date(), 1),
} as const;

export type Period = keyof typeof PERIOD_MAP;

/**
 * Returns the start Date for the given look-back period.
 */
export function getStartOfPeriod(period: Period): Date {
  return startOfDay(PERIOD_MAP[period]());
}

/**
 * ISO date string (date only): "2026-03-28"
 */
export function toISODateString(date: DateInput): string {
  return format(toDate(date), "yyyy-MM-dd");
}
