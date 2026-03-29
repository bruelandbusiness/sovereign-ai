import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { validateBody } from "@/lib/validate";
import { rateLimitByIP } from "@/lib/rate-limit";
import { syncBookingToCalendar } from "@/lib/integrations/google-calendar";
import { createNotificationForClient } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const rescheduleSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  let accountId: string;
  try {
    ({ clientId, accountId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const { allowed } = await rateLimitByIP(ip, "booking-reschedule", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const validation = await validateBody(request, rescheduleSchema);
  if (!validation.success) {
    return validation.response;
  }
  const body = validation.data;

  const { id } = await params;

  try {
    const booking = await prisma.booking.findFirst({
      where: { id, clientId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status === "canceled") {
      return NextResponse.json(
        { error: "Cannot reschedule a canceled booking" },
        { status: 400 }
      );
    }

    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    const now = new Date();

    if (startsAt <= now) {
      return NextResponse.json(
        { error: "Cannot reschedule to a past time" },
        { status: 400 }
      );
    }

    if (endsAt <= startsAt) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for conflicts (exclude the current booking being rescheduled)
    const overlapping = await prisma.booking.findFirst({
      where: {
        clientId,
        id: { not: id },
        status: { not: "canceled" },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Time slot is not available" },
        { status: 409 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { startsAt, endsAt },
    });

    // Resolve Google Calendar config and re-sync event (non-blocking)
    const clientService = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "booking" },
    });

    let clientTimezone = "America/New_York";
    let googleCalendarId: string | undefined;

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

    if (googleCalendarId) {
      try {
        await syncBookingToCalendar(
          {
            id: updated.id,
            customerName: updated.customerName,
            customerEmail: updated.customerEmail,
            serviceType: updated.serviceType,
            startsAt: updated.startsAt,
            endsAt: updated.endsAt,
          },
          googleCalendarId,
          clientTimezone
        );
      } catch (err) {
        logger.errorWithCause(
          "[booking/reschedule] Google Calendar sync failed:",
          err
        );
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

    await createNotificationForClient(clientId, {
      type: "booking",
      title: "Booking Rescheduled",
      message: `Booking for ${updated.customerName} has been rescheduled to ${formattedDate} at ${formattedTime}.`,
      actionUrl: "/dashboard/services/booking",
    });

    await logAudit({
      accountId,
      action: "reschedule",
      resource: "booking",
      resourceId: id,
      metadata: {
        newStartsAt: body.startsAt,
        newEndsAt: body.endsAt,
      },
    });

    return NextResponse.json({
      id: updated.id,
      clientId: updated.clientId,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
      serviceType: updated.serviceType,
      startsAt: updated.startsAt.toISOString(),
      endsAt: updated.endsAt.toISOString(),
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[booking/reschedule] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
