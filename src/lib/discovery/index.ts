import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { recordConsent } from "@/lib/compliance/consent";
import { scoreDiscoveredLead } from "./scoring";
import { deduplicateDiscoveries } from "./dedup";
import { fetchPermits } from "./sources/permits";
import { fetchRecentSales } from "./sources/real-estate";
import { fetchCompetitorNegativeReviews } from "./sources/competitor-reviews";
import { checkSeasonalTriggers } from "./sources/seasonal";
import { findAgingHomes } from "./sources/aging-homes";
import type {
  RawDiscoveredLead,
  PermitSourceConfig,
  RealEstateSourceConfig,
  CompetitorReviewConfig,
  SeasonalConfig,
  AgingHomeConfig,
  DiscoveryRunResult,
} from "./types";

export type { RawDiscoveredLead, DiscoveryRunResult };

/**
 * Run the full discovery pipeline for a single client.
 *
 * 1. Loads all active DiscoverySource records for the client
 * 2. Runs each source adapter based on its type
 * 3. Deduplicates results against existing records
 * 4. Scores each lead
 * 5. Stores new leads in the DiscoveredLead table
 * 6. Updates each DiscoverySource with run metadata
 */
export async function runDiscoveryForClient(
  clientId: string,
): Promise<DiscoveryRunResult> {
  const result: DiscoveryRunResult = {
    clientId,
    sourcesRun: 0,
    leadsDiscovered: 0,
    leadsStored: 0,
    errors: [],
  };

  logger.info("[discovery] Starting discovery run", { clientId });

  // Load all active discovery sources for this client
  const sources = await prisma.discoverySource.findMany({
    where: { clientId, isActive: true },
  });

  if (sources.length === 0) {
    logger.info("[discovery] No active sources for client", { clientId });
    return result;
  }

  let allLeads: RawDiscoveredLead[] = [];

  // Run each source adapter
  for (const source of sources) {
    result.sourcesRun++;

    let config: Record<string, unknown> = {};
    if (source.config) {
      try {
        config = JSON.parse(source.config) as Record<string, unknown>;
      } catch {
        const errorMsg = `Invalid JSON config for source ${source.id}`;
        logger.warn("[discovery] " + errorMsg, { sourceId: source.id });
        result.errors.push(errorMsg);
        await updateSourceStatus(source.id, "error", errorMsg, 0);
        continue;
      }
    }

    let sourceLeads: RawDiscoveredLead[] = [];
    let status: string = "success";
    let errorMsg: string | undefined;

    try {
      sourceLeads = await runSourceAdapter(source.type, config);
    } catch (err) {
      errorMsg =
        err instanceof Error ? err.message : "Unknown error";
      status = "error";
      logger.errorWithCause(
        "[discovery] Source adapter failed",
        err,
        { sourceId: source.id, type: source.type },
      );
      result.errors.push(`Source ${source.id} (${source.type}): ${errorMsg}`);
    }

    // Tag each lead with the source info
    for (const lead of sourceLeads) {
      lead.sourceType = source.type;
    }

    await updateSourceStatus(source.id, status, errorMsg, sourceLeads.length);
    allLeads = allLeads.concat(sourceLeads);
  }

  result.leadsDiscovered = allLeads.length;

  if (allLeads.length === 0) {
    logger.info("[discovery] No leads discovered", { clientId });
    return result;
  }

  // Deduplicate against existing records and within the batch
  const uniqueLeads = await deduplicateDiscoveries(clientId, allLeads);

  if (uniqueLeads.length === 0) {
    logger.info("[discovery] All leads were duplicates", {
      clientId,
      total: allLeads.length,
    });
    return result;
  }

  // Score and store leads
  const sourceIdByType = new Map(
    sources.map((s) => [s.type, s.id]),
  );

  const leadsToCreate = uniqueLeads.map((lead) => {
    const score = scoreDiscoveredLead(lead);
    const sourceId = sourceIdByType.get(lead.sourceType) ?? sources[0].id;

    return {
      clientId,
      sourceId,
      sourceType: lead.sourceType,
      externalId: lead.externalId ?? null,
      propertyAddress: lead.propertyAddress ?? null,
      ownerName: lead.ownerName ?? null,
      ownerEmail: lead.ownerEmail ?? null,
      ownerPhone: lead.ownerPhone ?? null,
      propertyAge: lead.propertyAge ?? null,
      propertyType: lead.propertyType ?? null,
      saleDate: lead.saleDate ?? null,
      salePrice: lead.salePrice ?? null,
      permitType: lead.permitType ?? null,
      permitDate: lead.permitDate ?? null,
      reviewPlatform: lead.reviewPlatform ?? null,
      reviewRating: lead.reviewRating ?? null,
      reviewSnippet: lead.reviewSnippet ?? null,
      competitorName: lead.competitorName ?? null,
      seasonalTrigger: lead.seasonalTrigger ?? null,
      rawData: lead.rawData ? JSON.stringify(lead.rawData) : null,
      discoveryScore: score,
      status: "new",
    };
  });

  // Batch create, skipping any that violate the unique constraint
  let storedCount = 0;
  try {
    const batchResult = await prisma.discoveredLead.createMany({
      data: leadsToCreate,
      skipDuplicates: true,
    });
    storedCount = batchResult.count;
  } catch (err) {
    // If batch fails, fall back to individual creates for partial success
    logger.errorWithCause("[discovery] Batch create failed, falling back to individual inserts", err, { clientId });
    for (const data of leadsToCreate) {
      try {
        await prisma.discoveredLead.create({ data });
        storedCount++;
      } catch (innerErr) {
        const message = innerErr instanceof Error ? innerErr.message : "";
        if (message.includes("Unique constraint")) {
          continue;
        }
        logger.errorWithCause("[discovery] Failed to store lead", innerErr, {
          clientId,
          externalId: data.externalId,
        });
        result.errors.push(`Failed to store lead: ${data.externalId || "unknown"}`);
      }
    }
  }

  result.leadsStored = storedCount;

  // Record implied consent for discovered leads that have contact info.
  // Implied consent from public business listings expires after 30 days
  // per CAN-SPAM/TCPA best practices — downstream systems should check
  // consentedAt and treat implied consent as stale beyond that window.
  for (const lead of uniqueLeads) {
    if (!lead.ownerEmail && !lead.ownerPhone) {
      continue;
    }
    try {
      await recordConsent({
        clientId,
        contactEmail: lead.ownerEmail ?? null,
        contactPhone: lead.ownerPhone ?? null,
        channel: "email",
        consentType: "implied",
        consentSource: "discovery",
        consentText: `Implied consent: contact discovered from public ${lead.sourceType} listing`,
      });
    } catch (err) {
      logger.errorWithCause(
        "[discovery] Failed to record consent for discovered lead",
        err,
        { clientId, sourceType: lead.sourceType },
      );
    }
  }

  logger.info("[discovery] Discovery run complete", {
    clientId,
    sourcesRun: result.sourcesRun,
    leadsDiscovered: result.leadsDiscovered,
    leadsStored: result.leadsStored,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Dispatch to the appropriate source adapter based on source type.
 */
async function runSourceAdapter(
  type: string,
  config: Record<string, unknown>,
): Promise<RawDiscoveredLead[]> {
  switch (type) {
    case "permit":
      return fetchPermits(config as unknown as PermitSourceConfig);
    case "real_estate":
      return fetchRecentSales(config as unknown as RealEstateSourceConfig);
    case "competitor_review":
      return fetchCompetitorNegativeReviews(
        config as unknown as CompetitorReviewConfig,
      );
    case "seasonal":
      return checkSeasonalTriggers(config as unknown as SeasonalConfig);
    case "aging_home":
      return findAgingHomes(config as unknown as AgingHomeConfig);
    default:
      logger.warn("[discovery] Unknown source type", { type });
      return [];
  }
}

/**
 * Update a DiscoverySource record with the latest run metadata.
 */
async function updateSourceStatus(
  sourceId: string,
  status: string,
  errorMsg: string | undefined,
  count: number,
): Promise<void> {
  try {
    await prisma.discoverySource.update({
      where: { id: sourceId },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: status,
        lastRunError: errorMsg ?? null,
        lastRunCount: count,
      },
    });
  } catch (err) {
    logger.errorWithCause("[discovery] Failed to update source status", err, {
      sourceId,
    });
  }
}
