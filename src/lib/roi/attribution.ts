import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttributionResult {
  leadId: string;
  source: string;
  channel: string;
  revenueAmount: number;
  timeToConversionDays: number;
}

export interface AttributionChain {
  lead: {
    id: string;
    source: string;
    status: string;
    score: number | null;
    createdAt: Date;
  };
  booking?: {
    id: string;
    scheduledAt: Date;
    status: string;
  };
  revenue?: {
    id: string;
    amount: number;
    type: string;
    createdAt: Date;
  };
}

// ---------------------------------------------------------------------------
// attributeRevenueToSource
// ---------------------------------------------------------------------------

/**
 * Trace a revenue event back through the funnel:
 *   RevenueEvent -> Booking -> Lead -> source/channel
 *
 * If the revenue event has a direct leadId, use it. Otherwise, attempt to
 * match by clientId + date proximity (booking within 30 days before event).
 */
export async function attributeRevenueToSource(
  clientId: string,
  revenueEventId: string,
): Promise<AttributionResult | null> {
  const event = await prisma.revenueEvent.findFirst({
    where: { id: revenueEventId, clientId },
  });

  if (!event) {
    logger.warn("[roi/attribution] Revenue event not found", {
      revenueEventId,
      clientId,
    });
    return null;
  }

  // Try direct lead link first
  let leadId = event.leadId;

  if (!leadId && event.bookingId) {
    // Try to find a lead by matching booking customer to lead
    const booking = await prisma.booking.findFirst({
      where: { id: event.bookingId, clientId },
    });
    if (booking) {
      const matchedLead = await prisma.lead.findFirst({
        where: {
          clientId,
          OR: [
            { email: booking.customerEmail ?? undefined },
            { phone: booking.customerPhone ?? undefined },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      if (matchedLead) {
        leadId = matchedLead.id;
      }
    }
  }

  // Fallback: find most recent lead for this client created before the event
  if (!leadId) {
    const proximityLead = await prisma.lead.findFirst({
      where: {
        clientId,
        createdAt: {
          lte: event.createdAt,
          gte: new Date(event.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (proximityLead) {
      leadId = proximityLead.id;
    }
  }

  if (!leadId) {
    logger.info("[roi/attribution] No lead found for revenue event", {
      revenueEventId,
      clientId,
    });
    return null;
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, clientId },
  });

  if (!lead) {
    return null;
  }

  const timeToConversionMs = event.createdAt.getTime() - lead.createdAt.getTime();
  const timeToConversionDays = Math.max(
    0,
    Math.round(timeToConversionMs / (24 * 60 * 60 * 1000)),
  );

  return {
    leadId: lead.id,
    source: lead.source,
    channel: event.channel || lead.source,
    revenueAmount: event.amount ?? 0,
    timeToConversionDays,
  };
}

// ---------------------------------------------------------------------------
// getAttributionChain
// ---------------------------------------------------------------------------

/**
 * Returns the full attribution chain for a lead:
 *   Lead -> Booking (if any) -> RevenueEvent (if any)
 */
export async function getAttributionChain(
  leadId: string,
): Promise<AttributionChain> {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: {
      id: true,
      source: true,
      status: true,
      score: true,
      createdAt: true,
      clientId: true,
      email: true,
      phone: true,
    },
  });

  const chain: AttributionChain = {
    lead: {
      id: lead.id,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      createdAt: lead.createdAt,
    },
  };

  // Find a booking linked via revenue event or by customer contact info
  const revenueWithBooking = await prisma.revenueEvent.findFirst({
    where: { leadId: lead.id, bookingId: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  let bookingId = revenueWithBooking?.bookingId ?? null;

  if (!bookingId) {
    // Try matching by customer contact info
    const contactFilters: Array<{ customerEmail?: string; customerPhone?: string }> = [];
    if (lead.email) contactFilters.push({ customerEmail: lead.email });
    if (lead.phone) contactFilters.push({ customerPhone: lead.phone });

    if (contactFilters.length > 0) {
      const matchedBooking = await prisma.booking.findFirst({
        where: {
          clientId: lead.clientId,
          OR: contactFilters,
        },
        orderBy: { startsAt: "desc" },
      });
      if (matchedBooking) {
        bookingId = matchedBooking.id;
      }
    }
  }

  if (bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId },
    });
    if (booking) {
      chain.booking = {
        id: booking.id,
        scheduledAt: booking.startsAt,
        status: booking.status,
      };
    }
  }

  // Find the most recent revenue event linked to this lead
  const revenueEvent = await prisma.revenueEvent.findFirst({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
  });

  if (revenueEvent) {
    chain.revenue = {
      id: revenueEvent.id,
      amount: revenueEvent.amount ?? 0,
      type: revenueEvent.eventType,
      createdAt: revenueEvent.createdAt,
    };
  }

  return chain;
}
