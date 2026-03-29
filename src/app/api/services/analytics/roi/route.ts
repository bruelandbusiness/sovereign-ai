import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: Calculate real ROI for the client
export async function GET() {
  try {
    const { clientId } = await requireClient();

    // ── Total investment: subscription payments ───────────────
    const subscription = await prisma.subscription.findUnique({
      where: { clientId },
    });

    const monthlyInvestment = subscription?.monthlyAmount || 0; // in cents
    const subscriptionCreated = subscription?.createdAt || new Date();
    const monthsActive = Math.max(
      1,
      Math.ceil(
        (Date.now() - subscriptionCreated.getTime()) / (30 * 24 * 60 * 60 * 1000)
      )
    );
    const totalInvestment = monthlyInvestment * monthsActive;

    // ── Aggregated lead data (database-level) ───────────────
    const [
      wonLeadAgg,
      referralWonAgg,
      adConversionsAgg,
      revenueBySourceRaw,
    ] = await Promise.all([
      // Total value of all won leads
      prisma.lead.aggregate({
        where: { clientId, status: "won", value: { not: null } },
        _sum: { value: true },
        _count: { id: true },
      }),
      // Referral won lead value
      prisma.lead.aggregate({
        where: { clientId, status: "won", source: "referral", value: { not: null } },
        _sum: { value: true },
      }),
      // Total ad conversions
      prisma.adCampaign.aggregate({
        where: { clientId },
        _sum: { conversions: true },
      }),
      // Revenue grouped by source for won leads
      prisma.lead.groupBy({
        by: ["source"],
        where: { clientId, status: "won", value: { not: null } },
        _sum: { value: true },
      }),
    ]);

    const wonLeadValue = wonLeadAgg._sum.value ?? 0;
    const wonLeadCount = wonLeadAgg._count.id;
    const referralValue = referralWonAgg._sum.value ?? 0;

    // Estimate average deal value from won leads
    const avgDealValue =
      wonLeadCount > 0 ? wonLeadValue / wonLeadCount : 50000; // default $500 if no data
    const adConversions = adConversionsAgg._sum.conversions ?? 0;
    const estimatedAdRevenue = adConversions * avgDealValue;

    // ── Totals ────────────────────────────────────────────────
    const totalReturns = wonLeadValue + estimatedAdRevenue + referralValue;
    const roiMultiplier =
      totalInvestment > 0
        ? Math.round((totalReturns / totalInvestment) * 10) / 10
        : 0;
    const netProfit = totalReturns - totalInvestment;

    // ── Revenue by source ─────────────────────────────────────
    const revenueBySource: Record<string, number> = {};
    for (const group of revenueBySourceRaw) {
      revenueBySource[group.source] = group._sum.value ?? 0;
    }

    // Add estimated ad revenue
    if (estimatedAdRevenue > 0) {
      revenueBySource["ads"] =
        (revenueBySource["ads"] || 0) + estimatedAdRevenue;
    }

    // ── Monthly trend (up to last 6 months, via groupBy) ─────
    const trendMonths = Math.min(monthsActive, 6);
    const trendStart = new Date();
    trendStart.setMonth(trendStart.getMonth() - trendMonths + 1);
    trendStart.setDate(1);
    trendStart.setHours(0, 0, 0, 0);

    const monthlyLeadData = await prisma.lead.groupBy({
      by: ["updatedAt"],
      where: {
        clientId,
        status: "won",
        value: { not: null },
        updatedAt: { gte: trendStart },
      },
      _sum: { value: true },
    });

    // Build month buckets and aggregate the grouped results
    const monthBuckets: Record<string, number> = {};
    for (let i = trendMonths - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthBuckets[d.toISOString().slice(0, 7)] = 0;
    }

    for (const row of monthlyLeadData) {
      const monthKey = row.updatedAt.toISOString().slice(0, 7);
      if (monthKey in monthBuckets) {
        monthBuckets[monthKey] += row._sum.value ?? 0;
      }
    }

    const monthlyTrend = Object.entries(monthBuckets).map(
      ([month, returns]) => ({
        month,
        investment: monthlyInvestment,
        returns,
      })
    );

    return NextResponse.json({
      totalInvestment,
      totalReturns,
      netProfit,
      roiMultiplier,
      monthlyInvestment,
      monthsActive,
      revenueBySource,
      monthlyTrend,
      breakdown: {
        wonLeadValue,
        estimatedAdRevenue,
        referralValue,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[analytics/roi] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to calculate ROI" },
      { status: 500 }
    );
  }
}
