import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { sendEmail } from "@/lib/email";
import { buildBookingNoshowEmail } from "@/lib/emails/booking-noshow";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Grace period before a confirmed booking is marked as no-show (ms). */
const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

export const GET = withCronErrorHandler(
  "cron/booking-noshow",
  async (request) => {
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;

    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - GRACE_PERIOD_MS);

      // Find confirmed bookings whose start time has passed the grace period
      const overdueBookings = await prisma.booking.findMany({
        where: {
          status: "confirmed",
          startsAt: { lt: cutoff },
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
        },
        take: 100,
      });

      if (overdueBookings.length === 0) {
        return NextResponse.json({
          processed: 0,
          message: "No overdue bookings found",
        });
      }

      // Batch dedup: fetch existing auditLog entries for these bookings
      const bookingIds = overdueBookings.map((b) => b.id);
      const existingLogs = await prisma.auditLog.findMany({
        where: {
          action: "booking_noshow_processed",
          resourceId: { in: bookingIds },
        },
        select: { resourceId: true },
      });
      const alreadyProcessedIds = new Set(
        existingLogs.map((l) => l.resourceId)
      );

      let markedCount = 0;
      let emailCount = 0;
      const errors: string[] = [];

      // Batch-fetch booking service configs for rebooking URLs / timezones
      const uniqueClientIds = [
        ...new Set(overdueBookings.map((b) => b.clientId)),
      ];
      const bookingServiceConfigs = await prisma.clientService.findMany({
        where: {
          clientId: { in: uniqueClientIds },
          serviceId: "booking",
        },
        select: { clientId: true, config: true },
        take: 200,
      });

      const configByClient = new Map<
        string,
        { timezone?: string; bookingPageUrl?: string }
      >();
      for (const svc of bookingServiceConfigs) {
        if (svc.config) {
          try {
            const cfg = JSON.parse(svc.config) as {
              timezone?: string;
              bookingPageUrl?: string;
            };
            configByClient.set(svc.clientId, cfg);
          } catch {
            // use defaults
          }
        }
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

      for (const booking of overdueBookings) {
        // Skip already-processed bookings (fast path)
        if (alreadyProcessedIds.has(booking.id)) {
          continue;
        }

        // Atomic idempotency check via auditLog
        const alreadyHandled = await prisma.auditLog.findFirst({
          where: {
            action: "booking_noshow_processed",
            resourceId: booking.id,
          },
        });
        if (alreadyHandled) continue;

        const clientConfig = configByClient.get(booking.clientId);
        const tz = clientConfig?.timezone || "America/New_York";

        try {
          // 1. Update booking status to no_show
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "no_show" },
          });
          markedCount++;

          // 2. Create notification for the business owner
          const serviceLabel = booking.serviceType || "scheduled";
          await prisma.notification.create({
            data: {
              accountId: booking.client.account.id,
              type: "booking",
              title: "No-show detected",
              message: `Customer ${booking.customerName} didn't show for their ${serviceLabel} appointment`,
              read: false,
            },
          });

          // 3. Send "We missed you" email to customer
          if (booking.customerEmail) {
            const rebookUrl =
              clientConfig?.bookingPageUrl || `${appUrl}/book`;

            const appointmentDate = booking.startsAt.toLocaleDateString(
              "en-US",
              {
                timeZone: tz,
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );
            const appointmentTime = booking.startsAt.toLocaleTimeString(
              "en-US",
              {
                timeZone: tz,
                hour: "numeric",
                minute: "2-digit",
              }
            );

            const { subject, html } = buildBookingNoshowEmail({
              customerName: booking.customerName,
              businessName: booking.client.businessName,
              serviceType: serviceLabel,
              appointmentDate,
              appointmentTime,
              rebookUrl,
            });

            await sendEmail(booking.customerEmail, subject, html);
            emailCount++;
          }

          // 4. Record activity event
          await prisma.activityEvent.create({
            data: {
              clientId: booking.clientId,
              type: "booking_update",
              title: `No-show: ${booking.customerName} [noshow-${booking.id}]`,
              description: `Marked booking as no-show and sent recovery email to ${booking.customerName}.`,
            },
          });

          // 5. Authoritative dedup record
          await prisma.auditLog.create({
            data: {
              action: "booking_noshow_processed",
              resource: "booking",
              resourceId: booking.id,
              accountId: "system",
              metadata: JSON.stringify({
                bookingId: booking.id,
                clientId: booking.clientId,
                customerEmail: booking.customerEmail,
                processedAt: new Date().toISOString(),
              }),
            },
          });
        } catch (err) {
          const msg = `Failed to process no-show for booking ${booking.id}: ${err instanceof Error ? err.message : "Unknown"}`;
          logger.error(`[cron/booking-noshow] ${msg}`);
          errors.push(msg);
        }
      }

      return NextResponse.json({
        success: true,
        processed: overdueBookings.length,
        markedCount,
        emailCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (err) {
      logger.errorWithCause("[cron/booking-noshow] Failed:", err);
      return NextResponse.json(
        { error: "Booking no-show cron job failed" },
        { status: 500 }
      );
    }
  }
);
