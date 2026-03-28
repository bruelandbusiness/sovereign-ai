import { NextResponse } from "next/server";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TAG = "[CRON OUTREACH ENQUEUE]";

/**
 * Minimum composite score a Prospect must have to be eligible for cold outreach.
 * Consistent with the score >= 60 threshold used across the codebase (AGENTS.md).
 */
const MIN_SCORE_FOR_OUTREACH = 60;

/**
 * Maximum number of prospects to enqueue in a single run to stay within
 * execution time limits and respect campaign daily caps downstream.
 */
const MAX_ENQUEUE_PER_RUN = 200;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnqueueResult {
  prospectId: string;
  email: string;
  campaignId: string;
  campaignName: string;
}

interface SkipReason {
  prospectId: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Helper: find the best matching active campaign for a prospect
// ---------------------------------------------------------------------------

/**
 * Select the most appropriate active campaign for a prospect.
 *
 * Matching priority:
 *   1. Campaign whose name contains the prospect's vertical (case-insensitive)
 *   2. Any active campaign (oldest startedAt first as a stable fallback)
 *
 * Returns null if no active campaigns exist.
 */
function selectCampaign(
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    startedAt: Date | null;
  }>,
  vertical: string | null
): (typeof campaigns)[number] | null {
  if (campaigns.length === 0) return null;

  if (vertical) {
    const normalised = vertical.toLowerCase();
    const verticalMatch = campaigns.find((c) =>
      c.name.toLowerCase().includes(normalised)
    );
    if (verticalMatch) return verticalMatch;
  }

  // Stable fallback: first by startedAt asc, then by id for determinism
  return campaigns[0];
}

// ---------------------------------------------------------------------------
// GET /api/cron/outreach-enqueue
// ---------------------------------------------------------------------------

/**
 * GET /api/cron/outreach-enqueue
 *
 * Daily cron job that bridges prospect discovery/enrichment and cold outreach.
 *
 * Logic:
 *   1. Find enriched Prospects (status = "enriched", score >= 60, email present)
 *      that have NOT yet been enrolled in any ColdOutreachCampaign.
 *   2. Load all active ColdOutreachCampaigns.
 *   3. For each eligible prospect, pick the best-matching campaign.
 *   4. Create a ColdEmailRecipient record (idempotent — unique constraint on
 *      campaignId + email prevents duplicates).
 *   5. Mark the Prospect's status as "outreach" so it isn't re-processed.
 *
 * Schedule: 0 7 * * * (daily at 7 AM — after enrichment-run at 6 AM)
 */
export const GET = withCronErrorHandler("cron/outreach-enqueue", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  const startTime = Date.now();
  logger.info(`${TAG} Starting outreach enqueue run`);

  try {
    // ── 1. Load active campaigns ──────────────────────────────────────────
    const activeCampaigns = await prisma.coldOutreachCampaign.findMany({
      where: { status: "active" },
      select: { id: true, name: true, status: true, startedAt: true },
      orderBy: { startedAt: "asc" },
    });

    if (activeCampaigns.length === 0) {
      logger.info(`${TAG} No active campaigns found — skipping enqueue`);
      return NextResponse.json({
        success: true,
        enqueued: 0,
        skipped: 0,
        message: "No active campaigns",
      });
    }

    // ── 2. Find already-enrolled prospect emails across all campaigns ─────
    //
    // We pull the distinct emails present in ColdEmailRecipient so we can
    // exclude prospects whose email is already enrolled in any campaign.
    // Using a raw groupBy is more efficient than a subquery for large tables.
    const existingRecipients = await prisma.coldEmailRecipient.findMany({
      select: { email: true },
      distinct: ["email"],
    });
    const enrolledEmails = new Set(existingRecipients.map((r) => r.email));

    // ── 3. Fetch eligible prospects ───────────────────────────────────────
    //
    // Criteria:
    //   - status = "enriched"  (set by enrichment-run when score >= 60)
    //   - score  >= MIN_SCORE_FOR_OUTREACH
    //   - email is not null / empty
    //   - not already in outreach (status != "outreach")
    //
    // We fetch a bit more than MAX_ENQUEUE_PER_RUN because some may be
    // filtered out by the in-memory enrolledEmails check below.
    const candidates = await prisma.prospect.findMany({
      where: {
        status: "enriched",
        score: { gte: MIN_SCORE_FOR_OUTREACH },
        email: { not: null },
        // outreachEntryId being null means not yet in the legacy outreach
        // sequence system either — belt-and-suspenders guard
        outreachEntryId: null,
      },
      select: {
        id: true,
        email: true,
        ownerName: true,
        businessName: true,
        vertical: true,
        city: true,
        score: true,
        outreachEntryId: true,
      },
      orderBy: [
        { score: "desc" }, // highest-value prospects first
        { createdAt: "asc" },
      ],
      take: MAX_ENQUEUE_PER_RUN * 2, // over-fetch to absorb in-memory exclusions
    });

    logger.info(`${TAG} Found ${candidates.length} enriched prospect candidates`);

    // ── 4. Enqueue eligible prospects ─────────────────────────────────────
    const enqueued: EnqueueResult[] = [];
    const skipped: SkipReason[] = [];

    for (const prospect of candidates) {
      // Hard stop once we've hit the per-run limit
      if (enqueued.length >= MAX_ENQUEUE_PER_RUN) break;

      const email = prospect.email as string; // guaranteed non-null by query filter

      // Skip if already enrolled in any campaign
      if (enrolledEmails.has(email)) {
        skipped.push({ prospectId: prospect.id, reason: "already_enrolled" });
        continue;
      }

      // Select the best-matching campaign for this prospect's vertical
      const campaign = selectCampaign(activeCampaigns, prospect.vertical);
      if (!campaign) {
        // Shouldn't happen (we checked above), but guard anyway
        skipped.push({ prospectId: prospect.id, reason: "no_active_campaign" });
        continue;
      }

      try {
        // createMany with skipDuplicates would be faster at bulk scale, but
        // individual creates give us per-record error isolation and logging.
        await prisma.coldEmailRecipient.create({
          data: {
            campaignId: campaign.id,
            email,
            name: prospect.ownerName ?? null,
            company: prospect.businessName,
            vertical: prospect.vertical ?? null,
            city: prospect.city ?? null,
            status: "pending",
            trackingId: randomUUID(),
          },
        });

        // Mark prospect as enrolled to prevent re-processing on next run
        await prisma.prospect.update({
          where: { id: prospect.id },
          data: { status: "outreach" },
        });

        // Add to local set so sibling prospects with same email (unlikely but
        // possible) are also skipped within this run
        enrolledEmails.add(email);

        enqueued.push({
          prospectId: prospect.id,
          email,
          campaignId: campaign.id,
          campaignName: campaign.name,
        });

        logger.info(
          `${TAG} Enqueued ${email} → campaign "${campaign.name}" (score: ${prospect.score})`
        );
      } catch (error) {
        // Unique constraint violation = already enrolled via race condition
        const isUniqueViolation =
          error instanceof Error &&
          (error.message.includes("Unique constraint") ||
            error.message.includes("P2002"));

        if (isUniqueViolation) {
          enrolledEmails.add(email);
          skipped.push({ prospectId: prospect.id, reason: "duplicate_constraint" });
          logger.info(`${TAG} Skipped prospect — duplicate constraint (race condition)`, {
            prospectId: prospect.id,
          });
        } else {
          skipped.push({ prospectId: prospect.id, reason: "create_error" });
          logger.errorWithCause(
            `${TAG} Failed to enqueue prospect`,
            error,
            { prospectId: prospect.id },
          );
        }
      }
    }

    const elapsed = Date.now() - startTime;

    logger.info(`${TAG} Completed in ${elapsed}ms`, {
      candidatesFound: candidates.length,
      enqueued: enqueued.length,
      skipped: skipped.length,
      activeCampaigns: activeCampaigns.length,
    });

    return NextResponse.json({
      success: true,
      enqueued: enqueued.length,
      skipped: skipped.length,
      activeCampaigns: activeCampaigns.length,
      elapsedMs: elapsed,
      // Include a summary breakdown of skip reasons for observability
      skipReasons: skipped.reduce<Record<string, number>>((acc, s) => {
        return { ...acc, [s.reason]: (acc[s.reason] ?? 0) + 1 };
      }, {}),
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} Fatal error`, error);
    return NextResponse.json(
      { success: false, error: "Outreach enqueue cron failed" },
      { status: 500 }
    );
  }
});
