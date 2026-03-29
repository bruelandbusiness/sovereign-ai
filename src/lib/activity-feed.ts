import { prisma } from "@/lib/db";

export interface ActivityFeedItem {
  id: string;
  type:
    | "lead"
    | "booking"
    | "review"
    | "payment"
    | "service"
    | "email"
    | "call"
    | "system";
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  priority: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
  actionUrl?: string;
}

interface ActivityFeedOptions {
  limit?: number;
  offset?: number;
  types?: string[];
  since?: Date;
}

interface ActivityFeedResult {
  items: ActivityFeedItem[];
  total: number;
}

/* ------------------------------------------------------------------ */
/*  Mapper functions                                                   */
/* ------------------------------------------------------------------ */

function mapLeadToActivity(lead: {
  id: string;
  name: string;
  status: string;
  source: string;
  score: number | null;
  value: number | null;
  createdAt: Date;
}): ActivityFeedItem {
  const priorityByStatus: Record<string, ActivityFeedItem["priority"]> = {
    new: "high",
    contacted: "medium",
    qualified: "high",
    appointment: "high",
    proposal: "high",
    won: "medium",
    lost: "low",
  };

  return {
    id: `lead-${lead.id}`,
    type: "lead",
    title: `New lead: ${lead.name}`,
    description: `Lead captured via ${lead.source} — status: ${lead.status}`,
    timestamp: lead.createdAt,
    icon: "user-plus",
    priority: priorityByStatus[lead.status] ?? "medium",
    metadata: {
      leadId: lead.id,
      source: lead.source,
      score: lead.score,
      value: lead.value,
    },
    actionUrl: `/dashboard/leads?id=${lead.id}`,
  };
}

function mapBookingToActivity(booking: {
  id: string;
  customerName: string;
  serviceType: string | null;
  status: string;
  startsAt: Date;
  createdAt: Date;
}): ActivityFeedItem {
  const priorityByStatus: Record<string, ActivityFeedItem["priority"]> = {
    confirmed: "high",
    completed: "low",
    canceled: "medium",
    no_show: "medium",
  };

  return {
    id: `booking-${booking.id}`,
    type: "booking",
    title: `Booking: ${booking.customerName}`,
    description: booking.serviceType
      ? `${booking.serviceType} — ${booking.status}`
      : `Appointment — ${booking.status}`,
    timestamp: booking.createdAt,
    icon: "calendar",
    priority: priorityByStatus[booking.status] ?? "medium",
    metadata: {
      bookingId: booking.id,
      serviceType: booking.serviceType,
      startsAt: booking.startsAt.toISOString(),
    },
    actionUrl: `/dashboard/bookings?id=${booking.id}`,
  };
}

function mapReviewToActivity(review: {
  id: string;
  rating: number;
  reviewerName: string;
  platform: string;
  reviewText: string | null;
  createdAt: Date;
}): ActivityFeedItem {
  const priority: ActivityFeedItem["priority"] =
    review.rating <= 2 ? "high" : review.rating <= 3 ? "medium" : "low";

  const stars = "\u2B50".repeat(review.rating);

  return {
    id: `review-${review.id}`,
    type: "review",
    title: `${stars} Review from ${review.reviewerName}`,
    description: review.reviewText
      ? review.reviewText.slice(0, 120)
      : `${review.rating}-star review on ${review.platform}`,
    timestamp: review.createdAt,
    icon: "star",
    priority,
    metadata: {
      reviewId: review.id,
      rating: review.rating,
      platform: review.platform,
    },
    actionUrl: `/dashboard/reviews?id=${review.id}`,
  };
}

function mapInvoiceToActivity(invoice: {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}): ActivityFeedItem {
  const priorityByStatus: Record<string, ActivityFeedItem["priority"]> = {
    paid: "low",
    sent: "medium",
    overdue: "high",
    draft: "low",
    canceled: "low",
  };

  const dollars = (invoice.amount / 100).toFixed(2);

  return {
    id: `payment-${invoice.id}`,
    type: "payment",
    title: `Invoice ${invoice.status}: ${invoice.customerName}`,
    description: `$${dollars} — ${invoice.status}`,
    timestamp: invoice.paidAt ?? invoice.createdAt,
    icon: "credit-card",
    priority: priorityByStatus[invoice.status] ?? "medium",
    metadata: {
      invoiceId: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
    },
    actionUrl: `/dashboard/invoices?id=${invoice.id}`,
  };
}

function mapPhoneCallToActivity(call: {
  id: string;
  from: string;
  to: string;
  direction: string;
  status: string;
  duration: number | null;
  sentiment: string | null;
  createdAt: Date;
}): ActivityFeedItem {
  const label = call.direction === "inbound" ? "Incoming call" : "Outgoing call";
  const durationLabel = call.duration
    ? ` (${Math.floor(call.duration / 60)}m ${call.duration % 60}s)`
    : "";

  const priority: ActivityFeedItem["priority"] =
    call.status === "no-answer" || call.status === "failed"
      ? "high"
      : call.sentiment === "negative"
        ? "high"
        : "medium";

  return {
    id: `call-${call.id}`,
    type: "call",
    title: `${label} — ${call.direction === "inbound" ? call.from : call.to}`,
    description: `${call.status}${durationLabel}`,
    timestamp: call.createdAt,
    icon: "phone",
    priority,
    metadata: {
      callId: call.id,
      direction: call.direction,
      status: call.status,
      duration: call.duration,
      sentiment: call.sentiment,
    },
    actionUrl: `/dashboard/calls?id=${call.id}`,
  };
}

function mapActivityEventToItem(event: {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: string | null;
  createdAt: Date;
}): ActivityFeedItem {
  const parsed = event.metadata ? safeParseMeta(event.metadata) : undefined;

  return {
    id: `event-${event.id}`,
    type: "system",
    title: event.title,
    description: event.description,
    timestamp: event.createdAt,
    icon: "activity",
    priority: "low",
    metadata: parsed,
    actionUrl: undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Aggregation                                                        */
/* ------------------------------------------------------------------ */

export async function getActivityFeed(
  clientId: string,
  options?: ActivityFeedOptions,
): Promise<ActivityFeedResult> {
  const limit = options?.limit ?? 25;
  const offset = options?.offset ?? 0;
  const types = options?.types;
  const since = options?.since;

  const dateFilter = since ? { gte: since } : undefined;

  const shouldInclude = (t: string): boolean =>
    types === undefined || types.length === 0 || types.includes(t);

  // Query all sources in parallel, skipping types that were filtered out.
  const [leads, bookings, reviews, invoices, calls, events] =
    await Promise.all([
      shouldInclude("lead")
        ? prisma.lead.findMany({
            where: {
              clientId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            select: {
              id: true,
              name: true,
              status: true,
              source: true,
              score: true,
              value: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      shouldInclude("booking")
        ? prisma.booking.findMany({
            where: {
              clientId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            select: {
              id: true,
              customerName: true,
              serviceType: true,
              status: true,
              startsAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      shouldInclude("review")
        ? prisma.reviewResponse.findMany({
            where: {
              clientId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            select: {
              id: true,
              rating: true,
              reviewerName: true,
              platform: true,
              reviewText: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      shouldInclude("payment")
        ? prisma.invoice.findMany({
            where: {
              clientId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            select: {
              id: true,
              customerName: true,
              amount: true,
              status: true,
              paidAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      shouldInclude("call")
        ? prisma.phoneCall.findMany({
            where: {
              clientId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            select: {
              id: true,
              from: true,
              to: true,
              direction: true,
              status: true,
              duration: true,
              sentiment: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      shouldInclude("system")
        ? prisma.activityEvent.findMany({
            where: {
              clientId,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              metadata: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

  // Map each source to unified items.
  const allItems: ActivityFeedItem[] = [
    ...leads.map(mapLeadToActivity),
    ...bookings.map(mapBookingToActivity),
    ...reviews.map(mapReviewToActivity),
    ...invoices.map(mapInvoiceToActivity),
    ...calls.map(mapPhoneCallToActivity),
    ...events.map(mapActivityEventToItem),
  ];

  // Sort by timestamp descending (newest first).
  const sorted = [...allItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  const total = sorted.length;
  const items = sorted.slice(offset, offset + limit);

  return { items, total };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function safeParseMeta(raw: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return undefined;
  }
}
