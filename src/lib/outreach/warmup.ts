import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";

const TAG = "[outreach-warmup]";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WARMUP_MATURE_DAYS = 28;

// ---------------------------------------------------------------------------
// Domain warmup
// ---------------------------------------------------------------------------

/**
 * Check whether a domain has remaining capacity for today.
 */
export async function canSendFromDomain(
  clientId: string,
  domain: string
): Promise<{ allowed: boolean; remaining: number }> {
  const record = await prisma.outreachDomain.findUnique({
    where: { clientId_domain: { clientId, domain } },
  });

  if (!record) {
    logger.warn(`${TAG} No domain record for ${domain} (client ${clientId})`);
    return { allowed: false, remaining: 0 };
  }

  const remaining = record.dailyLimit - record.currentDailySent;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

/**
 * Atomically increment the daily sent count for a domain.
 * Uses a WHERE guard to prevent exceeding the daily limit under concurrency.
 */
export async function incrementDomainCount(
  clientId: string,
  domain: string
): Promise<void> {
  const result = await prisma.$executeRaw(
    Prisma.sql`UPDATE "OutreachDomain"
       SET "currentDailySent" = "currentDailySent" + 1,
           "updatedAt" = NOW()
       WHERE "clientId" = ${clientId}
         AND "domain" = ${domain}
         AND "currentDailySent" < "dailyLimit"`
  );

  if (result === 0) {
    throw new Error(
      `Domain ${domain} for client ${clientId} has reached its daily send limit`
    );
  }
}

// ---------------------------------------------------------------------------
// SMS warmup
// ---------------------------------------------------------------------------

/**
 * Check whether a client has remaining SMS warmup capacity for today.
 */
export async function canSendSmsOutreach(
  clientId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const tracker = await prisma.smsWarmupTracker.findUnique({
    where: { clientId },
  });

  if (!tracker) {
    logger.warn(`${TAG} No SMS warmup tracker for client ${clientId}`);
    return { allowed: false, remaining: 0 };
  }

  const remaining = tracker.dailyLimit - tracker.currentDailySent;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

/**
 * Atomically increment the daily SMS sent count.
 * Uses a WHERE guard to prevent exceeding the daily limit under concurrency.
 */
export async function incrementSmsCount(clientId: string): Promise<void> {
  const result = await prisma.$executeRaw(
    Prisma.sql`UPDATE "SmsWarmupTracker"
       SET "currentDailySent" = "currentDailySent" + 1,
           "updatedAt" = NOW()
       WHERE "clientId" = ${clientId}
         AND "currentDailySent" < "dailyLimit"`
  );

  if (result === 0) {
    throw new Error(
      `SMS warmup limit reached for client ${clientId}`
    );
  }
}

// ---------------------------------------------------------------------------
// Daily reset (midnight cron)
// ---------------------------------------------------------------------------

/**
 * Reset all domain and SMS daily sent counts to zero.
 * Called by the midnight cron job.
 * Returns the total number of records reset.
 */
export async function resetDailyCounts(): Promise<number> {
  const [domainResult, smsResult] = await Promise.all([
    prisma.$executeRaw(
      Prisma.sql`UPDATE "OutreachDomain"
         SET "currentDailySent" = 0,
             "lastResetAt" = NOW(),
             "updatedAt" = NOW()
         WHERE "currentDailySent" > 0`
    ),
    prisma.$executeRaw(
      Prisma.sql`UPDATE "SmsWarmupTracker"
         SET "currentDailySent" = 0,
             "lastResetAt" = NOW(),
             "updatedAt" = NOW()
         WHERE "currentDailySent" > 0`
    ),
  ]);

  const total = domainResult + smsResult;
  logger.info(`${TAG} Reset daily counts: ${domainResult} domains, ${smsResult} SMS trackers`);
  return total;
}

// ---------------------------------------------------------------------------
// Ramp-up (midnight cron, after reset)
// ---------------------------------------------------------------------------

/**
 * Increase daily limits by rampRate for domains and SMS trackers that
 * have not yet reached their maximum. Mark warmupComplete when
 * dailyLimit >= maxDailyLimit. Also mark domains as "warm" after 28+ days.
 *
 * Returns the total number of records ramped up.
 */
export async function rampUpLimits(): Promise<number> {
  // Ramp domain limits
  const domainRamped = await prisma.$executeRaw(
    Prisma.sql`UPDATE "OutreachDomain"
       SET "dailyLimit" = LEAST("dailyLimit" + "rampRate", "maxDailyLimit"),
           "warmupComplete" = CASE
             WHEN "dailyLimit" + "rampRate" >= "maxDailyLimit" THEN true
             ELSE "warmupComplete"
           END,
           "reputation" = CASE
             WHEN "warmupStartDate" <= NOW() - INTERVAL '28 days'
               AND "reputation" = 'warming'
             THEN 'warm'
             ELSE "reputation"
           END,
           "updatedAt" = NOW()
       WHERE "warmupComplete" = false`
  );

  // Ramp SMS limits
  const smsRamped = await prisma.$executeRaw(
    Prisma.sql`UPDATE "SmsWarmupTracker"
       SET "dailyLimit" = LEAST("dailyLimit" + "rampRate", "maxDailyLimit"),
           "warmupComplete" = CASE
             WHEN "dailyLimit" + "rampRate" >= "maxDailyLimit" THEN true
             ELSE "warmupComplete"
           END,
           "updatedAt" = NOW()
       WHERE "warmupComplete" = false`
  );

  const total = domainRamped + smsRamped;
  logger.info(`${TAG} Ramped up limits: ${domainRamped} domains, ${smsRamped} SMS trackers`);
  return total;
}
