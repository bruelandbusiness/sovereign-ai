import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TAG = "[CRON PROSPECT-TO-CAMPAIGN]";

// ---------------------------------------------------------------------------
// GET /api/cron/prospect-to-campaign
//
// Daily cron job that moves enriched prospects into the active cold outreach
// campaign pipeline. Runs at 7:30 AM daily.
//
// Two sources of qualified prospects are checked:
//
//   1. DiscoveredLead records that have a completed EnrichmentRecord with a
//      non-null emailFound value. These leads went through the discovery →
//      enrichment pipeline and now have a verified/found email address.
//
//   2. Prospect records that already carry an email address. These may have
//      been loaded manually (setup-autonomous.ts) or sourced via scraping.
//
// For each qualified prospect, the job:
//   - Skips any whose email is already enrolled in the target campaign
//   - Creates a ColdEmailRecipient with status "pending" and a fresh trackingId
//   - Logs a summary of how many recipients were added
//
// The "target campaign" is the first active ColdOutreachCampaign (step 1 of
// the sequence) ordered by startedAt ascending. If no active campaign exists,
// the job looks for a draft campaign and activates it. If there are no
// campaigns at all, the job exits gracefully and logs a warning.
// ---------------------------------------------------------------------------

interface AddResult {
  discoveredLeadsEnrolled: number;
  prospectsEnrolled: number;
  skipped: number;
  errors: number;
  campaignId: string | null;
  campaignName: string | null;
}

// ---------------------------------------------------------------------------
// Find or activate a campaign to enroll recipients into
// ---------------------------------------------------------------------------

async function resolveTargetCampaign(): Promise<{
  id: string;
  name: string;
} | null> {
  // Prefer an already-active campaign (sequence step 1, oldest started)
  const activeCampaign = await prisma.coldOutreachCampaign.findFirst({
    where: { status: "active", sequenceStep: 1 },
    orderBy: { startedAt: "asc" },
    select: { id: true, name: true },
  });

  if (activeCampaign) {
    return activeCampaign;
  }

  // Fall back to the earliest draft campaign at step 1
  const draftCampaign = await prisma.coldOutreachCampaign.findFirst({
    where: { status: "draft", sequenceStep: 1 },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  if (!draftCampaign) {
    return null;
  }

  // Activate the draft campaign so the outreach-send cron can pick it up
  await prisma.coldOutreachCampaign.update({
    where: { id: draftCampaign.id },
    data: { status: "active", startedAt: new Date() },
  });

  logger.info(`${TAG} Activated draft campaign: ${draftCampaign.name}`, {
    campaignId: draftCampaign.id,
  });

  return draftCampaign;
}

// ---------------------------------------------------------------------------
// Fetch emails already enrolled in the campaign to avoid duplicates
// ---------------------------------------------------------------------------

async function getEnrolledEmails(campaignId: string): Promise<Set<string>> {
  const existing = await prisma.coldEmailRecipient.findMany({
    where: { campaignId },
    select: { email: true },
  });
  return new Set(existing.map((r) => r.email.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Enroll recipients in batches
// ---------------------------------------------------------------------------

interface RecipientInput {
  email: string;
  name: string | null;
  company: string | null;
  vertical: string | null;
  city: string | null;
}

async function enrollRecipients(
  campaignId: string,
  enrolledEmails: Set<string>,
  candidates: RecipientInput[]
): Promise<{ added: number; skipped: number; errors: number }> {
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const candidate of candidates) {
    const normalizedEmail = candidate.email.toLowerCase().trim();

    if (!normalizedEmail || enrolledEmails.has(normalizedEmail)) {
      skipped++;
      continue;
    }

    try {
      await prisma.coldEmailRecipient.create({
        data: {
          campaignId,
          email: normalizedEmail,
          name: candidate.name,
          company: candidate.company,
          vertical: candidate.vertical,
          city: candidate.city,
          status: "pending",
          trackingId: crypto.randomUUID(),
        },
      });

      // Track locally so subsequent iterations in the same run don't re-add
      enrolledEmails.add(normalizedEmail);
      added++;
    } catch (error) {
      // P2002 = unique constraint violation — email already enrolled
      const isUniqueViolation =
        error instanceof Error && error.message.includes("P2002");

      if (isUniqueViolation) {
        enrolledEmails.add(normalizedEmail);
        skipped++;
      } else {
        errors++;
        logger.errorWithCause(
          `${TAG} Failed to create recipient for ${normalizedEmail}`,
          error,
          { campaignId }
        );
      }
    }
  }

  return { added, skipped, errors };
}

// ---------------------------------------------------------------------------
// Core orchestration
// ---------------------------------------------------------------------------

async function enrollQualifiedProspects(): Promise<AddResult> {
  const campaign = await resolveTargetCampaign();

  if (!campaign) {
    logger.warn(`${TAG} No active or draft campaign found — nothing to enroll`);
    return {
      discoveredLeadsEnrolled: 0,
      prospectsEnrolled: 0,
      skipped: 0,
      errors: 0,
      campaignId: null,
      campaignName: null,
    };
  }

  const enrolledEmails = await getEnrolledEmails(campaign.id);

  // ── Source 1: DiscoveredLeads with complete enrichment ──────────────────
  //
  // A DiscoveredLead is considered ready when its linked EnrichmentRecord has
  // status "complete" (or "partial") AND emailFound is not null.
  //
  // We fetch the enrichment records first, then filter by email availability.

  const enrichedRecords = await prisma.enrichmentRecord.findMany({
    where: {
      discoveredLeadId: { not: null },
      status: { in: ["complete", "partial"] },
      emailFound: { not: null },
    },
    select: {
      discoveredLeadId: true,
      emailFound: true,
      ownerName: true,
    },
  });

  // Map discoveredLeadId → enrichment data
  const enrichmentByLeadId = new Map<
    string,
    { email: string; ownerName: string | null }
  >();
  for (const record of enrichedRecords) {
    if (record.discoveredLeadId && record.emailFound) {
      enrichmentByLeadId.set(record.discoveredLeadId, {
        email: record.emailFound,
        ownerName: record.ownerName,
      });
    }
  }

  const discoveredLeadIds = Array.from(enrichmentByLeadId.keys());

  const discoveredLeads =
    discoveredLeadIds.length > 0
      ? await prisma.discoveredLead.findMany({
          where: {
            id: { in: discoveredLeadIds },
            status: { notIn: ["converted", "discarded", "duplicate"] },
          },
          select: {
            id: true,
            ownerName: true,
            competitorName: true,
            propertyType: true,
            seasonalTrigger: true,
            // city/vertical are not direct fields; we use ownerName + enrichment email
          },
        })
      : [];

  const discoveredCandidates: RecipientInput[] = discoveredLeads.map((dl) => {
    const enrichment = enrichmentByLeadId.get(dl.id)!;
    return {
      email: enrichment.email,
      name: dl.ownerName ?? enrichment.ownerName,
      company: dl.competitorName ?? null,
      vertical: dl.propertyType ?? null,
      city: null,
    };
  });

  const dlResult = await enrollRecipients(
    campaign.id,
    enrolledEmails,
    discoveredCandidates
  );

  // ── Source 2: Prospect records that have an email address ────────────────
  //
  // Prospects with a non-null email that are in an actionable status.
  // "outreach" and "nurturing" are already in some pipeline, but we still
  // enroll them so the cold email cron can reach them via this campaign.
  // Prospects in "won" or "lost" are excluded.

  const prospects = await prisma.prospect.findMany({
    where: {
      email: { not: null },
      status: { notIn: ["won", "lost"] },
    },
    select: {
      id: true,
      email: true,
      ownerName: true,
      businessName: true,
      vertical: true,
      city: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const prospectCandidates: RecipientInput[] = prospects
    .filter((p): p is typeof p & { email: string } => Boolean(p.email))
    .map((p) => ({
      email: p.email,
      name: p.ownerName,
      company: p.businessName,
      vertical: p.vertical,
      city: p.city,
    }));

  const prospectResult = await enrollRecipients(
    campaign.id,
    enrolledEmails,
    prospectCandidates
  );

  return {
    discoveredLeadsEnrolled: dlResult.added,
    prospectsEnrolled: prospectResult.added,
    skipped: dlResult.skipped + prospectResult.skipped,
    errors: dlResult.errors + prospectResult.errors,
    campaignId: campaign.id,
    campaignName: campaign.name,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const GET = withCronErrorHandler("cron/prospect-to-campaign", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) {
    return authError;
  }

  try {
    const result = await enrollQualifiedProspects();

    const totalEnrolled =
      result.discoveredLeadsEnrolled + result.prospectsEnrolled;

    logger.info(
      `${TAG} Completed: ${totalEnrolled} enrolled, ${result.skipped} skipped, ${result.errors} errors`,
      {
        campaignId: result.campaignId ?? undefined,
        campaignName: result.campaignName ?? undefined,
        discoveredLeadsEnrolled: result.discoveredLeadsEnrolled,
        prospectsEnrolled: result.prospectsEnrolled,
        skipped: result.skipped,
        errors: result.errors,
      }
    );

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      campaignName: result.campaignName,
      discoveredLeadsEnrolled: result.discoveredLeadsEnrolled,
      prospectsEnrolled: result.prospectsEnrolled,
      totalEnrolled,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Fatal error`, error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
});
