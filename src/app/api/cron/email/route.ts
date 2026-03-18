import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDripEmail } from "@/lib/email";
import { verifyCronSecret } from "@/lib/cron";

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    // Find all active drip campaigns
    const dripCampaigns = await prisma.emailCampaign.findMany({
      where: {
        status: "active",
        type: "drip",
      },
      include: {
        client: true,
      },
    });

    if (dripCampaigns.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: "No active drip campaigns to process",
      });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const campaign of dripCampaigns) {
      try {
        // Send drip email to all client leads with email addresses
        const leads = await prisma.lead.findMany({
          where: { clientId: campaign.clientId, email: { not: null } },
          select: { email: true },
        });

        let sentCount = 0;
        for (const lead of leads) {
          if (lead.email) {
            await sendDripEmail(
              lead.email,
              campaign.subject,
              campaign.body,
              campaign.client.businessName
            );
            sentCount++;
          }
        }

        // Update recipient count
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { recipients: sentCount },
        });

        // Create an activity event recording the drip step
        await prisma.activityEvent.create({
          data: {
            clientId: campaign.clientId,
            type: "email_sent",
            title: `Drip step processed: ${campaign.name}`,
            description: `Drip campaign "${campaign.subject}" sent for ${campaign.client.businessName}.`,
          },
        });

        processed++;
      } catch (err) {
        const message = `Failed to process drip campaign ${campaign.id}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        console.error(message);
        errors.push(message);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      total: dripCampaigns.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Email cron job failed" },
      { status: 500 }
    );
  }
}
