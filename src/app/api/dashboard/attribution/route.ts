import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { getROIByChannel, getFunnelMetrics } from "@/lib/revenue-attribution";

// ---------------------------------------------------------------------------
// GET — attribution data: ROI by channel, funnel metrics, top leads
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const url = request.nextUrl;
  const period = url.searchParams.get("period") || "30d";

  // Calculate date range
  const now = new Date();
  let start: Date;
  switch (period) {
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const dateRange = { start, end: now };

  // Fetch ROI by channel, funnel metrics, and ad spend in parallel
  const [channelROI, funnel, adCampaigns] = await Promise.all([
    getROIByChannel(clientId, dateRange),
    getFunnelMetrics(clientId, dateRange),
    prisma.adCampaign.findMany({
      where: {
        clientId,
        status: { in: ["active", "paused", "ended"] },
      },
      select: {
        platform: true,
        spent: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
      take: 100,
    }),
  ]);

  // Calculate total ad spend
  const totalAdSpend = adCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalImpressions = adCampaigns.reduce((sum, c) => sum + c.impressions, 0);

  // Get top converting leads (leads with most events)
  const topLeadEvents = await prisma.revenueEvent.findMany({
    where: {
      clientId,
      leadId: { not: null },
      createdAt: { gte: start },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Group by leadId and count events
  const leadEventCounts = new Map<string, { count: number; revenue: number; channel: string }>();
  for (const event of topLeadEvents) {
    if (!event.leadId) continue;
    const existing = leadEventCounts.get(event.leadId);
    if (existing) {
      existing.count++;
      if (event.amount) existing.revenue += event.amount;
    } else {
      leadEventCounts.set(event.leadId, {
        count: 1,
        revenue: event.amount || 0,
        channel: event.channel || "unknown",
      });
    }
  }

  // Get top 10 leads by event count
  const topLeadIds = Array.from(leadEventCounts.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue || b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id]) => id);

  const topLeads = topLeadIds.length > 0
    ? await prisma.lead.findMany({
        where: { id: { in: topLeadIds }, clientId },
        select: { id: true, name: true, source: true, status: true, createdAt: true },
      })
    : [];

  const topLeadsWithAttribution = topLeads.map((lead) => {
    const eventData = leadEventCounts.get(lead.id);
    return {
      id: lead.id,
      name: lead.name,
      source: lead.source,
      status: lead.status,
      eventCount: eventData?.count || 0,
      revenue: eventData?.revenue || 0,
      channel: eventData?.channel || lead.source,
      createdAt: lead.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    period,
    funnel: {
      impressions: totalImpressions,
      adClicks: funnel.adClicks,
      leads: funnel.leadsCapture,
      bookings: funnel.bookings,
      payments: funnel.payments,
      totalRevenue: funnel.totalRevenue,
    },
    channelROI,
    totalAdSpend,
    totalRevenue: funnel.totalRevenue,
    roi: totalAdSpend > 0
      ? parseFloat(((funnel.totalRevenue / totalAdSpend) * 100).toFixed(1))
      : 0,
    topLeads: topLeadsWithAttribution,
  });
}
