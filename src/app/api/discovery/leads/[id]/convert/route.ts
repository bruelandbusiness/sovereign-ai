import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { recordConsent } from "@/lib/compliance/consent";

export const dynamic = "force-dynamic";
/**
 * POST: Convert a DiscoveredLead into a Lead record.
 *
 * Copies relevant fields from the discovered lead to a new Lead,
 * sets the discovered lead status to "converted", and stores the
 * convertedLeadId back reference.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  try {
    // Find the discovered lead and verify ownership
    const discoveredLead = await prisma.discoveredLead.findFirst({
      where: { id, clientId },
    });

    if (!discoveredLead) {
      return NextResponse.json(
        { error: "Discovered lead not found" },
        { status: 404 },
      );
    }

    if (discoveredLead.status === "converted") {
      return NextResponse.json(
        {
          error: "Lead already converted",
          convertedLeadId: discoveredLead.convertedLeadId,
        },
        { status: 409 },
      );
    }

    // Build a name from available fields
    const name =
      discoveredLead.ownerName ||
      discoveredLead.propertyAddress ||
      `Discovery Lead ${discoveredLead.id.slice(-6)}`;

    // Determine source label for the Lead record
    const sourceLabel = `discovery:${discoveredLead.sourceType}`;

    // Create the Lead and update the DiscoveredLead in a transaction
    const [lead] = await prisma.$transaction([
      prisma.lead.create({
        data: {
          clientId,
          name,
          email: discoveredLead.ownerEmail,
          phone: discoveredLead.ownerPhone,
          source: sourceLabel,
          status: "new",
          score: discoveredLead.discoveryScore,
          notes: buildConversionNotes(discoveredLead),
        },
      }),
      prisma.discoveredLead.update({
        where: { id },
        data: {
          status: "converted",
          // convertedLeadId is set in a follow-up update below
        },
      }),
    ]);

    // Update the back-reference with the created lead ID
    await prisma.discoveredLead.update({
      where: { id },
      data: { convertedLeadId: lead.id },
    });

    // Ensure consent is recorded when converting a discovered lead.
    // Implied consent from public business listings expires after 30 days
    // per CAN-SPAM/TCPA best practices.
    if (discoveredLead.ownerEmail || discoveredLead.ownerPhone) {
      try {
        await recordConsent({
          clientId,
          contactEmail: discoveredLead.ownerEmail ?? null,
          contactPhone: discoveredLead.ownerPhone ?? null,
          channel: "email",
          consentType: "implied",
          consentSource: "discovery",
          consentText: `Implied consent: contact discovered from public ${discoveredLead.sourceType} listing`,
        });
      } catch (consentErr) {
        logger.errorWithCause(
          "[api/discovery/leads/convert] Failed to record consent",
          consentErr,
          { clientId, discoveredLeadId: id },
        );
      }
    }

    logger.info("[api/discovery/leads/convert] Lead converted", {
      clientId,
      discoveredLeadId: id,
      leadId: lead.id,
    });

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        discoveredLeadId: id,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.errorWithCause(
      "[api/discovery/leads/[id]/convert] POST failed",
      error,
    );
    return NextResponse.json(
      { error: "Failed to convert discovered lead" },
      { status: 500 },
    );
  }
}

function buildConversionNotes(
  discoveredLead: Record<string, unknown>,
): string {
  const parts: string[] = [];

  if (discoveredLead.propertyAddress) {
    parts.push(`Property: ${discoveredLead.propertyAddress}`);
  }
  if (discoveredLead.propertyAge) {
    parts.push(`Property age: ${discoveredLead.propertyAge} years`);
  }
  if (discoveredLead.permitType) {
    parts.push(`Permit: ${discoveredLead.permitType}`);
  }
  if (discoveredLead.competitorName) {
    parts.push(`Competitor: ${discoveredLead.competitorName}`);
  }
  if (discoveredLead.reviewRating != null) {
    parts.push(
      `Review: ${discoveredLead.reviewRating}/5 on ${discoveredLead.reviewPlatform || "unknown"}`,
    );
  }
  if (discoveredLead.seasonalTrigger) {
    parts.push(`Seasonal trigger: ${discoveredLead.seasonalTrigger}`);
  }
  if (discoveredLead.salePrice) {
    parts.push(
      `Sale price: $${(Number(discoveredLead.salePrice) / 100).toLocaleString()}`,
    );
  }

  parts.push(`Source: discovery:${discoveredLead.sourceType}`);
  parts.push(`Discovery score: ${discoveredLead.discoveryScore ?? "N/A"}`);

  return parts.join("\n");
}
