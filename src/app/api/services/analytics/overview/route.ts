import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: Aggregate REAL data from all services for the client
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const [
      totalLeads,
      wonLeads,
      leadValueAgg,
      wonLeadValueAgg,
      leadsBySource,
      leadsByStatus,

      adAgg,
      activeAdCampaigns,

      trackedKeywords,
      rankingKeywords,
      positionAgg,
      searchVolumeAgg,

      totalPosts,
      publishedPosts,
      socialPostsForEngagement,

      totalEmailCampaigns,
      emailAgg,
      emailEvents,

      totalCalls,
      answeredCalls,
      durationAgg,
      positiveCalls,

      totalBookings,
      confirmedBookings,
      completedBookings,
      noShows,

      totalReviewCampaigns,
      completedReviews,
      ratingAgg,

      totalContent,
      publishedContent,
      contentByType,
    ] = await Promise.all([
      // ── Lead metrics ──────────────────────────────────────────
      prisma.lead.count({ where: { clientId } }),
      prisma.lead.count({ where: { clientId, status: "won" } }),
      prisma.lead.aggregate({
        where: { clientId, value: { not: null } },
        _sum: { value: true },
      }),
      prisma.lead.aggregate({
        where: { clientId, status: "won", value: { not: null } },
        _sum: { value: true },
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { clientId },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { clientId },
        _count: { _all: true },
      }),

      // ── Ad metrics ────────────────────────────────────────────
      prisma.adCampaign.aggregate({
        where: { clientId },
        _sum: { spent: true, impressions: true, clicks: true, conversions: true },
      }),
      prisma.adCampaign.count({ where: { clientId, status: "active" } }),

      // ── SEO metrics ───────────────────────────────────────────
      prisma.sEOKeyword.count({ where: { clientId } }),
      prisma.sEOKeyword.count({ where: { clientId, position: { lte: 10 } } }),
      prisma.sEOKeyword.aggregate({
        where: { clientId, position: { not: null } },
        _avg: { position: true },
      }),
      prisma.sEOKeyword.aggregate({
        where: { clientId },
        _sum: { searchVolume: true },
      }),

      // ── Social metrics ────────────────────────────────────────
      prisma.socialPost.count({ where: { clientId } }),
      prisma.socialPost.count({ where: { clientId, status: "published" } }),
      prisma.socialPost.findMany({
        where: { clientId, engagement: { not: null } },
        select: { engagement: true },
        take: 1000,
      }),

      // ── Email metrics ─────────────────────────────────────────
      prisma.emailCampaign.count({ where: { clientId } }),
      prisma.emailCampaign.aggregate({
        where: { clientId },
        _sum: { recipients: true, opens: true, clicks: true },
      }),
      prisma.emailEvent.count({
        where: { campaign: { clientId } },
      }),

      // ── Call metrics ──────────────────────────────────────────
      prisma.phoneCall.count({ where: { clientId } }),
      prisma.phoneCall.count({ where: { clientId, status: "completed" } }),
      prisma.phoneCall.aggregate({
        where: { clientId, duration: { not: null } },
        _avg: { duration: true },
      }),
      prisma.phoneCall.count({ where: { clientId, sentiment: "positive" } }),

      // ── Booking metrics ───────────────────────────────────────
      prisma.booking.count({ where: { clientId } }),
      prisma.booking.count({ where: { clientId, status: "confirmed" } }),
      prisma.booking.count({ where: { clientId, status: "completed" } }),
      prisma.booking.count({ where: { clientId, status: "no_show" } }),

      // ── Review metrics ────────────────────────────────────────
      prisma.reviewCampaign.count({ where: { clientId } }),
      prisma.reviewCampaign.count({ where: { clientId, status: "completed" } }),
      prisma.reviewCampaign.aggregate({
        where: { clientId, rating: { not: null } },
        _avg: { rating: true },
      }),

      // ── Content metrics ───────────────────────────────────────
      prisma.contentJob.count({ where: { clientId } }),
      prisma.contentJob.count({ where: { clientId, status: "published" } }),
      prisma.contentJob.groupBy({
        by: ["type"],
        where: { clientId },
        _count: { _all: true },
      }),
    ]);

    // ── Derived lead metrics ────────────────────────────────────
    const conversionRate =
      totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const totalLeadValue = leadValueAgg._sum.value || 0;
    const wonLeadValue = wonLeadValueAgg._sum.value || 0;

    const leadsBySourceMap: Record<string, number> = {};
    leadsBySource.forEach((g) => {
      leadsBySourceMap[g.source] = g._count._all;
    });

    const leadsByStatusMap: Record<string, number> = {};
    leadsByStatus.forEach((g) => {
      leadsByStatusMap[g.status] = g._count._all;
    });

    // ── Derived ad metrics ──────────────────────────────────────
    const totalAdSpend = adAgg._sum.spent || 0;
    const totalImpressions = adAgg._sum.impressions || 0;
    const totalClicks = adAgg._sum.clicks || 0;
    const totalConversions = adAgg._sum.conversions || 0;
    const avgCostPerLead =
      totalConversions > 0 ? Math.round(totalAdSpend / totalConversions) : 0;
    const ctr =
      totalImpressions > 0
        ? Math.round((totalClicks / totalImpressions) * 10000) / 100
        : 0;

    // ── Derived SEO metrics ─────────────────────────────────────
    const avgPosition = positionAgg._avg.position
      ? Math.round(positionAgg._avg.position * 10) / 10
      : 0;
    const totalSearchVolume = searchVolumeAgg._sum.searchVolume || 0;

    // ── Derived social metrics ──────────────────────────────────
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalReach = 0;
    socialPostsForEngagement.forEach((p) => {
      if (p.engagement) {
        try {
          const eng = JSON.parse(p.engagement) as {
            likes?: number;
            comments?: number;
            shares?: number;
            reach?: number;
          };
          totalLikes += eng.likes || 0;
          totalComments += eng.comments || 0;
          totalShares += eng.shares || 0;
          totalReach += eng.reach || 0;
        } catch {
          // ignore parse errors
        }
      }
    });

    // ── Derived email metrics ───────────────────────────────────
    const totalRecipients = emailAgg._sum.recipients || 0;
    const totalOpens = emailAgg._sum.opens || 0;
    const totalEmailClicks = emailAgg._sum.clicks || 0;
    const openRate =
      totalRecipients > 0
        ? Math.round((totalOpens / totalRecipients) * 10000) / 100
        : 0;
    const clickRate =
      totalRecipients > 0
        ? Math.round((totalEmailClicks / totalRecipients) * 10000) / 100
        : 0;

    // ── Derived call metrics ────────────────────────────────────
    const avgCallDuration = durationAgg._avg.duration
      ? Math.round(durationAgg._avg.duration)
      : 0;

    // ── Derived booking metrics ─────────────────────────────────
    const noShowRate =
      totalBookings > 0 ? Math.round((noShows / totalBookings) * 100) : 0;

    // ── Derived review metrics ──────────────────────────────────
    const avgReviewRating = ratingAgg._avg.rating
      ? Math.round(ratingAgg._avg.rating * 10) / 10
      : 0;

    // ── Derived content metrics ─────────────────────────────────
    const contentByTypeMap: Record<string, number> = {};
    contentByType.forEach((g) => {
      contentByTypeMap[g.type] = g._count._all;
    });

    return NextResponse.json({
      leads: {
        total: totalLeads,
        won: wonLeads,
        conversionRate,
        totalValue: totalLeadValue,
        wonValue: wonLeadValue,
        bySource: leadsBySourceMap,
        byStatus: leadsByStatusMap,
      },
      ads: {
        totalSpend: totalAdSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr,
        avgCostPerLead,
        activeCampaigns: activeAdCampaigns,
      },
      seo: {
        trackedKeywords,
        rankingInTop10: rankingKeywords,
        avgPosition,
        totalSearchVolume,
      },
      social: {
        totalPosts,
        publishedPosts,
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          reach: totalReach,
        },
      },
      email: {
        campaigns: totalEmailCampaigns,
        recipients: totalRecipients,
        opens: totalOpens,
        clicks: totalEmailClicks,
        openRate,
        clickRate,
        totalEvents: emailEvents,
      },
      calls: {
        total: totalCalls,
        answered: answeredCalls,
        avgDuration: avgCallDuration,
        positiveSentiment: positiveCalls,
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        noShows,
        noShowRate,
      },
      reviews: {
        campaigns: totalReviewCampaigns,
        completed: completedReviews,
        avgRating: avgReviewRating,
      },
      content: {
        total: totalContent,
        published: publishedContent,
        byType: contentByTypeMap,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[analytics/overview] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to generate analytics overview" },
      { status: 500 }
    );
  }
}
