import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { validateBody } from "@/lib/validate";
import { rateLimitByIP } from "@/lib/rate-limit";
import { deleteCalendarEvent } from "@/lib/integrations/google-calendar";
import { createNotificationForClient } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const cancelSchema = z.object({
  reason: z.string().max(1000).optional(),
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
  const { allowed } = await rateLimitByIP(ip, "booking-cancel", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const validation = await validateBody(request, cancelSchema);
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
        { error: "Booking is already canceled" },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: "canceled",
        notes: body.reason
          ? `Canceled: ${body.reason}`
          : booking.notes,
      },
    });

    // Delete Google Calendar event if configured (non-blocking)
    const clientService = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "booking" },
    });
    if (clientService?.config) {
      try {
        const cfg = JSON.parse(clientService.config) as {
          googleCalendarId?: string;
        };
        if (cfg.googleCalendarId) {
          // The booking id is used as the calendar event reference
          // since syncBookingToCalendar creates events with booking id
          await deleteCalendarEvent(
            `mock-gcal-${id}`,
            cfg.googleCalendarId
          );
        }
      } catch (err) {
        logger.errorWithCause(
          "[booking/cancel] Google Calendar delete failed:",
          err
        );
      }
    }

    await createNotificationForClient(clientId, {
      type: "booking",
      title: "Booking Canceled",
      message: `Booking for ${booking.customerName} on ${booking.startsAt.toLocaleDateString("en-US")} has been canceled.${body.reason ? ` Reason: ${body.reason}` : ""}`,
      actionUrl: "/dashboard/services/booking",
    });

    await logAudit({
      accountId,
      action: "cancel",
      resource: "booking",
      resourceId: id,
      metadata: { reason: body.reason ?? null },
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
    logger.errorWithCause("[booking/cancel] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
