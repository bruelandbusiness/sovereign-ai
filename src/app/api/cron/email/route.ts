import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
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
        // Log the drip step processing
        console.log(
          `[DRIP] Processing campaign "${campaign.name}" (${campaign.id}) for client ${campaign.clientId}`
        );

        // Create an activity event recording the drip step
        await prisma.activityEvent.create({
          data: {
            clientId: campaign.clientId,
            type: "email_sent",
            title: `Drip step processed: ${campaign.name}`,
            description: `Drip campaign "${campaign.subject}" step processed for ${campaign.client.businessName}.`,
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
