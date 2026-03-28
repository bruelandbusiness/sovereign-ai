import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Full-Funnel Attribution (P6 ROI Engine)
// ---------------------------------------------------------------------------

export { attributeRevenueToSource, getAttributionChain } from "@/lib/roi/attribution";

// ---------------------------------------------------------------------------
// Revenue Attribution Helpers
// ---------------------------------------------------------------------------

interface TrackEventInput {
  leadId?: string;
  bookingId?: string;
  invoiceId?: string;
  channel: string;
  campaignId?: string;
  eventType: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track a revenue attribution event.
 */
export async function trackRevenueEvent(
  clientId: string,
  input: TrackEventInput
) {
  return prisma.revenueEvent.create({
    data: {
      clientId,
      leadId: input.leadId || null,
      bookingId: input.bookingId || null,
      invoiceId: input.invoiceId || null,
      channel: input.channel,
      campaignId: input.campaignId || null,
      eventType: input.eventType,
      amount: input.amount || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

interface DateRange {
  start: Date;
  end: Date;
}

interface ChannelROI {
  channel: string;
  leads: number;
  bookings: number;
  revenue: number;
  events: number;
}

/**
 * Aggregate ROI by marketing channel within a date range.
 */
export async function getROIByChannel(
  clientId: string,
  dateRange: DateRange
): Promise<ChannelROI[]> {
  const events = await prisma.revenueEvent.findMany({
    where: {
      clientId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    select: {
      channel: true,
      eventType: true,
      amount: true,
    },
    take: 10000,
  });

  // Group by channel
  const channelMap = new Map<string, ChannelROI>();

  for (const event of events) {
    const channelKey = event.channel || "unknown";
    let channel = channelMap.get(channelKey);
    if (!channel) {
      channel = {
        channel: channelKey,
        leads: 0,
        bookings: 0,
        revenue: 0,
        events: 0,
      };
      channelMap.set(channelKey, channel);
    }

    channel.events++;

    switch (event.eventType) {
      case "lead_captured":
        channel.leads++;
        break;
      case "appointment_booked":
        channel.bookings++;
        break;
      case "payment_received":
        channel.revenue += event.amount || 0;
        break;
    }
  }

  return Array.from(channelMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );
}

/**
 * Get funnel metrics for a client within a date range.
 */
export async function getFunnelMetrics(
  clientId: string,
  dateRange: DateRange
) {
  const events = await prisma.revenueEvent.findMany({
    where: {
      clientId,
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    select: {
      eventType: true,
      amount: true,
    },
    take: 10000,
  });

  const adClicks = events.filter((e) => e.eventType === "ad_click").length;
  const leadsCapture = events.filter((e) => e.eventType === "lead_captured").length;
  const bookings = events.filter((e) => e.eventType === "appointment_booked").length;
  const payments = events.filter((e) => e.eventType === "payment_received").length;
  const totalRevenue = events
    .filter((e) => e.eventType === "payment_received")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    adClicks,
    leadsCapture,
    bookings,
    payments,
    totalRevenue,
  };
}
