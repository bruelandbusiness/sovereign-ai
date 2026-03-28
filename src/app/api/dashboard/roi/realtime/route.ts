import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/roi/realtime
 *
 * Returns real-time ROI metrics for the authenticated client.
 * Includes funnel metrics, cost analysis, channel breakdown, and month-over-month comparison.
 */
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const now = new Date();

    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = now;

    // Previous month boundaries
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const currentFilter = { gte: currentMonthStart, lte: currentMonthEnd };
    const prevFilter = { gte: prevMonthStart, lte: prevMonthEnd };

    // ------------------------------------------------------------------
    // Parallel queries for current month
    // ------------------------------------------------------------------
    const [
      totalLeads,
      leadsContacted,
      leadsBooked,
      leadsWon,
      revenueEvents,
      subscription,
      adCampaigns,
      leads,
      // Previous month data
      prevTotalLeads,
      prevLeadsWon,
      prevRevenueEvents,
    ] = await Promise.all([
      // Current month lead counts
      prisma.lead.count({
        where: { clientId, createdAt: currentFilter },
      }),
      prisma.lead.count({
        where: { clientId, createdAt: currentFilter, status: "qualified" },
      }),
      prisma.lead.count({
        where: { clientId, createdAt: currentFilter, status: "appointment" },
      }),
      prisma.lead.count({
        where: { clientId, createdAt: currentFilter, status: "won" },
      }),
      // Current month revenue events
      prisma.revenueEvent.findMany({
        where: { clientId, createdAt: currentFilter },
        select: { amount: true, channel: true, eventType: true, leadId: true },
        take: 10000,
      }),
      // Subscription for investment calc
      prisma.subscription.findUnique({
        where: { clientId },
        select: { monthlyAmount: true, status: true },
      }),
      // Ad campaigns for investment calc
      prisma.adCampaign.findMany({
        where: {
          clientId,
          OR: [
            { startDate: currentFilter },
            { endDate: currentFilter },
            {
              startDate: { lte: currentMonthStart },
              endDate: { gte: currentMonthEnd },
            },
          ],
        },
        select: { spent: true },
        take: 1000,
      }),
      // Current month leads with sources for channel breakdown
      prisma.lead.findMany({
        where: { clientId, createdAt: currentFilter },
        select: { id: true, source: true, status: true, value: true },
        take: 10000,
      }),
      // Previous month
      prisma.lead.count({
        where: { clientId, createdAt: prevFilter },
      }),
      prisma.lead.count({
        where: { clientId, createdAt: prevFilter, status: "won" },
      }),
      prisma.revenueEvent.findMany({
        where: { clientId, createdAt: prevFilter, eventType: "payment_received" },
        select: { amount: true },
        take: 10000,
      }),
    ]);

    // ------------------------------------------------------------------
    // Revenue calculation (cents -> dollars)
    // ------------------------------------------------------------------
    const totalRevenueCents = revenueEvents
      .filter((e) => e.eventType === "payment_received")
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const totalRevenue = totalRevenueCents / 100;

    const prevRevenueCents = prevRevenueEvents.reduce(
      (sum, e) => sum + (e.amount ?? 0),
      0,
    );
    const prevRevenue = prevRevenueCents / 100;

    // ------------------------------------------------------------------
    // Investment calculation
    // ------------------------------------------------------------------
    let subscriptionCost = 0;
    if (subscription && subscription.status === "active") {
      // Prorate for the current month so far
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysSoFar = now.getDate();
      subscriptionCost = Math.round(
        (subscription.monthlyAmount * daysSoFar) / daysInMonth,
      );
    }
    const adSpend = adCampaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalInvestmentCents = subscriptionCost + adSpend;
    const totalInvestment = totalInvestmentCents / 100;

    // ------------------------------------------------------------------
    // Derived metrics
    // ------------------------------------------------------------------
    const roi =
      totalRevenue > 0 && totalInvestment > 0
        ? Math.round((totalRevenue / totalInvestment) * 10) / 10
        : 0;

    const costPerLead =
      totalLeads > 0
        ? Math.round((totalInvestment / totalLeads) * 100) / 100
        : 0;

    const costPerBooking =
      leadsBooked > 0
        ? Math.round((totalInvestment / leadsBooked) * 100) / 100
        : 0;

    const conversionRate =
      totalLeads > 0
        ? Math.round((leadsWon / totalLeads) * 1000) / 10
        : 0;

    // ------------------------------------------------------------------
    // Channel breakdown: revenue + lead count by source
    // ------------------------------------------------------------------
    const channelMap = new Map<
      string,
      { channel: string; leads: number; won: number; revenue: number }
    >();

    for (const lead of leads) {
      const key = lead.source || "unknown";
      let entry = channelMap.get(key);
      if (!entry) {
        entry = { channel: key, leads: 0, won: 0, revenue: 0 };
        channelMap.set(key, entry);
      }
      entry.leads++;
      if (lead.status === "won") {
        entry.won++;
        entry.revenue += (lead.value ?? 0) / 100;
      }
    }

    // Also attribute revenue events to channels
    for (const event of revenueEvents) {
      if (event.eventType !== "payment_received") continue;
      const channel = event.channel || "unknown";
      let entry = channelMap.get(channel);
      if (!entry) {
        entry = { channel, leads: 0, won: 0, revenue: 0 };
        channelMap.set(channel, entry);
      }
      // Only add revenue if not already counted via lead.value
      if (!event.leadId) {
        entry.revenue += (event.amount ?? 0) / 100;
      }
    }

    const channelBreakdown = Array.from(channelMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    // ------------------------------------------------------------------
    // Month-over-month comparison
    // ------------------------------------------------------------------
    const revenueChangePercent =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
        : totalRevenue > 0
          ? 100
          : 0;

    const leadChangePercent =
      prevTotalLeads > 0
        ? Math.round(
            ((totalLeads - prevTotalLeads) / prevTotalLeads) * 100,
          )
        : totalLeads > 0
          ? 100
          : 0;

    const winChangePercent =
      prevLeadsWon > 0
        ? Math.round(((leadsWon - prevLeadsWon) / prevLeadsWon) * 100)
        : leadsWon > 0
          ? 100
          : 0;

    const response = NextResponse.json({
      totalLeads,
      leadsContacted,
      leadsBooked,
      leadsWon,
      totalRevenue,
      totalInvestment,
      roi,
      costPerLead,
      costPerBooking,
      conversionRate,
      channelBreakdown,
      monthOverMonth: {
        revenueChange: revenueChangePercent,
        leadChange: leadChangePercent,
        winChange: winChangePercent,
        prevRevenue,
        prevLeads: prevTotalLeads,
        prevWon: prevLeadsWon,
      },
    });
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=10");
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[roi/realtime] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch realtime ROI data" },
      { status: 500 },
    );
  }
}
