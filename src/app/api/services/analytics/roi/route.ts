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

    // ── Total returns: won lead values ────────────────────────
    const leads = await prisma.lead.findMany({
      where: { clientId },
      select: {
        status: true,
        value: true,
        source: true,
        updatedAt: true,
      },
      take: 5000,
    });

    const wonLeadValue = leads
      .filter((l) => l.status === "won" && l.value != null)
      .reduce((sum, l) => sum + (l.value || 0), 0);

    // ── Estimated value from other channels ───────────────────
    const adCampaigns = await prisma.adCampaign.findMany({
      where: { clientId },
      select: { conversions: true },
      take: 200,
    });
    const adConversions = adCampaigns.reduce(
      (sum, c) => sum + c.conversions,
      0
    );
    // Estimate average conversion value from won leads
    const wonLeads = leads.filter(
      (l) => l.status === "won" && l.value != null
    );
    const avgDealValue =
      wonLeads.length > 0
        ? wonLeads.reduce((sum, l) => sum + (l.value || 0), 0) / wonLeads.length
        : 50000; // default $500 if no data
    const estimatedAdRevenue = adConversions * avgDealValue;

    // Referral value (from leads with source 'referral')
    const referralLeads = leads.filter(
      (l) => l.source === "referral" && l.status === "won" && l.value != null
    );
    const referralValue = referralLeads.reduce(
      (sum, l) => sum + (l.value || 0),
      0
    );

    // ── Totals ────────────────────────────────────────────────
    const totalReturns = wonLeadValue + estimatedAdRevenue + referralValue;
    const roiMultiplier =
      totalInvestment > 0
        ? Math.round((totalReturns / totalInvestment) * 10) / 10
        : 0;
    const netProfit = totalReturns - totalInvestment;

    // ── Revenue by source ─────────────────────────────────────
    const revenueBySource: Record<string, number> = {};
    leads
      .filter((l) => l.status === "won" && l.value != null)
      .forEach((l) => {
        revenueBySource[l.source] =
          (revenueBySource[l.source] || 0) + (l.value || 0);
      });

    // Add estimated ad revenue
    if (estimatedAdRevenue > 0) {
      revenueBySource["ads"] =
        (revenueBySource["ads"] || 0) + estimatedAdRevenue;
    }

    // ── Monthly trend ─────────────────────────────────────────
    const monthlyTrend: Array<{
      month: string;
      investment: number;
      returns: number;
    }> = [];

    for (let i = Math.min(monthsActive, 6) - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStr = monthDate.toISOString().slice(0, 7); // YYYY-MM
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthLeadValue = leads
        .filter(
          (l) =>
            l.status === "won" &&
            l.value != null &&
            l.updatedAt >= monthStart &&
            l.updatedAt <= monthEnd
        )
        .reduce((sum, l) => sum + (l.value || 0), 0);

      monthlyTrend.push({
        month: monthStr,
        investment: monthlyInvestment,
        returns: monthLeadValue,
      });
    }

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
