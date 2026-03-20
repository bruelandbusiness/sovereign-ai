import { prisma } from "@/lib/db";

// Metrics we track
export const BENCHMARK_METRICS = [
  "leads_per_month",
  "avg_review_rating",
  "conversion_rate",
  "revenue_per_lead",
  "active_services_count",
] as const;

export type BenchmarkMetric = (typeof BENCHMARK_METRICS)[number];

export interface BenchmarkComparison {
  metric: string;
  label: string;
  yourValue: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  percentile: number;
  sampleSize: number;
}

/**
 * Get a client's benchmark comparison data for all metrics.
 */
export async function getClientBenchmarks(
  clientId: string,
): Promise<BenchmarkComparison[]> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vertical: true, state: true },
  });

  if (!client?.vertical) return [];

  const currentPeriod = getCurrentPeriod();

  // Get benchmarks for this vertical (national or regional)
  const benchmarks = await prisma.industryBenchmark.findMany({
    where: {
      vertical: client.vertical,
      period: currentPeriod,
      OR: [{ region: client.state }, { region: null }],
    },
  });

  // Get client's scores
  const scores = await prisma.clientBenchmarkScore.findMany({
    where: {
      clientId,
      benchmark: { period: currentPeriod },
    },
    include: { benchmark: true },
  });

  const metricLabels: Record<string, string> = {
    leads_per_month: "Leads / Month",
    avg_review_rating: "Avg Review Rating",
    conversion_rate: "Conversion Rate",
    revenue_per_lead: "Revenue / Lead",
    active_services_count: "Active Services",
  };

  return BENCHMARK_METRICS.map((metric) => {
    // Prefer regional benchmark, fall back to national
    const benchmark =
      benchmarks.find((b) => b.metric === metric && b.region === client.state) ||
      benchmarks.find((b) => b.metric === metric && b.region === null);

    const score = scores.find((s) => s.benchmark.metric === metric);

    return {
      metric,
      label: metricLabels[metric] || metric,
      yourValue: score?.score ?? 0,
      p25: benchmark?.p25 ?? 0,
      p50: benchmark?.p50 ?? 0,
      p75: benchmark?.p75 ?? 0,
      p90: benchmark?.p90 ?? 0,
      percentile: score?.percentile ?? 50,
      sampleSize: benchmark?.sampleSize ?? 0,
    };
  });
}

/**
 * Get vertical benchmarks (for display without client context).
 */
export async function getVerticalBenchmarks(
  vertical: string,
  region?: string,
) {
  const currentPeriod = getCurrentPeriod();
  return prisma.industryBenchmark.findMany({
    where: {
      vertical,
      period: currentPeriod,
      ...(region ? { region } : {}),
    },
  });
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
