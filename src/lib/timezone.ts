/**
 * Timezone utilities for consistent date/time handling across the platform.
 * Uses only built-in Intl APIs — no external dependencies.
 */

/**
 * Common US timezones for home service businesses.
 */
export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
] as const;

export type USTimezoneValue = (typeof US_TIMEZONES)[number]["value"];

/**
 * Format a date in a client's timezone for display.
 *
 * @param date - The date to format.
 * @param timezone - IANA timezone string (e.g. "America/New_York").
 * @param format - Output style: "date", "time", "datetime", or "relative".
 * @returns A human-readable string in the given timezone.
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  format: "date" | "time" | "datetime" | "relative" = "datetime",
): string {
  if (format === "relative") {
    return getRelativeTime(date);
  }

  const options: Intl.DateTimeFormatOptions = { timeZone: timezone };

  if (format === "date" || format === "datetime") {
    options.year = "numeric";
    options.month = "short";
    options.day = "numeric";
  }

  if (format === "time" || format === "datetime") {
    options.hour = "numeric";
    options.minute = "2-digit";
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Get the current time in a specific timezone.
 *
 * Returns a Date whose UTC value equals the wall-clock time in the
 * given timezone. This is useful for comparisons against local hours
 * but should NOT be serialised as UTC.
 *
 * @param timezone - IANA timezone string.
 * @returns A Date representing the current wall-clock time in that timezone.
 */
export function nowInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  return new Date(
    parseInt(get("year"), 10),
    parseInt(get("month"), 10) - 1,
    parseInt(get("day"), 10),
    parseInt(get("hour"), 10) % 24,
    parseInt(get("minute"), 10),
    parseInt(get("second"), 10),
  );
}

/**
 * Check if a given time is within business hours in a timezone.
 *
 * @param date - The date/time to check.
 * @param timezone - IANA timezone string.
 * @param startHour - Start of business hours (inclusive, 0-23). Default 8.
 * @param endHour - End of business hours (exclusive, 0-23). Default 20.
 * @returns True when the local hour falls within [startHour, endHour).
 */
export function isBusinessHours(
  date: Date,
  timezone: string,
  startHour: number = 8,
  endHour: number = 20,
): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hourStr = parts.find((p) => p.type === "hour")?.value ?? "0";
  const hour = parseInt(hourStr, 10) % 24;

  return hour >= startHour && hour < endHour;
}

/**
 * Get a relative time string (e.g. "2 hours ago", "in 3 days").
 *
 * Uses Intl.RelativeTimeFormat for locale-aware output.
 *
 * @param date - The date to compare against now.
 * @returns A human-readable relative time string.
 */
export function getRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);

  const SECOND = 1_000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  if (absDiffMs < MINUTE) {
    return rtf.format(Math.round(diffMs / SECOND), "second");
  }
  if (absDiffMs < HOUR) {
    return rtf.format(Math.round(diffMs / MINUTE), "minute");
  }
  if (absDiffMs < DAY) {
    return rtf.format(Math.round(diffMs / HOUR), "hour");
  }
  if (absDiffMs < WEEK) {
    return rtf.format(Math.round(diffMs / DAY), "day");
  }
  if (absDiffMs < MONTH) {
    return rtf.format(Math.round(diffMs / WEEK), "week");
  }
  if (absDiffMs < YEAR) {
    return rtf.format(Math.round(diffMs / MONTH), "month");
  }

  return rtf.format(Math.round(diffMs / YEAR), "year");
}

/**
 * Zip-code prefix to timezone mapping for the continental US,
 * Alaska, and Hawaii. Based on the first 3 digits of the zip code.
 */
const ZIP_PREFIX_TO_TIMEZONE: Record<string, string> = {
  // Eastern Time
  ...Object.fromEntries(
    [
      // CT, MA, ME, NH, NJ, NY, PA, RI, VT, DE, DC, MD, VA, WV, NC, SC, GA, FL (east)
      ...range(0, 9),    // 000-099: New England & NJ/NY
      ...range(10, 14),  // 100-149: NY
      ...range(15, 19),  // 150-199: PA
      ...range(20, 26),  // 200-269: DC/MD/VA/WV
      ...range(27, 29),  // 270-299: NC/SC
      ...range(30, 31),  // 300-319: GA
      ...range(32, 34),  // 320-349: FL
      ...range(39, 39),  // 390-399: MS (eastern edge, simplified)
      ...range(40, 42),  // 400-429: KY
      ...range(43, 45),  // 430-459: OH
      ...range(46, 47),  // 460-479: IN
      ...range(48, 49),  // 480-499: MI
    ].map((n) => [String(n).padStart(3, "0").slice(0, 3), "America/New_York"]),
  ),

  // Central Time
  ...Object.fromEntries(
    [
      ...range(35, 36),  // 350-369: AL
      ...range(37, 38),  // 370-389: TN
      ...range(50, 52),  // 500-529: IA/WI
      ...range(53, 54),  // 530-549: WI
      ...range(55, 56),  // 550-569: MN
      ...range(57, 57),  // 570-579: SD
      ...range(58, 58),  // 580-589: ND
      ...range(59, 59),  // 590-599: MT (eastern, simplified to Central)
      ...range(60, 62),  // 600-629: IL
      ...range(63, 65),  // 630-659: MO/KS
      ...range(66, 67),  // 660-679: KS
      ...range(68, 69),  // 680-699: NE
      ...range(70, 71),  // 700-719: LA
      ...range(72, 72),  // 720-729: AR
      ...range(73, 74),  // 730-749: OK
      ...range(75, 79),  // 750-799: TX
    ].map((n) => [String(n).padStart(3, "0").slice(0, 3), "America/Chicago"]),
  ),

  // Mountain Time
  ...Object.fromEntries(
    [
      ...range(80, 81),  // 800-819: CO
      ...range(82, 83),  // 820-839: WY/ID
      ...range(84, 84),  // 840-849: UT
      ...range(85, 86),  // 850-869: AZ/NM
      ...range(87, 88),  // 870-889: NM/MT
      ...range(89, 89),  // 890-899: NV (parts)
    ].map((n) => [String(n).padStart(3, "0").slice(0, 3), "America/Denver"]),
  ),

  // Pacific Time
  ...Object.fromEntries(
    [
      ...range(90, 96),  // 900-969: CA/WA/OR
      ...range(97, 97),  // 970-979: OR
      ...range(98, 99),  // 980-999: WA
    ].map((n) => [String(n).padStart(3, "0").slice(0, 3), "America/Los_Angeles"]),
  ),

  // Alaska
  "995": "America/Anchorage",
  "996": "America/Anchorage",
  "997": "America/Anchorage",
  "998": "America/Anchorage",
  "999": "America/Anchorage",

  // Hawaii
  "967": "Pacific/Honolulu",
  "968": "Pacific/Honolulu",
};

/**
 * Generate an inclusive range of integers.
 */
function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}

/**
 * Detect timezone from a US zip code (approximate).
 *
 * Uses a mapping based on the first 2-3 digits of the zip code.
 * This is an approximation — some zip codes near timezone borders
 * may return an incorrect result.
 *
 * @param zip - A 5-digit US zip code string.
 * @returns An IANA timezone string, defaulting to "America/New_York".
 */
export function guessTimezoneFromZip(zip: string): string {
  const cleaned = zip.replace(/\D/g, "").slice(0, 5);

  if (cleaned.length < 3) {
    return "America/New_York";
  }

  const prefix3 = cleaned.slice(0, 3);
  if (ZIP_PREFIX_TO_TIMEZONE[prefix3]) {
    return ZIP_PREFIX_TO_TIMEZONE[prefix3];
  }

  const prefix2 = cleaned.slice(0, 2);
  const matchingKey = Object.keys(ZIP_PREFIX_TO_TIMEZONE).find(
    (key) => key.startsWith(prefix2) || key.slice(0, 2) === prefix2,
  );

  if (matchingKey) {
    return ZIP_PREFIX_TO_TIMEZONE[matchingKey];
  }

  return "America/New_York";
}
