export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AvailabilityConfig {
  timezone: string;
  businessHours: { start: number; end: number }; // e.g., { start: 8, end: 18 }
  slotDurationMinutes: number; // e.g., 30, 60
  bufferMinutes: number; // gap between appointments, e.g., 15
  daysAhead: number; // how many days to show, e.g., 14
  blockedDays?: number[]; // 0=Sun, 6=Sat
  blockedDates?: string[]; // ISO dates to block (holidays)
}

export const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  timezone: "America/New_York",
  businessHours: { start: 8, end: 18 },
  slotDurationMinutes: 60,
  bufferMinutes: 15,
  daysAhead: 14,
  blockedDays: [0], // Sundays off
};

/**
 * Check whether two time ranges overlap, optionally including a buffer
 * around the existing booking.
 */
function rangesOverlap(
  slotStart: Date,
  slotEnd: Date,
  bookingStart: Date,
  bookingEnd: Date,
  bufferMinutes: number,
): boolean {
  const bufferedBookingStart = new Date(
    bookingStart.getTime() - bufferMinutes * 60_000,
  );
  const bufferedBookingEnd = new Date(
    bookingEnd.getTime() + bufferMinutes * 60_000,
  );
  return slotStart < bufferedBookingEnd && slotEnd > bufferedBookingStart;
}

/**
 * Return the start of the day (midnight) for a given date, expressed in the
 * provided IANA timezone. We lean on `Intl.DateTimeFormat` so no external
 * libraries are required.
 */
function startOfDayInTimezone(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  // Build a date string that Date.parse can handle in the target timezone.
  const iso = `${year}-${month}-${day}T00:00:00`;
  // Create a date formatter that can tell us the UTC offset for this instant.
  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const tzParts = utcFormatter.formatToParts(date);
  const tzName = tzParts.find((p) => p.type === "timeZoneName")!.value; // e.g. "GMT-5"

  // Parse the offset string into a numeric offset.
  const offsetMatch = tzName.match(/GMT([+-]?\d+)?(?::(\d+))?/);
  let offsetMinutes = 0;
  if (offsetMatch) {
    const hours = parseInt(offsetMatch[1] || "0", 10);
    const mins = parseInt(offsetMatch[2] || "0", 10);
    offsetMinutes = hours * 60 + (hours < 0 ? -mins : mins);
  }

  // Construct the UTC timestamp for midnight in the target timezone.
  const utcMs = Date.parse(iso + "Z") - offsetMinutes * 60_000;
  return new Date(utcMs);
}

/**
 * Format a Date as an ISO date string (YYYY-MM-DD) in the given timezone.
 */
function toISODateString(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // en-CA gives YYYY-MM-DD
}

/**
 * Get the day-of-week (0 = Sun .. 6 = Sat) for a Date in a given timezone.
 */
function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const weekday = formatter.format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

/**
 * Generate available time slots for the next N days,
 * excluding existing bookings and blocked times.
 */
export function getAvailableSlots(
  config: AvailabilityConfig,
  existingBookings: { startsAt: Date; endsAt: Date }[],
  fromDate?: Date,
): TimeSlot[] {
  const now = fromDate ?? new Date();
  const slots: TimeSlot[] = [];
  const {
    timezone,
    businessHours,
    slotDurationMinutes,
    bufferMinutes,
    daysAhead,
    blockedDays = [],
    blockedDates = [],
  } = config;

  const blockedDateSet = new Set(blockedDates);

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const dayStart = new Date(now.getTime() + dayOffset * 86_400_000);
    const midnightLocal = startOfDayInTimezone(dayStart, timezone);

    // Check blocked day-of-week
    const dow = getDayOfWeekInTimezone(midnightLocal, timezone);
    if (blockedDays.includes(dow)) continue;

    // Check blocked specific dates
    const dateStr = toISODateString(midnightLocal, timezone);
    if (blockedDateSet.has(dateStr)) continue;

    // Generate slots within business hours for this day
    const businessStart = new Date(
      midnightLocal.getTime() + businessHours.start * 3_600_000,
    );
    const businessEnd = new Date(
      midnightLocal.getTime() + businessHours.end * 3_600_000,
    );

    let cursor = businessStart;
    while (cursor.getTime() + slotDurationMinutes * 60_000 <= businessEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(
        cursor.getTime() + slotDurationMinutes * 60_000,
      );

      // Skip slots that are in the past
      if (slotEnd > now) {
        const available = isSlotAvailable(
          { start: slotStart, end: slotEnd },
          existingBookings,
          bufferMinutes,
        );
        slots.push({ start: slotStart, end: slotEnd, available });
      }

      cursor = new Date(cursor.getTime() + slotDurationMinutes * 60_000);
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Check if a specific time slot is available.
 */
export function isSlotAvailable(
  slot: { start: Date; end: Date },
  existingBookings: { startsAt: Date; endsAt: Date }[],
  bufferMinutes: number,
): boolean {
  for (const booking of existingBookings) {
    if (
      rangesOverlap(
        slot.start,
        slot.end,
        booking.startsAt,
        booking.endsAt,
        bufferMinutes,
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Find the next available slot from a given date.
 */
export function getNextAvailableSlot(
  config: AvailabilityConfig,
  existingBookings: { startsAt: Date; endsAt: Date }[],
  fromDate?: Date,
): TimeSlot | null {
  const slots = getAvailableSlots(config, existingBookings, fromDate);
  return slots.find((s) => s.available) ?? null;
}
