// Google Calendar integration
// Uses GOOGLE_CALENDAR_KEY env var for API access
// Returns mock data when not configured

import { logger } from "@/lib/logger";
import {
  fetchWithRetry,
} from "@/lib/integrations/integration-utils";

// ── Types ────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  status: string;
}

export interface CalendarSlot {
  start: string;
  end: string;
}

interface BookingLike {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  serviceType?: string | null;
  startsAt: Date;
  endsAt: Date;
}

interface FreeBusyResponse {
  calendars: Record<
    string,
    { busy: Array<{ start: string; end: string }> }
  >;
}

// ── Config ───────────────────────────────────────────────────

const TAG = "google-calendar";

// Read env lazily so runtime changes are picked up
function getApiKey(): string | undefined {
  return process.env.GOOGLE_CALENDAR_KEY;
}

function isConfigured(): boolean {
  return !!getApiKey();
}

/**
 * Build a Google Calendar API URL with the API key passed via header-safe
 * mechanism. The Google Calendar v3 REST API requires the key as a query
 * parameter, but we keep the URL construction centralised here so that
 * callers never handle the raw key.
 */
function calendarUrl(path: string): string {
  return `https://www.googleapis.com/calendar/v3${path}?key=${getApiKey()}`;
}

const RETRY_OPTS = { integration: TAG };

// ── Sync booking to Google Calendar ─────────────────────────

export async function syncBookingToCalendar(
  booking: BookingLike,
  calendarId: string,
  timezone: string = "America/Chicago"
): Promise<CalendarEvent> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] GOOGLE_CALENDAR_KEY not set — returning mock event`);
    return {
      id: `mock-gcal-${booking.id}`,
      summary: `${booking.customerName} — ${booking.serviceType || "Appointment"}`,
      description: `Booking ID: ${booking.id}\nCustomer: ${booking.customerName}\nEmail: ${booking.customerEmail || "N/A"}`,
      start: booking.startsAt.toISOString(),
      end: booking.endsAt.toISOString(),
      status: "confirmed",
    };
  }

  const response = await fetchWithRetry(
    calendarUrl(`/calendars/${encodeURIComponent(calendarId)}/events`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `${booking.customerName} — ${booking.serviceType || "Appointment"}`,
        description: `Booking ID: ${booking.id}\nCustomer: ${booking.customerName}\nEmail: ${booking.customerEmail || "N/A"}`,
        start: {
          dateTime: booking.startsAt.toISOString(),
          timeZone: timezone,
        },
        end: {
          dateTime: booking.endsAt.toISOString(),
          timeZone: timezone,
        },
        status: "confirmed",
      }),
    },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
    status: string;
  };

  logger.info(`[${TAG}] Event synced`, { eventId: data.id, bookingId: booking.id });

  return {
    id: data.id,
    summary: data.summary,
    description: data.description,
    start: data.start.dateTime,
    end: data.end.dateTime,
    status: data.status,
  };
}

// ── Delete a calendar event ─────────────────────────────────

export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string
): Promise<boolean> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] GOOGLE_CALENDAR_KEY not set — mock delete`);
    return true;
  }

  try {
    await fetchWithRetry(
      calendarUrl(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`),
      { method: "DELETE" },
      undefined,
      RETRY_OPTS,
    );

    return true;
  } catch (err) {
    // 404 is acceptable (event already deleted)
    if (err instanceof Error && err.message.includes("404")) {
      return true;
    }
    throw err;
  }
}

// ── Get available slots from calendar ───────────────────────

export async function getAvailableSlots(
  calendarId: string,
  date: Date,
  duration: number // minutes
): Promise<CalendarSlot[]> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] GOOGLE_CALENDAR_KEY not set — returning empty (use local slot generation)`);
    // Return empty to signal that the caller should use local logic
    return [];
  }

  // Query freebusy for this date
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  try {
    const response = await fetchWithRetry(
      calendarUrl("/freeBusy"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          items: [{ id: calendarId }],
        }),
      },
      undefined,
      RETRY_OPTS,
    );

    const data = (await response.json()) as FreeBusyResponse;
    const busySlots = data.calendars?.[calendarId]?.busy || [];

    // Generate available slots (9 AM - 5 PM) minus busy periods
    const slots: CalendarSlot[] = [];
    const businessStart = new Date(date);
    businessStart.setHours(9, 0, 0, 0);
    const businessEnd = new Date(date);
    businessEnd.setHours(17, 0, 0, 0);

    let cursor = new Date(businessStart);
    while (cursor.getTime() + duration * 60 * 1000 <= businessEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + duration * 60 * 1000);

      const isBusy = busySlots.some((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return cursor < busyEnd && slotEnd > busyStart;
      });

      if (!isBusy) {
        slots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
        });
      }

      cursor = new Date(slotEnd);
    }

    return slots;
  } catch (err) {
    logger.error(`[${TAG}] FreeBusy API error, falling back to local slots`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
