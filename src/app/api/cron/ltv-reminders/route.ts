import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmailQueued, escapeHtml, emailLayout, emailButton } from "@/lib/email";
import { verifyCronSecret } from "@/lib/cron";

export const maxDuration = 300;

/**
 * LTV Reminders Cron — Runs daily at 9 AM.
 * Finds all service reminders where nextDueDate is within the next 7 days
 * and status is "pending", then sends reminder emails.
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find all pending reminders due within the next 7 days
    const dueReminders = await prisma.serviceReminder.findMany({
      where: {
        status: "pending",
        nextDueDate: {
          gte: now,
          lte: sevenDaysOut,
        },
        client: {
          subscription: {
            status: { in: ["active", "canceling"] },
          },
        },
      },
      include: {
        client: { select: { businessName: true } },
      },
      take: 100,
    });

    const errors: string[] = [];
    const succeededIds: string[] = [];
    const activityData: Array<{
      clientId: string;
      type: string;
      title: string;
      description: string;
    }> = [];

    for (const reminder of dueReminders) {
      try {
        if (!reminder.customerEmail) {
          continue;
        }

        // Calculate months since last service
        const monthsSince = Math.round(
          (now.getTime() - reminder.lastServiceDate.getTime()) /
            (30 * 24 * 60 * 60 * 1000)
        );

        // Format the service type for display
        const serviceTypeDisplay = reminder.serviceType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sovereignai.com";
        const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?clientId=${reminder.clientId}`;
        const html = emailLayout({
          preheader: `It's been ${monthsSince} months since your last ${serviceTypeDisplay}. Book today!`,
          unsubscribeUrl,
          body: `
            <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${escapeHtml(reminder.customerName)},</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">It&rsquo;s been <strong>${monthsSince} months</strong> since your last <strong>${escapeHtml(serviceTypeDisplay)}</strong>. Regular maintenance keeps your systems running efficiently and prevents costly emergency repairs.</p>
            <p style="color:#333;font-size:16px;line-height:1.5;">Book your ${escapeHtml(serviceTypeDisplay)} today and get priority scheduling!</p>
            ${emailButton("Book Now", `${appUrl}/book/${reminder.clientId}`)}
            <p style="color:#666;font-size:14px;">If you&rsquo;ve already scheduled service, please disregard this email.</p>
            <p style="color:#999;font-size:12px;text-align:center;">&mdash; The ${escapeHtml(reminder.client.businessName)} Team</p>
          `,
        });

        await sendEmailQueued(
          reminder.customerEmail,
          `Time for your ${serviceTypeDisplay} — Book today!`,
          html
        );

        succeededIds.push(reminder.id);
        activityData.push({
          clientId: reminder.clientId,
          type: "email_sent",
          title: "Service reminder sent",
          description: `Maintenance reminder sent to ${reminder.customerName} for ${serviceTypeDisplay}`,
        });
      } catch (err) {
        errors.push(
          `Failed to send reminder ${reminder.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Batch update all succeeded reminders and create activity events
    if (succeededIds.length > 0) {
      await prisma.$transaction([
        prisma.serviceReminder.updateMany({
          where: { id: { in: succeededIds } },
          data: {
            status: "sent",
            sentAt: new Date(),
          },
        }),
        prisma.activityEvent.createMany({ data: activityData }),
      ]);
    }

    return NextResponse.json({
      success: true,
      processed: dueReminders.length,
      sent: succeededIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[cron/ltv-reminders] Fatal error:", err);
    return NextResponse.json(
      { error: "LTV reminders cron job failed" },
      { status: 500 }
    );
  }
}
