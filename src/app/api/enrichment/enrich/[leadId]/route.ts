import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { enrichLead } from "@/lib/enrichment";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * POST /api/enrichment/enrich/[leadId]
 * Trigger enrichment for a specific lead.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { clientId } = await requireClient();
    const { leadId } = await params;

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required" },
        { status: 400 },
      );
    }

    const record = await enrichLead(clientId, leadId);

    return NextResponse.json({
      id: record.id,
      status: record.status,
      enrichedAt: record.enrichedAt?.toISOString() ?? null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[api/enrichment/enrich] POST failed", error);
    return NextResponse.json(
      { error: "Failed to enrich lead" },
      { status: 500 },
    );
  }
}
