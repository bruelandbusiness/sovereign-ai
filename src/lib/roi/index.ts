import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelMetrics {
  channel: string;
  leads: number;
  bookings: number;
  revenue: number;
}

export interface SourceMetrics {
  source: string;
  leads: number;
  bookings: number;
  revenue: number;
}

export interface ROIData {
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number;
  totalSpend: number;
  roi: number;
  channelBreakdown: ChannelMetrics[];
  sourceBreakdown: SourceMetrics[];
}

// ---------------------------------------------------------------------------
// calculateROI
// ---------------------------------------------------------------------------

/**
 * Calculate all ROI metrics for a client within a period.
 *
 * - totalLeads: Lead records created in period
 * - totalBookings: Booking records in period
 * - totalRevenue: sum of RevenueEvent.amount (cents) in period
 * - totalSpend: prorated subscription + ad spend in period
 * - roi: (revenue - spend) / spend
 * - channelBreakdown: grouped by RevenueEvent.channel
 * - sourceBreakdown: grouped by Lead.source
 */
export async function calculateROI(
  clientId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<ROIData> {
  const periodFilter = { gte: periodStart, lte: periodEnd };

  // Parallel queries for aggregate data
  const [
    totalLeads,
    totalBookings,
    revenueEvents,
    subscription,
    adCampaigns,
    leads,
  ] = await Promise.all([
    prisma.lead.count({
      where: { clientId, createdAt: periodFilter },
    }),
    prisma.booking.count({
      where: { clientId, startsAt: periodFilter },
    }),
    prisma.revenueEvent.findMany({
      where: { clientId, createdAt: periodFilter },
      select: {
        id: true,
        channel: true,
        eventType: true,
        amount: true,
        leadId: true,
      },
      take: 10000,
    }),
    prisma.subscription.findUnique({
      where: { clientId },
      select: { monthlyAmount: true, status: true },
    }),
    prisma.adCampaign.findMany({
      where: {
        clientId,
        OR: [
          { startDate: periodFilter },
          { endDate: periodFilter },
          {
            startDate: { lte: periodStart },
            endDate: { gte: periodEnd },
          },
        ],
      },
      select: { spent: true, startDate: true, endDate: true },
      take: 1000,
    }),
    prisma.lead.findMany({
      where: { clientId, createdAt: periodFilter },
      select: { id: true, source: true },
      take: 10000,
    }),
  ]);

  // Total revenue (cents)
  const totalRevenue = revenueEvents.reduce(
    (sum, e) => sum + (e.amount ?? 0),
    0,
  );

  // Total spend: prorated subscription + ad spend
  const periodMs = periodEnd.getTime() - periodStart.getTime();
  const periodDays = Math.max(1, periodMs / (24 * 60 * 60 * 1000));
  const monthDays = 30;

  let subscriptionSpend = 0;
  if (subscription && subscription.status === "active") {
    subscriptionSpend = Math.round(
      (subscription.monthlyAmount * periodDays) / monthDays,
    );
  }

  const adSpend = adCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalSpend = subscriptionSpend + adSpend;

  // ROI calculation
  const roi =
    totalRevenue > 0 && totalSpend > 0
      ? (totalRevenue - totalSpend) / totalSpend
      : 0;

  // Channel breakdown from RevenueEvent.channel
  const channelMap = new Map<string, ChannelMetrics>();
  for (const event of revenueEvents) {
    const key = event.channel || "unknown";
    let metrics = channelMap.get(key);
    if (!metrics) {
      metrics = { channel: key, leads: 0, bookings: 0, revenue: 0 };
      channelMap.set(key, metrics);
    }
    switch (event.eventType) {
      case "lead_captured":
        metrics.leads++;
        break;
      case "appointment_booked":
        metrics.bookings++;
        break;
      case "payment_received":
        metrics.revenue += event.amount ?? 0;
        break;
    }
  }
  const channelBreakdown = Array.from(channelMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  // Source breakdown from Lead.source
  const sourceMap = new Map<string, SourceMetrics>();

  // Count leads per source
  for (const lead of leads) {
    const key = lead.source || "unknown";
    let metrics = sourceMap.get(key);
    if (!metrics) {
      metrics = { source: key, leads: 0, bookings: 0, revenue: 0 };
      sourceMap.set(key, metrics);
    }
    metrics.leads++;
  }

  // Attribute bookings and revenue to lead sources via RevenueEvent.leadId
  const leadSourceMap = new Map<string, string>();
  for (const lead of leads) {
    leadSourceMap.set(lead.id, lead.source || "unknown");
  }

  for (const event of revenueEvents) {
    if (!event.leadId) continue;
    const source = leadSourceMap.get(event.leadId);
    if (!source) continue;

    let metrics = sourceMap.get(source);
    if (!metrics) {
      metrics = { source, leads: 0, bookings: 0, revenue: 0 };
      sourceMap.set(source, metrics);
    }

    switch (event.eventType) {
      case "appointment_booked":
        metrics.bookings++;
        break;
      case "payment_received":
        metrics.revenue += event.amount ?? 0;
        break;
    }
  }

  const sourceBreakdown = Array.from(sourceMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  return {
    totalLeads,
    totalBookings,
    totalRevenue,
    totalSpend,
    roi,
    channelBreakdown,
    sourceBreakdown,
  };
}

// ---------------------------------------------------------------------------
// generateROIReport
// ---------------------------------------------------------------------------

/**
 * Generate and persist an ROI report. Returns the report ID.
 */
export async function generateROIReport(
  clientId: string,
  periodType: "weekly" | "monthly",
): Promise<string> {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (periodType === "weekly") {
    periodEnd = now;
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    // Last calendar month
    periodEnd = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st of previous month
  }

  const data = await calculateROI(clientId, periodStart, periodEnd);

  const report = await prisma.rOIReport.create({
    data: {
      clientId,
      periodType,
      periodStart,
      periodEnd,
      totalLeads: data.totalLeads,
      totalBookings: data.totalBookings,
      totalRevenue: data.totalRevenue,
      totalSpend: data.totalSpend,
      roi: data.roi,
      channelBreakdown: JSON.stringify(data.channelBreakdown),
      sourceBreakdown: JSON.stringify(data.sourceBreakdown),
      generatedAt: now,
    },
  });

  logger.info("[roi] Report generated", {
    reportId: report.id,
    clientId,
    periodType,
    roi: data.roi,
  });

  return report.id;
}
