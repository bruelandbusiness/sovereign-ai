import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingReminderEmail } from "@/lib/email";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withCronErrorHandler("cron/booking", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();
    const twentyFourHoursLater = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    // Find bookings starting in the next 24 hours that are confirmed
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: "confirmed",
        startsAt: {
          gte: now,
          lte: twentyFourHoursLater,
        },
      },
      include: {
        client: true,
      },
      take: 500,
    });

    if (upcomingBookings.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: "No bookings due for reminders",
      });
    }

    // Batch-fetch existing reminders to avoid N+1 queries
    const bookingIds = upcomingBookings.map((b) => b.id);
    const existingReminders = await prisma.activityEvent.findMany({
      where: {
        type: "email_sent",
        title: { in: bookingIds.map((id) => `Booking reminder sent [${id}]`) },
      },
      select: { title: true },
    });
    const alreadyRemindedIds = new Set(
      existingReminders.map((e) => {
        const match = e.title.match(/\[(.+)\]$/);
        return match ? match[1] : "";
      })
    );

    let reminded = 0;
    const errors: string[] = [];

    for (const booking of upcomingBookings) {
      try {
        // Check if a reminder was already sent for this booking
        if (alreadyRemindedIds.has(booking.id)) {
          continue;
        }

        // Send the reminder email via SendGrid
        if (booking.customerEmail) {
          await sendBookingReminderEmail(
            booking.customerEmail,
            booking.customerName,
            booking.client.businessName,
            booking.startsAt.toLocaleDateString(),
            booking.startsAt.toLocaleTimeString()
          );
        }

        // Record the reminder activity
        await prisma.activityEvent.create({
          data: {
            clientId: booking.clientId,
            type: "email_sent",
            title: `Booking reminder sent [${booking.id}]`,
            description: `24-hour reminder sent to ${booking.customerName} (${booking.customerEmail || "no email"}) for their appointment on ${booking.startsAt.toLocaleDateString()}.`,
          },
        });

        reminded++;
      } catch (err) {
        const message = `Failed to send reminder for booking ${booking.id}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        logger.error(message);
        errors.push(message);
      }
    }

    return NextResponse.json({
      success: true,
      processed: upcomingBookings.length,
      reminded,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.errorWithCause("[cron/booking] Cron failed", error);
    return NextResponse.json(
      { error: "Booking reminder cron job failed" },
      { status: 500 }
    );
  }
});
