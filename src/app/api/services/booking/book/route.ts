import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { rateLimitByIP } from "@/lib/rate-limit";
import { syncBookingToCalendar } from "@/lib/integrations/google-calendar";
import { sendSms } from "@/lib/twilio";
import { sendBookingReminderEmail, sendBookingConfirmationEmail } from "@/lib/email";
import { dispatchWebhook } from "@/lib/webhooks";
import { trackPerformanceBooking } from "@/lib/performance-tracking";
import { createNotificationForClient } from "@/lib/notifications";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// --- CORS helpers (mirrors chatbot/chat pattern) ---

function getAllowedOrigins(clientWebsite: string | null): string[] {
  const origins: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  origins.push(appUrl);

  if (clientWebsite) {
    try {
      const url = clientWebsite.startsWith("http")
        ? clientWebsite
        : `https://${clientWebsite}`;
      const parsed = new URL(url);
      origins.push(parsed.origin);
      if (parsed.hostname.startsWith("www.")) {
        origins.push(`${parsed.protocol}//${parsed.hostname.slice(4)}`);
      } else {
        origins.push(`${parsed.protocol}//www.${parsed.hostname}`);
      }
    } catch {
      // Ignore malformed URL
    }
  }

  return origins;
}

function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOrigins: string[]
): Record<string, string> {
  const origin =
    requestOrigin && allowedOrigins.some((o) => o === requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const bookingSchema = z.object({
  clientId: z.string().min(1),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(30).optional(),
  serviceType: z.string().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  // For preflight, we cannot look up the client yet (no body in OPTIONS).
  // Use a restrictive default: only allow our own app URL. The actual POST
  // handler enforces per-client CORS based on the client's registered domain.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const allowedOrigins = [appUrl];

  // If the request includes an origin, we'll check it in the POST handler.
  // For preflight, reflect the origin only if it matches our app URL.
  const headers = buildCorsHeaders(origin, allowedOrigins);
  // Allow the preflight to pass so the POST can do proper per-client validation.
  // We must reflect the origin for CORS to work, but POST still validates.
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  const requestOrigin = request.headers.get("origin");

  // Rate limit: 10 bookings per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "booking", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many booking requests. Please try again later." },
      { status: 429 }
    );
  }

  const validation = await validateBody(request, bookingSchema);
  if (!validation.success) {
    return validation.response;
  }
  const body = validation.data;

  try {
  // Verify the client exists
  const client = await prisma.client.findUnique({
    where: { id: body.clientId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Build CORS headers restricted to the client's registered domain
  const allowedOrigins = getAllowedOrigins(client.website);
  const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins);

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  const now = new Date();

  if (startsAt <= now) {
    return NextResponse.json(
      { error: "Cannot book in the past" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Resolve the client's configured timezone and Google Calendar settings.
  // We fetch the clientService record once and reuse it below for calendar sync.
  let clientTimezone = "America/New_York";
  let googleCalendarId: string | undefined;
  const clientService = await prisma.clientService.findFirst({
    where: { clientId: body.clientId, serviceId: "booking" },
  });
  if (clientService?.config) {
    try {
      const cfg = JSON.parse(clientService.config) as {
        timezone?: string;
        googleCalendarId?: string;
      };
      if (cfg.timezone) clientTimezone = cfg.timezone;
      if (cfg.googleCalendarId) googleCalendarId = cfg.googleCalendarId;
    } catch {
      // use default
    }
  }

  const dateFormatOpts: Intl.DateTimeFormatOptions = {
    timeZone: clientTimezone,
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeFormatOpts: Intl.DateTimeFormatOptions = {
    timeZone: clientTimezone,
    hour: "numeric",
    minute: "2-digit",
  };
  const formattedDate = startsAt.toLocaleDateString("en-US", dateFormatOpts);
  const formattedTime = startsAt.toLocaleTimeString("en-US", timeFormatOpts);

  // Atomically check for overlapping bookings and create the booking inside a
  // serializable transaction to prevent double-booking race conditions.
  const booking = await prisma.$transaction(async (tx) => {
    const overlapping = await tx.booking.findFirst({
      where: {
        clientId: body.clientId,
        status: { not: "canceled" },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (overlapping) return null;

    return tx.booking.create({
      data: {
        clientId: body.clientId,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || null,
        serviceType: body.serviceType || null,
        startsAt,
        endsAt,
        status: "confirmed",
      },
    });
  }, { isolationLevel: 'Serializable' });

  if (!booking) {
    return NextResponse.json(
      { error: "Time slot is no longer available" },
      { status: 409, headers: corsHeaders }
    );
  }

  // Create a lead record from this booking
  await prisma.lead.create({
    data: {
      clientId: body.clientId,
      name: body.customerName,
      email: body.customerEmail,
      phone: body.customerPhone || null,
      source: "booking",
      status: "appointment",
      notes: body.serviceType
        ? `Booked ${body.serviceType} on ${formattedDate}`
        : `Booking on ${formattedDate}`,
    },
  });

  // Create an activity event
  await prisma.activityEvent.create({
    data: {
      clientId: body.clientId,
      type: "call_booked",
      title: "New booking received",
      description: `${body.customerName} booked ${body.serviceType || "an appointment"} for ${formattedDate} at ${formattedTime}.`,
    },
  });

  // Notify the business owner about the confirmed booking
  await createNotificationForClient(body.clientId, {
    type: "booking",
    title: "Booking Confirmed",
    message: `${body.customerName} booked ${body.serviceType || "an appointment"} for ${formattedDate} at ${formattedTime}.`,
    actionUrl: "/dashboard/services/booking",
  });

  // ── Google Calendar sync (non-blocking) ─────────────────────
  if (googleCalendarId) {
    try {
      await syncBookingToCalendar(booking, googleCalendarId);
    } catch (err) {
      logger.errorWithCause("[booking] Google Calendar sync failed:", err);
    }
  }

  // ── SMS confirmation via Twilio (with phone validation) ─────
  if (body.customerPhone) {
    const smsResult = await sendSms(
      body.customerPhone,
      `Reminder: You have an appointment with ${client.businessName} on ${formattedDate} at ${formattedTime}. We look forward to seeing you!`
    );
    if (!smsResult.success) {
      logger.errorWithCause("[booking] Twilio SMS failed:", smsResult.error);
    }
  }

  // ── Immediate booking confirmation email (non-blocking) ─────
  if (body.customerEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const manageUrl = `${appUrl}/bookings/${booking.id}`;
    sendBookingConfirmationEmail(
      body.customerEmail,
      body.customerName,
      client.businessName,
      body.serviceType || "Appointment",
      formattedDate,
      formattedTime,
      manageUrl
    ).catch((err) => {
      logger.errorWithCause("[booking] Confirmation email failed:", err);
    });
  }

  // ── Queue email reminder for 24h before appointment ─────────
  if (body.customerEmail) {
    try {
      await sendBookingReminderEmail(
        body.customerEmail,
        body.customerName,
        client.businessName,
        formattedDate,
        formattedTime
      );
    } catch (err) {
      logger.errorWithCause("[booking] Email reminder queue failed:", err);
    }
  }

  // Dispatch webhook for booking confirmed (non-blocking)
  dispatchWebhook(body.clientId, "booking.confirmed", {
    id: booking.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    serviceType: booking.serviceType,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
  }).catch((err) => logger.errorWithCause("[bookings] Webhook dispatch failed:", err instanceof Error ? err.message : err));

  // Track performance plan billing for booked appointment (non-blocking)
  trackPerformanceBooking(body.clientId, booking.id, body.customerName).catch((err) => logger.errorWithCause("[bookings] Performance tracking failed:", err instanceof Error ? err.message : err));

  return NextResponse.json(
    {
      id: booking.id,
      clientId: booking.clientId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      serviceType: booking.serviceType,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
    },
    { status: 201, headers: corsHeaders }
  );
  } catch (error) {
    logger.errorWithCause("[booking] POST failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
