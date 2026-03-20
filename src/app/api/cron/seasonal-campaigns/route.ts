import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { escapeHtml } from "@/lib/email";
import { verifyCronSecret } from "@/lib/cron";

export const maxDuration = 300;

/**
 * Seasonal Campaigns Cron — Runs on the 1st of each month.
 * Finds campaigns where triggerMonth matches current month and isActive is true.
 * For each campaign, sends personalized emails to all leads for that client.
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12

    // Find all active campaigns that trigger this month
    const campaigns = await prisma.seasonalCampaign.findMany({
      where: {
        triggerMonth: currentMonth,
        isActive: true,
      },
      include: {
        client: { select: { businessName: true } },
      },
      take: 100,
    });

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        campaignsProcessed: 0,
        totalEmailsQueued: 0,
        message: "No seasonal campaigns to process this month",
      });
    }

    const errors: string[] = [];
    let totalEmailsQueued = 0;

    // Batch-fetch dedup info: find all seasonal_campaign_sent events this month
    // for all campaign clients to avoid N+1 queries inside the loop
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const campaignClientIds = campaigns.map((c) => c.clientId);
    const existingSentEvents = await prisma.activityEvent.findMany({
      where: {
        clientId: { in: campaignClientIds },
        type: "seasonal_campaign_sent",
        createdAt: { gte: new Date(`${currentMonthStr}-01`) },
      },
      select: { clientId: true, metadata: true },
      take: 1000,
    });

    // Build a Set of "clientId:campaignId" for O(1) dedup lookups
    const alreadySentSet = new Set<string>();
    for (const evt of existingSentEvents) {
      if (evt.metadata && typeof evt.metadata === "object" && !Array.isArray(evt.metadata)) {
        const meta = evt.metadata as Record<string, unknown>;
        if (meta.campaignId) {
          alreadySentSet.add(`${evt.clientId}:${meta.campaignId}`);
        }
      }
    }

    for (const campaign of campaigns) {
      try {
        // Dedup: skip if this campaign was already sent this month
        if (alreadySentSet.has(`${campaign.clientId}:${campaign.id}`)) continue;

        // Find all leads with email for this client
        const leads = await prisma.lead.findMany({
          where: {
            clientId: campaign.clientId,
            email: { not: null },
          },
          select: {
            name: true,
            email: true,
          },
          take: 5000,
        });

        // Also find all customers from the LTV table
        const customers = await prisma.customerLifetimeValue.findMany({
          where: {
            clientId: campaign.clientId,
            customerEmail: { not: "" },
          },
          select: {
            customerName: true,
            customerEmail: true,
          },
          take: 5000,
        });

        // Merge and deduplicate by email
        const recipientMap = new Map<string, string>();
        for (const lead of leads) {
          if (lead.email) {
            recipientMap.set(lead.email, lead.name);
          }
        }
        for (const customer of customers) {
          if (customer.customerEmail) {
            recipientMap.set(customer.customerEmail, customer.customerName || "Valued Customer");
          }
        }

        // Build all personalized email entries for bulk queue insertion
        const emailEntries: { to: string; subject: string; html: string; scheduledAt: Date; maxAttempts: number }[] = [];
        const now = new Date();

        for (const [email, name] of recipientMap) {
          try {
            const personalizedBody = (campaign.body || "")
              .replace(/\{\{name\}\}/g, escapeHtml(name))
              .replace(/\{\{business\}\}/g, escapeHtml(campaign.client.businessName))
              .replace(
                /\{\{discount\}\}/g,
                campaign.discount
                  ? `<strong style="color: #22d3a1;">${escapeHtml(campaign.discount)}</strong>`
                  : ""
              );

            const personalizedSubject = (campaign.subject || "")
              .replace(/\{\{name\}\}/g, name)
              .replace(/\{\{business\}\}/g, campaign.client.businessName);

            const html = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                ${personalizedBody.split("\n").map((line) => `<p style="color: #333; font-size: 16px; line-height: 1.5; margin: 8px 0;">${line}</p>`).join("")}
                <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">— The ${escapeHtml(campaign.client.businessName)} Team</p>
              </div>
            `;

            emailEntries.push({ to: email, subject: personalizedSubject, html, scheduledAt: now, maxAttempts: 3 });
          } catch (err) {
            errors.push(
              `Failed to build campaign ${campaign.id} email for ${email}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
          }
        }

        // Batch-insert all email queue entries using createMany to avoid
        // sending one-by-one which would timeout for large recipient lists.
        // Prisma's createMany issues a single INSERT ... VALUES statement.
        let sentCount = 0;
        const BATCH_SIZE = 500;
        for (let i = 0; i < emailEntries.length; i += BATCH_SIZE) {
          const batch = emailEntries.slice(i, i + BATCH_SIZE);
          try {
            const result = await prisma.emailQueue.createMany({ data: batch });
            sentCount += result.count;
          } catch (err) {
            errors.push(
              `Failed to queue campaign ${campaign.id} batch starting at index ${i}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
          }
        }

        // Wrap campaign stats update + activity event in a transaction for atomicity
        // (activity event is also used for dedup, so must be consistent with stats)
        await prisma.$transaction(async (tx) => {
          await tx.seasonalCampaign.update({
            where: { id: campaign.id },
            data: {
              lastRunAt: new Date(),
              totalSent: { increment: sentCount },
            },
          });

          await tx.activityEvent.create({
            data: {
              clientId: campaign.clientId,
              type: "seasonal_campaign_sent",
              title: `Seasonal campaign sent: ${campaign.name}`,
              description: `Seasonal campaign: ${campaign.name}`,
              metadata: JSON.stringify({ campaignId: campaign.id, month: currentMonthStr }),
            },
          });
        });

        totalEmailsQueued += sentCount;
      } catch (err) {
        errors.push(
          `Failed to process campaign ${campaign.id}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      campaignsProcessed: campaigns.length,
      totalEmailsQueued,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("[cron/seasonal-campaigns] Fatal error:", err);
    return NextResponse.json(
      { error: "Seasonal campaigns cron job failed" },
      { status: 500 }
    );
  }
}
