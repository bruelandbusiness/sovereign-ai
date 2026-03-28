import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDripEmail } from "@/lib/email";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/email", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  // Find all active drip campaigns
  const dripCampaigns = await prisma.emailCampaign.findMany({
    where: {
      status: "active",
      type: "drip",
    },
    select: {
      id: true,
      clientId: true,
      name: true,
      subject: true,
      body: true,
      client: {
        select: { businessName: true },
      },
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
        take: 1000,
      });

      const emailLeads = leads.filter((l) => l.email);
      // Send drip emails sequentially with a small delay to avoid
      // burst-sending that could trigger SendGrid rate limits (429).
      let sentCount = 0;
      for (const lead of emailLeads) {
        try {
          await sendDripEmail(
            lead.email!,
            campaign.subject,
            campaign.body,
            campaign.client.businessName
          );
          sentCount++;
          // Brief pause between sends to respect SendGrid rate limits
          if (sentCount < emailLeads.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch {
          // Continue sending to remaining leads on individual failure
        }
      }

      // Update recipient count and create activity event in parallel
      await Promise.all([
        prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { recipients: sentCount },
        }),
        prisma.activityEvent.create({
          data: {
            clientId: campaign.clientId,
            type: "email_sent",
            title: `Drip step processed: ${campaign.name}`,
            description: `Drip campaign "${campaign.subject}" sent for ${campaign.client.businessName}.`,
          },
        }),
      ]);

      processed++;
    } catch (err) {
      const message = `Failed to process drip campaign ${campaign.id}: ${
        err instanceof Error ? err.message : "Unknown error"
      }`;
      logger.error(message);
      errors.push(message);
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    total: dripCampaigns.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});
