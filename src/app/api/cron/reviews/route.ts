import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReviewRequestEmail } from "@/lib/email";
import { verifyCronSecret } from "@/lib/cron";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;
  try {
    const cutoff = new Date(Date.now() - THREE_DAYS_MS);

    // Find campaigns that were sent more than 3 days ago and haven't been reminded
    const dueForReminder = await prisma.reviewCampaign.findMany({
      where: {
        status: "sent",
        sentAt: { lt: cutoff },
        remindedAt: null,
      },
      include: {
        client: true,
      },
    });

    let reminded = 0;
    const errors: string[] = [];

    for (const campaign of dueForReminder) {
      try {
        if (!campaign.reviewUrl) {
          continue;
        }

        await sendReviewRequestEmail(
          campaign.customerEmail,
          campaign.customerName,
          campaign.client.businessName,
          campaign.reviewUrl
        );

        await prisma.reviewCampaign.update({
          where: { id: campaign.id },
          data: {
            status: "reminded",
            remindedAt: new Date(),
          },
        });

        await prisma.activityEvent.create({
          data: {
            clientId: campaign.clientId,
            type: "email_sent",
            title: "Review reminder sent",
            description: `Reminder email sent to ${campaign.customerName} (${campaign.customerEmail})`,
          },
        });

        reminded++;
      } catch (err) {
        errors.push(
          `Failed to remind campaign ${campaign.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueForReminder.length,
      reminded,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
