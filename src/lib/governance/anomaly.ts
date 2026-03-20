import { prisma } from "@/lib/db";

/**
 * Check if a metric value is anomalous for a client.
 * Compares against 30-day rolling average.
 * Returns AnomalyLog if anomaly detected, null otherwise.
 */
async function checkAnomaly(
  clientId: string,
  type: string,
  metricName: string,
  currentValue: number,
  historicalValues: number[]
): Promise<{ id: string } | null> {
  // With weekly buckets over 30 days we only get ~4 data points. Require a
  // minimum of 4 historical values, but prefer 7+ for confidence.
  if (historicalValues.length < 4) return null;

  const mean =
    historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const variance =
    historicalValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    historicalValues.length;
  const stdDev = Math.sqrt(variance);

  // No variance means every historical value is identical -- only flag if the
  // current value is meaningfully different (>50% change from the mean).
  if (stdDev === 0) {
    if (mean === 0) return null;
    if (Math.abs(currentValue - mean) / mean < 0.5) return null;
    // Fall through to log the anomaly with a synthetic z-score
  }

  // Use 3-sigma threshold to reduce false positives (was 2-sigma).
  // With small sample sizes a 2-sigma threshold fires on ~5% of normal
  // observations, which is too noisy for an alerting system.
  const zScore = stdDev > 0 ? Math.abs(currentValue - mean) / stdDev : 10;

  if (zScore < 3) return null; // Within normal range

  const severity = zScore > 4 ? "critical" : "warning";
  const direction = currentValue > mean ? "spike" : "drop";

  const anomaly = await prisma.anomalyLog.create({
    data: {
      clientId,
      type,
      severity,
      title: `${metricName} ${direction} detected`,
      description: `${metricName} is ${currentValue.toFixed(1)} vs ${mean.toFixed(1)} average (${zScore.toFixed(1)}\u03C3 deviation)`,
      metadata: JSON.stringify({ metricName, currentValue, mean, stdDev, zScore, direction }),
    },
  });

  return { id: anomaly.id };
}

/**
 * Run anomaly detection across all metrics for a client.
 *
 * Accepts optional pre-fetched lead dates to avoid an extra DB query per client.
 * When called from the cron job, leads are batch-fetched for all clients at once
 * and passed in here, eliminating the N+1 pattern.
 */
export async function detectClientAnomalies(
  clientId: string,
  prefetchedLeadDates?: Date[]
): Promise<number> {
  let anomaliesFound = 0;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check lead volume — use pre-fetched data if available, otherwise query
  const leadCounts = prefetchedLeadDates
    ? groupByWeek(prefetchedLeadDates, thirtyDaysAgo)
    : await getWeeklyLeadCounts(clientId, thirtyDaysAgo);

  if (leadCounts.length > 0) {
    const currentWeek = leadCounts[leadCounts.length - 1];
    const historical = leadCounts.slice(0, -1);
    const result = await checkAnomaly(
      clientId,
      "lead_volume_spike",
      "Weekly leads",
      currentWeek,
      historical
    );
    if (result) anomaliesFound++;
  }

  return anomaliesFound;
}

/**
 * Group an array of dates into weekly buckets and return counts.
 * Used by both the single-client and batch paths.
 */
function groupByWeek(dates: Date[], since: Date): number[] {
  const weeks: Record<number, number> = {};
  for (const date of dates) {
    const weekNum = Math.floor(
      (date.getTime() - since.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    weeks[weekNum] = (weeks[weekNum] || 0) + 1;
  }

  return Object.keys(weeks)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => weeks[Number(k)]);
}

async function getWeeklyLeadCounts(
  clientId: string,
  since: Date
): Promise<number[]> {
  const leads = await prisma.lead.findMany({
    where: { clientId, createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return groupByWeek(
    leads.map((l) => l.createdAt),
    since
  );
}
