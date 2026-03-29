import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// GET — paginated performance events for the current client
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { clientId } = await requireClient();

    const url = request.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50", 10) || 50,
      100
    );
    const offset = (page - 1) * limit;
    const typeFilter = url.searchParams.get("type"); // qualified_lead | booked_appointment | completed_job

    interface EventWhere {
      clientId: string;
      type?: string;
    }

    const where: EventWhere = { clientId };
    if (typeFilter) {
      where.type = typeFilter;
    }

    const [events, total] = await Promise.all([
      prisma.performanceEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.performanceEvent.count({ where }),
    ]);

    return NextResponse.json({
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        amount: event.amount,
        leadId: event.leadId,
        bookingId: event.bookingId,
        description: event.description,
        invoiced: event.invoiced,
        createdAt: event.createdAt.toISOString(),
      })),
      page,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    Sentry.captureException(error);
    logger.errorWithCause("[performance/events] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance events" },
      { status: 500 }
    );
  }
}
