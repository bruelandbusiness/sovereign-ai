/**
 * Multi-Location Management
 *
 * Pure calculation functions for home service businesses with multiple offices.
 * No side effects, no DB access — these transform raw inputs into
 * location comparisons, rankings, and resource allocation suggestions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Location {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly timezone: string;
  readonly serviceAreaZipCodes: readonly string[];
  readonly createdAt: Date;
}

export interface LocationMetrics {
  readonly locationId: string;
  readonly period: { readonly start: Date; readonly end: Date };
  readonly leads: number;
  readonly revenue: number;
  readonly adSpend: number;
  readonly reviews: number;
  readonly averageRating: number;
  readonly bookings: number;
  readonly conversionRate: number;
  readonly growthRate: number;
}

export interface LocationComparison {
  readonly locations: readonly LocationMetrics[];
  readonly metricDiffs: {
    readonly leads: readonly number[];
    readonly revenue: readonly number[];
    readonly reviews: readonly number[];
    readonly bookings: readonly number[];
    readonly conversionRate: readonly number[];
    readonly growthRate: readonly number[];
  };
  readonly bestPerMetric: {
    readonly leads: string;
    readonly revenue: string;
    readonly reviews: string;
    readonly bookings: string;
    readonly conversionRate: string;
    readonly growthRate: string;
  };
}

export type RankableMetric =
  | "revenue"
  | "leads"
  | "reviews"
  | "growthRate";

export interface LocationRanking {
  readonly metric: RankableMetric;
  readonly rankings: readonly {
    readonly rank: number;
    readonly locationId: string;
    readonly value: number;
  }[];
}

export interface LocationROI {
  readonly locationId: string;
  readonly revenue: number;
  readonly adSpend: number;
  readonly roi: number;
  readonly revenuePerDollarSpent: number;
}

export interface AggregatedMetrics {
  readonly totalLeads: number;
  readonly totalRevenue: number;
  readonly totalAdSpend: number;
  readonly totalReviews: number;
  readonly totalBookings: number;
  readonly averageConversionRate: number;
  readonly averageGrowthRate: number;
  readonly averageRating: number;
  readonly locationCount: number;
}

export interface BestPerformers {
  readonly leads: { readonly locationId: string; readonly value: number };
  readonly revenue: { readonly locationId: string; readonly value: number };
  readonly reviews: { readonly locationId: string; readonly value: number };
  readonly bookings: { readonly locationId: string; readonly value: number };
  readonly conversionRate: {
    readonly locationId: string;
    readonly value: number;
  };
  readonly growthRate: {
    readonly locationId: string;
    readonly value: number;
  };
}

export interface UnderperformerFlag {
  readonly locationId: string;
  readonly underperformingMetrics: readonly {
    readonly metric: string;
    readonly value: number;
    readonly average: number;
    readonly percentBelowAverage: number;
  }[];
}

export interface ResourceAllocation {
  readonly locationId: string;
  readonly currentSpend: number;
  readonly suggestedSpend: number;
  readonly changePercent: number;
  readonly rationale: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new Location record.
 *
 * @param params - Location details including name, address, phone,
 *                 timezone, and service area zip codes.
 * @returns An immutable Location object with a generated id.
 */
export function createLocation(params: {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly timezone: string;
  readonly serviceAreaZipCodes: readonly string[];
}): Location {
  return {
    id: generateId(),
    name: params.name,
    address: params.address,
    phone: params.phone,
    timezone: params.timezone,
    serviceAreaZipCodes: [...params.serviceAreaZipCodes],
    createdAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/**
 * Compare two or more locations side-by-side on key metrics.
 *
 * @param metrics - Array of LocationMetrics (one per location).
 * @returns A LocationComparison with diffs and best-per-metric labels.
 */
export function compareLocations(
  metrics: readonly LocationMetrics[],
): LocationComparison {
  if (metrics.length < 2) {
    throw new Error("At least two locations are required for comparison.");
  }

  const extractValues = (
    key: keyof Pick<
      LocationMetrics,
      "leads" | "revenue" | "reviews" | "bookings" |
      "conversionRate" | "growthRate"
    >,
  ): readonly number[] => metrics.map((m) => m[key]);

  const findBest = (
    key: keyof Pick<
      LocationMetrics,
      "leads" | "revenue" | "reviews" | "bookings" |
      "conversionRate" | "growthRate"
    >,
  ): string => {
    let bestIdx = 0;
    for (let i = 1; i < metrics.length; i++) {
      if (metrics[i][key] > metrics[bestIdx][key]) {
        bestIdx = i;
      }
    }
    return metrics[bestIdx].locationId;
  };

  return {
    locations: metrics,
    metricDiffs: {
      leads: extractValues("leads"),
      revenue: extractValues("revenue"),
      reviews: extractValues("reviews"),
      bookings: extractValues("bookings"),
      conversionRate: extractValues("conversionRate"),
      growthRate: extractValues("growthRate"),
    },
    bestPerMetric: {
      leads: findBest("leads"),
      revenue: findBest("revenue"),
      reviews: findBest("reviews"),
      bookings: findBest("bookings"),
      conversionRate: findBest("conversionRate"),
      growthRate: findBest("growthRate"),
    },
  };
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Rank locations by a chosen metric in descending order.
 *
 * @param metrics - Array of LocationMetrics for all locations.
 * @param metric  - The metric to rank by.
 * @returns A LocationRanking with positions from 1..N.
 */
export function rankLocations(
  metrics: readonly LocationMetrics[],
  metric: RankableMetric,
): LocationRanking {
  const sorted = [...metrics].sort((a, b) => b[metric] - a[metric]);

  return {
    metric,
    rankings: sorted.map((m, idx) => ({
      rank: idx + 1,
      locationId: m.locationId,
      value: m[metric],
    })),
  };
}

// ---------------------------------------------------------------------------
// ROI
// ---------------------------------------------------------------------------

/**
 * Calculate per-location ROI from ad spend and revenue.
 *
 * ROI = (revenue - adSpend) / adSpend * 100
 *
 * @param metrics - Metrics for a single location.
 * @returns LocationROI with roi percentage and revenue-per-dollar.
 */
export function calculateLocationROI(
  metrics: LocationMetrics,
): LocationROI {
  const { locationId, revenue, adSpend } = metrics;

  if (adSpend === 0) {
    return {
      locationId,
      revenue,
      adSpend: 0,
      roi: revenue > 0 ? Infinity : 0,
      revenuePerDollarSpent: revenue > 0 ? Infinity : 0,
    };
  }

  return {
    locationId,
    revenue,
    adSpend,
    roi: ((revenue - adSpend) / adSpend) * 100,
    revenuePerDollarSpent: revenue / adSpend,
  };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/**
 * Sum and average metrics across all locations.
 *
 * @param metrics - Array of LocationMetrics for every location.
 * @returns AggregatedMetrics with totals and averages.
 */
export function aggregateMetrics(
  metrics: readonly LocationMetrics[],
): AggregatedMetrics {
  if (metrics.length === 0) {
    return {
      totalLeads: 0,
      totalRevenue: 0,
      totalAdSpend: 0,
      totalReviews: 0,
      totalBookings: 0,
      averageConversionRate: 0,
      averageGrowthRate: 0,
      averageRating: 0,
      locationCount: 0,
    };
  }

  const count = metrics.length;

  const totals = metrics.reduce(
    (acc, m) => ({
      leads: acc.leads + m.leads,
      revenue: acc.revenue + m.revenue,
      adSpend: acc.adSpend + m.adSpend,
      reviews: acc.reviews + m.reviews,
      bookings: acc.bookings + m.bookings,
      conversionRate: acc.conversionRate + m.conversionRate,
      growthRate: acc.growthRate + m.growthRate,
      rating: acc.rating + m.averageRating,
    }),
    {
      leads: 0,
      revenue: 0,
      adSpend: 0,
      reviews: 0,
      bookings: 0,
      conversionRate: 0,
      growthRate: 0,
      rating: 0,
    },
  );

  return {
    totalLeads: totals.leads,
    totalRevenue: totals.revenue,
    totalAdSpend: totals.adSpend,
    totalReviews: totals.reviews,
    totalBookings: totals.bookings,
    averageConversionRate: totals.conversionRate / count,
    averageGrowthRate: totals.growthRate / count,
    averageRating: totals.rating / count,
    locationCount: count,
  };
}

// ---------------------------------------------------------------------------
// Best Performer
// ---------------------------------------------------------------------------

/**
 * Identify the top-performing location for each key metric.
 *
 * @param metrics - Array of LocationMetrics for every location.
 * @returns BestPerformers mapping each metric to its top location.
 */
export function findBestPerformer(
  metrics: readonly LocationMetrics[],
): BestPerformers {
  if (metrics.length === 0) {
    throw new Error(
      "At least one location is required to find best performers.",
    );
  }

  const best = (
    key: keyof Pick<
      LocationMetrics,
      "leads" | "revenue" | "reviews" | "bookings" |
      "conversionRate" | "growthRate"
    >,
  ): { readonly locationId: string; readonly value: number } => {
    let topIdx = 0;
    for (let i = 1; i < metrics.length; i++) {
      if (metrics[i][key] > metrics[topIdx][key]) {
        topIdx = i;
      }
    }
    return { locationId: metrics[topIdx].locationId, value: metrics[topIdx][key] };
  };

  return {
    leads: best("leads"),
    revenue: best("revenue"),
    reviews: best("reviews"),
    bookings: best("bookings"),
    conversionRate: best("conversionRate"),
    growthRate: best("growthRate"),
  };
}

// ---------------------------------------------------------------------------
// Underperformers
// ---------------------------------------------------------------------------

/**
 * Flag locations performing below average on key metrics.
 *
 * A location is flagged for a metric when its value falls below the
 * cross-location average for that metric.
 *
 * @param metrics - Array of LocationMetrics for every location.
 * @returns Array of UnderperformerFlag (only locations with at least
 *          one underperforming metric are included).
 */
export function detectUnderperformers(
  metrics: readonly LocationMetrics[],
): readonly UnderperformerFlag[] {
  if (metrics.length < 2) {
    return [];
  }

  const aggregated = aggregateMetrics(metrics);

  const averages: Record<string, number> = {
    leads: aggregated.totalLeads / aggregated.locationCount,
    revenue: aggregated.totalRevenue / aggregated.locationCount,
    reviews: aggregated.totalReviews / aggregated.locationCount,
    bookings: aggregated.totalBookings / aggregated.locationCount,
    conversionRate: aggregated.averageConversionRate,
    growthRate: aggregated.averageGrowthRate,
  };

  const checkedMetrics = [
    "leads",
    "revenue",
    "reviews",
    "bookings",
    "conversionRate",
    "growthRate",
  ] as const;

  const flags: UnderperformerFlag[] = [];

  for (const m of metrics) {
    const underperforming: {
      metric: string;
      value: number;
      average: number;
      percentBelowAverage: number;
    }[] = [];

    for (const key of checkedMetrics) {
      const avg = averages[key];
      const val = m[key];
      if (avg > 0 && val < avg) {
        underperforming.push({
          metric: key,
          value: val,
          average: avg,
          percentBelowAverage:
            Math.round(((avg - val) / avg) * 10000) / 100,
        });
      }
    }

    if (underperforming.length > 0) {
      flags.push({
        locationId: m.locationId,
        underperformingMetrics: underperforming,
      });
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// Resource Allocation
// ---------------------------------------------------------------------------

/**
 * Suggest budget distribution across locations based on performance.
 *
 * Strategy: allocate proportionally more budget to locations with
 * higher ROI and higher conversion rates, while ensuring
 * underperformers still receive a minimum viable budget.
 *
 * @param metrics     - Array of LocationMetrics for every location.
 * @param totalBudget - The total budget to distribute across locations.
 * @returns Array of ResourceAllocation recommendations, one per location.
 */
export function suggestResourceAllocation(
  metrics: readonly LocationMetrics[],
  totalBudget: number,
): readonly ResourceAllocation[] {
  if (metrics.length === 0) {
    return [];
  }

  if (totalBudget <= 0) {
    throw new Error("Total budget must be a positive number.");
  }

  const MIN_ALLOCATION_PERCENT = 0.05;
  const minPerLocation = totalBudget * MIN_ALLOCATION_PERCENT;
  const minTotal = minPerLocation * metrics.length;

  if (minTotal >= totalBudget) {
    const equalShare = totalBudget / metrics.length;
    return metrics.map((m) => ({
      locationId: m.locationId,
      currentSpend: m.adSpend,
      suggestedSpend: Math.round(equalShare * 100) / 100,
      changePercent: computeChangePercent(m.adSpend, equalShare),
      rationale:
        "Budget is too small for performance-based allocation; " +
        "distributing equally.",
    }));
  }

  const distributableBudget = totalBudget - minTotal;

  const roiScores = metrics.map((m) => {
    const roi = m.adSpend > 0
      ? (m.revenue - m.adSpend) / m.adSpend
      : 0;
    const positiveRoi = Math.max(roi, 0);
    const conversionWeight = m.conversionRate;
    return positiveRoi + conversionWeight;
  });

  const totalScore = roiScores.reduce((sum, s) => sum + s, 0);

  return metrics.map((m, idx) => {
    const performanceShare = totalScore > 0
      ? (roiScores[idx] / totalScore) * distributableBudget
      : distributableBudget / metrics.length;

    const suggested =
      Math.round((minPerLocation + performanceShare) * 100) / 100;

    const change = computeChangePercent(m.adSpend, suggested);

    let rationale: string;
    if (change > 10) {
      rationale =
        "High ROI and conversion rate justify increased investment.";
    } else if (change < -10) {
      rationale =
        "Lower ROI suggests reallocating budget to higher-performing " +
        "locations.";
    } else {
      rationale = "Current spend is roughly aligned with performance.";
    }

    return {
      locationId: m.locationId,
      currentSpend: m.adSpend,
      suggestedSpend: suggested,
      changePercent: change,
      rationale,
    };
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `loc_${timestamp}_${random}`;
}

function computeChangePercent(
  current: number,
  suggested: number,
): number {
  if (current === 0) {
    return suggested > 0 ? 100 : 0;
  }
  return (
    Math.round(((suggested - current) / current) * 10000) / 100
  );
}
