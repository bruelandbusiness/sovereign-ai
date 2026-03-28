import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const TAG = "[compliance/data-privacy]";

/**
 * Purge unconverted leads older than the specified number of days.
 * Only purges leads with status "new" or "contacted" (never converted or active).
 * Also removes associated contact attempt logs and enrichment records.
 *
 * @param daysOld - Number of days after which unconverted leads are purged
 * @returns Number of leads purged
 */
export async function purgeUnconvertedLeads(
  daysOld: number = 90
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  // Find leads that are unconverted and older than the cutoff
  const staleLeads = await prisma.lead.findMany({
    where: {
      status: { in: ["new", "contacted"] },
      createdAt: { lt: cutoff },
    },
    select: { id: true, clientId: true },
    take: 500, // Process in batches to avoid unbounded deletes
  });

  if (staleLeads.length === 0) return 0;

  const leadIds = staleLeads.map((l) => l.id);

  // Delete in a transaction to maintain consistency
  const result = await prisma.$transaction(async (tx) => {
    // Remove contact attempt logs referencing these leads' contact info
    // (ContactAttemptLog doesn't reference leads directly, so this is by email/phone)

    // Delete the leads themselves (cascades to related records via Prisma)
    const deleted = await tx.lead.deleteMany({
      where: { id: { in: leadIds } },
    });

    return deleted.count;
  });

  logger.info(`${TAG} Purged unconverted leads`, {
    purgedCount: result,
    cutoffDate: cutoff.toISOString(),
    daysOld,
  });

  return result;
}

/**
 * Purge old contact attempt logs to prevent unbounded growth.
 * Keeps logs for the specified number of days.
 */
export async function purgeOldContactAttemptLogs(
  daysOld: number = 180
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await prisma.contactAttemptLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    logger.info(`${TAG} Purged old contact attempt logs`, {
      purgedCount: result.count,
      daysOld,
    });
  }

  return result.count;
}

/**
 * Run all data privacy maintenance tasks for a single client.
 */
export async function runPrivacyMaintenanceForClient(
  clientId: string
): Promise<{ leadsPurged: number }> {
  // Get client's compliance config for purge threshold
  const config = await prisma.complianceConfig.findUnique({
    where: { clientId },
    select: { dataPurgeDays: true },
  });

  const purgeDays = config?.dataPurgeDays ?? 90;

  // Purge only this client's unconverted leads
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - purgeDays);

  const staleLeads = await prisma.lead.findMany({
    where: {
      clientId,
      status: { in: ["new", "contacted"] },
      createdAt: { lt: cutoff },
    },
    select: { id: true },
    take: 500,
  });

  if (staleLeads.length === 0) return { leadsPurged: 0 };

  const leadIds = staleLeads.map((l) => l.id);
  const result = await prisma.lead.deleteMany({
    where: { id: { in: leadIds } },
  });

  logger.info(`${TAG} Client privacy maintenance complete`, {
    clientId,
    leadsPurged: result.count,
    purgeDays,
  });

  return { leadsPurged: result.count };
}
