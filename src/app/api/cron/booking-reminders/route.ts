import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { sendSms } from "@/lib/twilio";
import { sendBookingReminderEmail } from "@/lib/email";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Resolve the configured timezone for a client's booking service.
 * Falls back to "America/New_York" when not configured.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getClientTimezone(clientId: string): Promise<string> {
  const svc = await prisma.clientService.findFirst({
    where: { clientId, serviceId: "booking" },
    select: { config: true },
  });
  if (svc?.config) {
    try {
      const cfg = JSON.parse(svc.config) as { timezone?: string };
      if (cfg.timezone) return cfg.timezone;
    } catch {
      // use default
    }
  }
  return "America/New_York";
}

function formatDate(date: Date, tz: string): string {
  return date.toLocaleDateString("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  });
}

export const GET = withCronErrorHandler("cron/booking-reminders", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();
    const twentyFourHoursLater = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    // Find bookings happening in the next 24 hours
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        startsAt: {
          gte: now,
          lte: twentyFourHoursLater,
        },
        client: {
          subscription: {
            status: { in: ["active", "canceling"] },
          },
        },
      },
      include: {
        client: {
          include: {
            account: { select: { id: true, email: true, name: true } },
          },
        },
        location: true,
      },
      take: 200,
    });

    if (upcomingBookings.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: "No bookings due for reminders",
      });
    }

    // Batch dedup: fetch all existing reminder activity events for these bookings in one query
    const bookingIds = upcomingBookings.map((b) => b.id);
    const existingReminders = await prisma.activityEvent.findMany({
      where: {
        clientId: { in: upcomingBookings.map((b) => b.clientId) },
        type: "email_sent",
        title: { startsWith: "Booking reminder sent [reminder-" },
      },
      select: { title: true },
      take: 1000,
    });

    // Build a set of booking IDs that already have reminders
    const remindedBookingIds = new Set<string>();
    for (const reminder of existingReminders) {
      // Extract booking ID from title format: "Booking reminder sent [reminder-{bookingId}]"
      const match = reminder.title.match(/\[reminder-(.+)\]$/);
      if (match && bookingIds.includes(match[1])) {
        remindedBookingIds.add(match[1]);
      }
    }

    let smsCount = 0;
    let emailCount = 0;
    const errors: string[] = [];

    // Batch-fetch booking service configs for all unique client IDs
    // to avoid N+1 getClientTimezone calls inside the loop
    const uniqueClientIds = [...new Set(upcomingBookings.map((b) => b.clientId))];
    const bookingServiceConfigs = await prisma.clientService.findMany({
      where: {
        clientId: { in: uniqueClientIds },
        serviceId: "booking",
      },
      select: { clientId: true, config: true },
      take: 200,
    });
    const timezoneByClient = new Map<string, string>();
    for (const svc of bookingServiceConfigs) {
      if (svc.config) {
        try {
          const cfg = JSON.parse(svc.config) as { timezone?: string };
          if (cfg.timezone) {
            timezoneByClient.set(svc.clientId, cfg.timezone);
          }
        } catch {
          // use default
        }
      }
    }

    for (const booking of upcomingBookings) {
      // Check dedup using the pre-fetched set
      if (remindedBookingIds.has(booking.id)) {
        continue;
      }

      const tz = timezoneByClient.get(booking.clientId) || "America/New_York";
      const appointmentDate = formatDate(booking.startsAt, tz);
      const appointmentTime = formatTime(booking.startsAt, tz);

      // ── Send SMS via Twilio if configured (with phone validation) ──
      if (booking.customerPhone) {
        const smsResult = await sendSms(
          booking.customerPhone,
          `Reminder: You have an appointment with ${booking.client.businessName} tomorrow at ${appointmentTime}. We look forward to seeing you!`
        );
        if (smsResult.success) {
          smsCount++;
        } else {
          const msg = `SMS failed for booking ${booking.id}: ${smsResult.error}`;
          logger.error(msg);
          errors.push(msg);
        }
      }

      // ── Queue email reminder (uses emailLayout for consistent branding,
      //    CAN-SPAM footer, and responsive design) ─────────────
      if (booking.customerEmail) {
        try {
          await sendBookingReminderEmail(
            booking.customerEmail,
            booking.customerName,
            booking.client.businessName,
            appointmentDate,
            appointmentTime
          );
          emailCount++;
        } catch (err) {
          const msg = `Email failed for booking ${booking.id}: ${err instanceof Error ? err.message : "Unknown"}`;
          logger.error(msg);
          errors.push(msg);
        }
      }

      // Record the reminder activity (inside per-booking error boundary so
      // a failure here does not prevent the remaining bookings from being processed)
      try {
        await prisma.activityEvent.create({
          data: {
            clientId: booking.clientId,
            type: "email_sent",
            title: `Booking reminder sent [reminder-${booking.id}]`,
            description: `24-hour reminder sent to ${booking.customerName} for appointment on ${appointmentDate}.`,
          },
        });
      } catch (err) {
        const msg = `Activity event failed for booking ${booking.id}: ${err instanceof Error ? err.message : "Unknown"}`;
        logger.error(`[cron/booking-reminders] ${msg}`);
        errors.push(msg);
      }
    }

    return NextResponse.json({
      success: true,
      processed: upcomingBookings.length,
      smsCount,
      emailCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.errorWithCause("[cron/booking-reminders] Failed:", err);
    return NextResponse.json(
      { error: "Booking reminder cron job failed" },
      { status: 500 }
    );
  }
});
