import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const twentyFourHoursLater = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    // Find bookings starting in the next 24 hours that are confirmed
    // We use the existence of a "reminder" activity event to avoid re-reminding
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
    });

    if (upcomingBookings.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: "No bookings due for reminders",
      });
    }

    let reminded = 0;
    const errors: string[] = [];

    for (const booking of upcomingBookings) {
      try {
        // Check if a reminder was already sent for this booking
        const existingReminder = await prisma.activityEvent.findFirst({
          where: {
            clientId: booking.clientId,
            type: "email_sent",
            title: { contains: booking.id },
            description: { contains: "reminder" },
          },
        });

        if (existingReminder) {
          continue; // Already reminded
        }

        // In production this would send an email/SMS reminder
        console.log(
          `[BOOKING REMINDER] Sending reminder for booking ${booking.id} ` +
            `(${booking.customerName}) at ${booking.startsAt.toISOString()} ` +
            `for ${booking.client.businessName}`
        );

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
        console.error(message);
        errors.push(message);
      }
    }

    return NextResponse.json({
      success: true,
      processed: upcomingBookings.length,
      reminded,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Booking reminder cron job failed" },
      { status: 500 }
    );
  }
}
