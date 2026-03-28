import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * GET /api/enrichment/status/[leadId]
 * Get enrichment status for a lead.
 */
export async function GET(
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

    const record = await prisma.enrichmentRecord.findFirst({
      where: { clientId, leadId },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No enrichment record found for this lead" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: record.id,
      status: record.status,
      ownerName: record.ownerName,
      mailingAddress: record.mailingAddress,
      emailFound: record.emailFound,
      emailVerified: record.emailVerified,
      emailSource: record.emailSource,
      phoneLineType: record.phoneLineType,
      phoneVerified: record.phoneVerified,
      socialProfiles: record.socialProfiles
        ? JSON.parse(record.socialProfiles)
        : null,
      propertyAge: record.propertyAge,
      propertyValue: record.propertyValue,
      lastPermitDate: record.lastPermitDate?.toISOString() ?? null,
      enrichedAt: record.enrichedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[api/enrichment/status] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch enrichment status" },
      { status: 500 },
    );
  }
}
