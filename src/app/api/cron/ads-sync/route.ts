import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { getCampaignMetrics as getGoogleMetrics } from "@/lib/integrations/google-ads";
import { getAdMetrics as getMetaMetrics } from "@/lib/integrations/meta-ads";
import { getCapacityScore, getAdSpendRecommendation } from "@/lib/capacity-marketing";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Sync ad metrics daily for all active campaigns
export const GET = withCronErrorHandler("cron/ads-sync", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();

  try {
  // Find all active campaigns with external IDs
  const campaigns = await prisma.adCampaign.findMany({
    where: {
      status: "active",
      externalId: { not: null },
    },
    include: {
      client: { select: { id: true, businessName: true } },
    },
    take: 50,
  });

  if (campaigns.length === 0) {
    return NextResponse.json({
      synced: 0,
      message: "No active campaigns to sync",
    });
  }

  const results: Array<{
    campaignId: string;
    status: string;
    changes?: string;
  }> = [];

  // Collect all campaign updates and activity events, then batch in a transaction
  const campaignUpdates: Parameters<typeof prisma.adCampaign.update>[0][] = [];
  const activityEvents: Parameters<typeof prisma.activityEvent.create>[0][] = [];

  for (const campaign of campaigns) {
    try {
      let newSpent = campaign.spent;
      let newImpressions = campaign.impressions;
      let newClicks = campaign.clicks;
      let newConversions = campaign.conversions;

      if (campaign.platform === "google" && campaign.externalId) {
        const metrics = await getGoogleMetrics(campaign.externalId);
        newSpent = metrics.spent;
        newImpressions = metrics.impressions;
        newClicks = metrics.clicks;
        newConversions = metrics.conversions;
      } else if (campaign.platform === "meta" && campaign.externalId) {
        const metrics = await getMetaMetrics(campaign.externalId);
        newSpent = metrics.spent;
        newImpressions = metrics.impressions;
        newClicks = metrics.clicks;
        newConversions = metrics.conversions;
      }

      // Calculate cost per lead
      const costPerLead =
        newConversions > 0 ? Math.round(newSpent / newConversions) : null;

      // Track changes for activity events
      const spentDelta = newSpent - campaign.spent;
      const conversionsDelta = newConversions - campaign.conversions;

      // Queue the campaign update
      campaignUpdates.push({
        where: { id: campaign.id },
        data: {
          spent: newSpent,
          impressions: newImpressions,
          clicks: newClicks,
          conversions: newConversions,
          costPerLead: costPerLead ?? 0,
        },
      });

      // Create activity events for notable changes
      const changes: string[] = [];

      // Budget exhausted (spent > 90% of budget)
      if (
        newSpent > campaign.budget * 0.9 &&
        campaign.spent <= campaign.budget * 0.9
      ) {
        changes.push("budget nearly exhausted");
        activityEvents.push({
          data: {
            clientId: campaign.client.id,
            type: "ad_optimized",
            title: `Campaign "${campaign.name}" budget nearly exhausted`,
            description: `Your ${campaign.platform} campaign has spent ${(newSpent / 100).toFixed(2)} of your $${(campaign.budget / 100).toFixed(2)} daily budget. Consider increasing the budget or pausing the campaign.`,
          },
        });
      }

      // High ROAS (conversions generating good revenue)
      const estimatedRevenue = newConversions * 50000; // $500 per conversion
      const roas = newSpent > 0 ? estimatedRevenue / newSpent : 0;
      if (roas > 5 && conversionsDelta > 0) {
        changes.push(`high ROAS: ${roas.toFixed(1)}x`);
        activityEvents.push({
          data: {
            clientId: campaign.client.id,
            type: "ad_optimized",
            title: `Campaign "${campaign.name}" performing well`,
            description: `Your ${campaign.platform} campaign has a ${roas.toFixed(1)}x return on ad spend with ${newConversions} conversions. Consider increasing the budget to maximize results.`,
          },
        });
      }

      // Significant spend increase
      if (spentDelta > 1000) {
        // more than $10 spent since last sync
        changes.push(`$${(spentDelta / 100).toFixed(2)} new spend`);
      }

      results.push({
        campaignId: campaign.id,
        status: "synced",
        changes: changes.length > 0 ? changes.join(", ") : undefined,
      });
    } catch (error) {
      logger.errorWithCause(
        `[cron/ads-sync] Failed to sync campaign ${campaign.id}`,
        error,
      );
      results.push({
        campaignId: campaign.id,
        status: "failed",
      });
    }
  }

  // Write campaign updates and activity events per-campaign so one failure
  // does not prevent the rest from being persisted.
  for (const update of campaignUpdates) {
    try {
      await prisma.adCampaign.update(update);
    } catch (err) {
      logger.errorWithCause(
        `[cron/ads-sync] Failed to update campaign ${update.where.id}`,
        err,
      );
    }
  }
  for (const event of activityEvents) {
    try {
      await prisma.activityEvent.create(event);
    } catch (err) {
      logger.errorWithCause(
        `[cron/ads-sync] Failed to create activity event`,
        err,
      );
    }
  }

  // ── Capacity-based marketing alerts ────────────────────────────
  // Check capacity for each unique client with active campaigns and create
  // alerts when capacity is mismatched with ad activity.
  const uniqueClientIds = [...new Set(campaigns.map((c) => c.client.id))];
  const capacityAlerts: Parameters<typeof prisma.activityEvent.create>[0][] = [];

  for (const cid of uniqueClientIds) {
    try {
      const capacity = await getCapacityScore(cid);
      const recommendation = getAdSpendRecommendation(capacity.score);

      // Alert if nearly full but ads still running
      if (capacity.score < 20) {
        capacityAlerts.push({
          data: {
            clientId: cid,
            type: "ad_optimized",
            title: "Schedule nearly full — consider reducing ad spend",
            description: `Your schedule is ${100 - capacity.score}% booked for the next 2 weeks (${capacity.bookedSlots}/${capacity.totalSlots} slots). ${recommendation.message}.`,
          },
        });
      }

      // Alert if wide open and ads could be increased
      if (capacity.score > 80) {
        capacityAlerts.push({
          data: {
            clientId: cid,
            type: "ad_optimized",
            title: "Many open slots — consider increasing ad spend",
            description: `You have ${capacity.openSlots} open slots in the next 2 weeks (only ${capacity.bookedSlots} booked). ${recommendation.message}.`,
          },
        });
      }
    } catch (err) {
      logger.errorWithCause(`[cron/ads-sync] Capacity check failed for client ${cid}`, err);
    }
  }

  // Write capacity alerts one at a time so a single failure does not block
  // the rest, and check for duplicates to prevent double-alerting on re-runs.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const alert of capacityAlerts) {
    try {
      // Idempotency: skip if we already created this capacity alert today
      const existing = await prisma.activityEvent.findFirst({
        where: {
          clientId: alert.data.clientId,
          type: "ad_optimized",
          title: alert.data.title as string,
          createdAt: { gte: todayStart },
        },
      });
      if (existing) continue;

      await prisma.activityEvent.create(alert);
    } catch (err) {
      logger.errorWithCause(
        `[cron/ads-sync] Failed to create capacity alert for client ${alert.data.clientId}`,
        err,
      );
    }
  }

  logger.info(`[cron/ads-sync] Completed in ${Date.now() - startTime}ms`);

  return NextResponse.json({
    synced: results.filter((r) => r.status === "synced").length,
    failed: results.filter((r) => r.status === "failed").length,
    capacityAlerts: capacityAlerts.length,
    results,
  });
  } catch (err) {
    logger.errorWithCause("[cron/ads-sync] Fatal error", err);
    return NextResponse.json(
      { error: "Ads sync cron job failed" },
      { status: 500 }
    );
  }
});
