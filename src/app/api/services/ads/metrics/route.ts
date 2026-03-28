import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCampaignMetrics as getGoogleMetrics, isConfigured as isGoogleAdsConfigured } from "@/lib/integrations/google-ads";
import { getAdMetrics as getMetaMetrics, isConfigured as isMetaAdsConfigured } from "@/lib/integrations/meta-ads";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: Aggregate metrics across all campaigns
// Query params: ?period=7d|30d|90d, ?platform=google|meta|all
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") ?? "30d";
  const platformFilter = searchParams.get("platform") ?? "all";

  // Calculate date range
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  // Build where clause
  const where: {
    clientId: string;
    platform?: string;
    createdAt?: { gte: Date };
  } = {
    clientId,
    createdAt: { gte: sinceDate },
  };

  if (platformFilter !== "all") {
    where.platform = platformFilter;
  }

  const campaigns = await prisma.adCampaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Try to enrich active campaigns with live metrics
  let totalSpent = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  // If neither ads platform is configured, all data will be mock
  let hasMockData = !isGoogleAdsConfigured() && !isMetaAdsConfigured();

  const campaignMetrics = await Promise.all(
    campaigns.map(async (campaign) => {
      let spent = campaign.spent;
      let impressions = campaign.impressions;
      let clicks = campaign.clicks;
      let conversions = campaign.conversions;

      // Fetch live metrics for active campaigns with external IDs
      if (campaign.externalId && campaign.status === "active") {
        try {
          if (campaign.platform === "google") {
            const live = await getGoogleMetrics(campaign.externalId);
            spent = live.spent;
            impressions = live.impressions;
            clicks = live.clicks;
            conversions = live.conversions;
            if (live.isMock) hasMockData = true;
          } else if (campaign.platform === "meta") {
            const live = await getMetaMetrics(campaign.externalId);
            spent = live.spent;
            impressions = live.impressions;
            clicks = live.clicks;
            conversions = live.conversions;
            if (live.isMock) hasMockData = true;
          }
        } catch (error) {
          logger.errorWithCause(
            `Failed to fetch live metrics for campaign ${campaign.id}`,
            error
          );
        }
      }

      totalSpent += spent;
      totalImpressions += impressions;
      totalClicks += clicks;
      totalConversions += conversions;

      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        budget: campaign.budget,
        spent,
        impressions,
        clicks,
        conversions,
      };
    })
  );

  // Calculate aggregate metrics
  const ctr =
    totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 10000) / 100
      : 0;
  const conversionRate =
    totalClicks > 0
      ? Math.round((totalConversions / totalClicks) * 10000) / 100
      : 0;
  const costPerClick =
    totalClicks > 0 ? Math.round(totalSpent / totalClicks) : 0;
  const costPerConversion =
    totalConversions > 0 ? Math.round(totalSpent / totalConversions) : 0;

  // ROAS: For service businesses, estimate revenue from conversions
  // Assume average job value of $500 (50000 cents)
  const estimatedRevenue = totalConversions * 50000;
  const roas =
    totalSpent > 0
      ? Math.round((estimatedRevenue / totalSpent) * 100) / 100
      : 0;

  return NextResponse.json({
    period,
    platform: platformFilter,
    isMock: hasMockData,
    summary: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      ctr,
      conversionRate,
      costPerClick,
      costPerConversion,
      roas,
      estimatedRevenue,
    },
    campaigns: campaignMetrics,
  });
}
