import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { BENCHMARK_METRICS } from "@/lib/intelligence/benchmarks";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronErrorHandler("cron/benchmark-aggregation", async (request) => {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  const startTime = Date.now();

  try {
    logger.info("[cron/benchmark-aggregation] Starting benchmark aggregation");

    const period = getCurrentPeriod();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all active clients grouped by vertical
    const clients = await prisma.client.findMany({
      where: {
        vertical: { not: null },
        subscription: { status: "active" },
      },
      select: {
        id: true,
        vertical: true,
        state: true,
      },
      take: 500,
    });

    if (clients.length === 0) {
      return NextResponse.json({
        ok: true,
        period,
        clientsProcessed: 0,
        benchmarksCreated: 0,
        scoresCreated: 0,
        message: "No active clients with verticals to benchmark",
      });
    }

    // Group clients by vertical
    const verticalGroups: Record<string, typeof clients> = {};
    for (const client of clients) {
      const v = client.vertical!;
      if (!verticalGroups[v]) verticalGroups[v] = [];
      verticalGroups[v].push(client);
    }

    let benchmarksCreated = 0;
    let scoresCreated = 0;
    const errors: string[] = [];

    // ── Batch aggregation: replace per-client count queries with groupBy ──
    const clientIds = clients.map((c) => c.id);

    const [leadCounts, convertedLeadCounts, serviceCounts] = await Promise.all([
      prisma.lead.groupBy({
        by: ["clientId"],
        _count: { id: true },
        where: {
          clientId: { in: clientIds },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.lead.groupBy({
        by: ["clientId"],
        _count: { id: true },
        where: {
          clientId: { in: clientIds },
          status: "won",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.clientService.groupBy({
        by: ["clientId"],
        _count: { id: true },
        where: {
          clientId: { in: clientIds },
          status: "active",
        },
      }),
    ]);

    // Build O(1) lookup maps from groupBy results
    const leadCountMap = new Map(
      leadCounts.map((r) => [r.clientId, r._count.id])
    );
    const convertedCountMap = new Map(
      convertedLeadCounts.map((r) => [r.clientId, r._count.id])
    );
    const serviceCountMap = new Map(
      serviceCounts.map((r) => [r.clientId, r._count.id])
    );

    // Build per-client metrics from the maps
    const clientMetrics: Record<string, Record<string, number>> = {};
    for (const client of clients) {
      const leadCount = leadCountMap.get(client.id) ?? 0;
      const convertedCount = convertedCountMap.get(client.id) ?? 0;
      const serviceCount = serviceCountMap.get(client.id) ?? 0;

      clientMetrics[client.id] = {
        leads_per_month: leadCount,
        avg_review_rating: 4.5, // Placeholder — would come from actual review data
        conversion_rate:
          leadCount > 0 ? (convertedCount / leadCount) * 100 : 0,
        revenue_per_lead: 250, // Placeholder — would come from revenue tracking
        active_services_count: serviceCount,
      };
    }

    for (const [vertical, vClients] of Object.entries(verticalGroups)) {
      try {
        // Collect all score upsert operations for this vertical to batch them
        const scoreOps: Array<{
          clientId: string;
          benchmarkId: string;
          score: number;
          percentile: number;
        }> = [];

        // Calculate percentiles for each metric (national — region=null)
        for (const metric of BENCHMARK_METRICS) {
          const values = vClients
            .map((c) => clientMetrics[c.id]?.[metric] ?? 0)
            .sort((a, b) => a - b);

          if (values.length < 2) continue; // Need at least 2 data points

          const p25 = percentile(values, 25);
          const p50 = percentile(values, 50);
          const p75 = percentile(values, 75);
          const p90 = percentile(values, 90);

          // Upsert national benchmark (region=null).
          // Prisma composite unique with nullable region requires find-first + create/update.
          const existingBenchmark = await prisma.industryBenchmark.findFirst({
            where: { vertical, region: null, metric, period },
          });

          let benchmark;
          if (existingBenchmark) {
            benchmark = await prisma.industryBenchmark.update({
              where: { id: existingBenchmark.id },
              data: {
                p25,
                p50,
                p75,
                p90,
                sampleSize: values.length,
                calculatedAt: new Date(),
              },
            });
          } else {
            benchmark = await prisma.industryBenchmark.create({
              data: {
                vertical,
                region: null,
                metric,
                period,
                p25,
                p50,
                p75,
                p90,
                sampleSize: values.length,
              },
            });
          }
          benchmarksCreated++;

          // Collect score upserts for batching
          for (const client of vClients) {
            const value = clientMetrics[client.id]?.[metric] ?? 0;
            const pctile = calculatePercentile(value, values);
            scoreOps.push({
              clientId: client.id,
              benchmarkId: benchmark.id,
              score: value,
              percentile: pctile,
            });
          }
        }

        // Batch all score upserts for this vertical in a single transaction
        if (scoreOps.length > 0) {
          await prisma.$transaction(
            scoreOps.map((op) =>
              prisma.clientBenchmarkScore.upsert({
                where: {
                  clientId_benchmarkId: {
                    clientId: op.clientId,
                    benchmarkId: op.benchmarkId,
                  },
                },
                create: {
                  clientId: op.clientId,
                  benchmarkId: op.benchmarkId,
                  score: op.score,
                  percentile: op.percentile,
                },
                update: {
                  score: op.score,
                  percentile: op.percentile,
                  calculatedAt: new Date(),
                },
              })
            )
          );
          scoresCreated += scoreOps.length;
        }
      } catch (err) {
        const message = `Failed to process vertical "${vertical}": ${err instanceof Error ? err.message : "Unknown error"}`;
        logger.error(`[cron/benchmark-aggregation] ${message}`);
        errors.push(message);
      }
    }

    logger.info(
      `[cron/benchmark-aggregation] Done: ${clients.length} clients, ${benchmarksCreated} benchmarks, ${scoresCreated} scores`
    );

    logger.info(`[cron/benchmark-aggregation] Completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      ok: true,
      period,
      clientsProcessed: clients.length,
      benchmarksCreated,
      scoresCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.errorWithCause("[cron/benchmark-aggregation] Fatal error", err);
    return NextResponse.json(
      { error: "Benchmark aggregation cron job failed" },
      { status: 500 }
    );
  }
});

function percentile(sortedValues: number[], p: number): number {
  const idx = (p / 100) * (sortedValues.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedValues[lower];
  return (
    sortedValues[lower] +
    (sortedValues[upper] - sortedValues[lower]) * (idx - lower)
  );
}

function calculatePercentile(value: number, sortedValues: number[]): number {
  const belowCount = sortedValues.filter((v) => v < value).length;
  const equalCount = sortedValues.filter((v) => v === value).length;
  return Math.round(
    ((belowCount + equalCount * 0.5) / sortedValues.length) * 100,
  );
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
