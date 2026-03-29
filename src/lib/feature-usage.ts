/**
 * Feature usage analytics utility.
 *
 * Pure math/logic for tracking feature adoption, identifying power users,
 * finding underutilized features, and generating usage reports.
 * No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export interface UsageMetric {
  readonly featureId: string;
  readonly clientId: string;
  readonly usageCount: number;
  readonly lastUsedAt: Date;
  readonly firstUsedAt: Date;
  readonly averageSessionDurationMs: number;
}

export interface FeatureUsage {
  readonly featureId: string;
  readonly featureName: string;
  readonly category: string;
  readonly totalUsageCount: number;
  readonly uniqueClientCount: number;
  readonly metrics: readonly UsageMetric[];
}

export interface AdoptionRate {
  readonly featureId: string;
  readonly featureName: string;
  readonly totalClients: number;
  readonly adoptedClients: number;
  readonly rate: number;
  readonly trend: "increasing" | "stable" | "decreasing";
}

export interface UsagePattern {
  readonly clientId: string;
  readonly featuresUsed: readonly string[];
  readonly totalFeatureCount: number;
  readonly adoptionPercentage: number;
  readonly averageWeeklyUsage: number;
  readonly mostUsedFeature: string;
  readonly leastUsedFeature: string;
  readonly isPowerUser: boolean;
}

export interface TrainingSuggestion {
  readonly featureId: string;
  readonly featureName: string;
  readonly category: string;
  readonly adoptionRate: number;
  readonly priority: "critical" | "high" | "medium" | "low";
  readonly reason: string;
  readonly suggestedAction: string;
}

export interface FeatureROI {
  readonly featureId: string;
  readonly featureName: string;
  readonly usageCorrelation: number;
  readonly retentionImpact: number;
  readonly revenueImpact: number;
  readonly roiScore: number;
}

export interface FeatureReport {
  readonly generatedAt: Date;
  readonly totalClients: number;
  readonly totalFeatures: number;
  readonly adoptionRates: readonly AdoptionRate[];
  readonly powerUsers: readonly UsagePattern[];
  readonly underutilizedFeatures: readonly AdoptionRate[];
  readonly trainingSuggestions: readonly TrainingSuggestion[];
  readonly featureROI: readonly FeatureROI[];
  readonly overallAdoptionRate: number;
  readonly averageFeaturesPerClient: number;
}

/* ------------------------------------------------------------------ */
/*  Platform Features Constant                                         */
/* ------------------------------------------------------------------ */

export interface PlatformFeature {
  readonly id: string;
  readonly name: string;
  readonly category: string;
}

export const PLATFORM_FEATURES: readonly PlatformFeature[] = [
  // Dashboard & Analytics
  { id: "dashboard_views", name: "Dashboard Views", category: "Analytics" },
  { id: "kpi_checks", name: "KPI Checks", category: "Analytics" },
  { id: "report_generation", name: "Report Generation", category: "Analytics" },
  { id: "export", name: "Export", category: "Analytics" },

  // Lead & Client Management
  { id: "lead_management", name: "Lead Management", category: "CRM" },
  { id: "booking_management", name: "Booking Management", category: "CRM" },

  // Reviews & Reputation
  { id: "review_responses", name: "Review Responses", category: "Reputation" },

  // Marketing
  { id: "content_publishing", name: "Content Publishing", category: "Marketing" },
  { id: "email_campaigns", name: "Email Campaigns", category: "Marketing" },
  { id: "ad_management", name: "Ad Management", category: "Marketing" },
  { id: "seo_tools", name: "SEO Tools", category: "Marketing" },

  // AI & Automation
  { id: "chatbot_configuration", name: "Chatbot Configuration", category: "AI" },
  { id: "voice_agent_setup", name: "Voice Agent Setup", category: "AI" },

  // Platform
  { id: "api_usage", name: "API Usage", category: "Platform" },
  { id: "settings_changes", name: "Settings Changes", category: "Platform" },
] as const;

const POWER_USER_THRESHOLD = 0.8;
const UNDERUTILIZED_THRESHOLD = 0.2;
const WEEKS_PER_PERIOD = 4;

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function buildFeatureLookup(): ReadonlyMap<string, PlatformFeature> {
  const map = new Map<string, PlatformFeature>();
  for (const feature of PLATFORM_FEATURES) {
    map.set(feature.id, feature);
  }
  return map;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Computes the Pearson correlation coefficient between two arrays.
 * Returns 0 when the standard deviation of either series is zero.
 */
function pearsonCorrelation(
  xs: readonly number[],
  ys: readonly number[],
): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Calculates the adoption rate for each feature -- the percentage of
 * total clients that have used the feature at least once.
 */
export function calculateAdoptionRate(
  featureUsages: readonly FeatureUsage[],
  totalClients: number,
): readonly AdoptionRate[] {
  if (totalClients <= 0) return [];

  const lookup = buildFeatureLookup();

  return featureUsages.map((usage) => {
    const feature = lookup.get(usage.featureId);
    const rate = clamp(usage.uniqueClientCount / totalClients, 0, 1);

    return {
      featureId: usage.featureId,
      featureName: feature?.name ?? usage.featureName,
      totalClients,
      adoptedClients: usage.uniqueClientCount,
      rate,
      trend: determineTrend(usage.metrics),
    };
  });
}

/**
 * Determines the usage trend from the metric timestamps.
 * Splits the metrics into two halves by firstUsedAt and compares
 * usage counts.
 */
function determineTrend(
  metrics: readonly UsageMetric[],
): "increasing" | "stable" | "decreasing" {
  if (metrics.length < 2) return "stable";

  const sorted = [...metrics].sort(
    (a, b) => a.lastUsedAt.getTime() - b.lastUsedAt.getTime(),
  );
  const mid = Math.floor(sorted.length / 2);

  const firstHalfTotal = sorted
    .slice(0, mid)
    .reduce((sum, m) => sum + m.usageCount, 0);
  const secondHalfTotal = sorted
    .slice(mid)
    .reduce((sum, m) => sum + m.usageCount, 0);

  const ratio =
    firstHalfTotal === 0 ? 2 : secondHalfTotal / firstHalfTotal;

  if (ratio > 1.15) return "increasing";
  if (ratio < 0.85) return "decreasing";
  return "stable";
}

/**
 * Tracks how often a feature is used per client per week.
 *
 * @param metrics - Raw usage metrics for a single feature.
 * @param periodWeeks - Number of weeks the period covers (defaults to 4).
 * @returns Map from clientId to average weekly usage count.
 */
export function trackUsageFrequency(
  metrics: readonly UsageMetric[],
  periodWeeks: number = WEEKS_PER_PERIOD,
): ReadonlyMap<string, number> {
  const safeWeeks = Math.max(periodWeeks, 1);
  const result = new Map<string, number>();

  for (const metric of metrics) {
    const weeklyAvg = metric.usageCount / safeWeeks;
    result.set(metric.clientId, weeklyAvg);
  }

  return result;
}

/**
 * Identifies power users -- clients that have adopted 80 % or more of
 * all tracked platform features.
 */
export function identifyPowerUsers(
  featureUsages: readonly FeatureUsage[],
  allClientIds: readonly string[],
): readonly UsagePattern[] {
  const totalFeatures = PLATFORM_FEATURES.length;
  if (totalFeatures === 0 || allClientIds.length === 0) return [];

  const clientFeatureMap = new Map<
    string,
    { features: Set<string>; totalUsage: number; featureUsage: Map<string, number> }
  >();

  for (const clientId of allClientIds) {
    clientFeatureMap.set(clientId, {
      features: new Set(),
      totalUsage: 0,
      featureUsage: new Map(),
    });
  }

  for (const usage of featureUsages) {
    for (const metric of usage.metrics) {
      const entry = clientFeatureMap.get(metric.clientId);
      if (!entry) continue;

      entry.features.add(usage.featureId);
      entry.totalUsage += metric.usageCount;
      entry.featureUsage.set(
        usage.featureId,
        (entry.featureUsage.get(usage.featureId) ?? 0) + metric.usageCount,
      );
    }
  }

  const patterns: UsagePattern[] = [];

  for (const [clientId, entry] of Array.from(clientFeatureMap)) {
    const adoptionPercentage = entry.features.size / totalFeatures;
    if (adoptionPercentage < POWER_USER_THRESHOLD) continue;

    const featureEntries = Array.from(entry.featureUsage.entries());
    const sortedByUsage = featureEntries.sort((a, b) => b[1] - a[1]);

    patterns.push({
      clientId,
      featuresUsed: Array.from(entry.features),
      totalFeatureCount: entry.features.size,
      adoptionPercentage,
      averageWeeklyUsage: entry.totalUsage / WEEKS_PER_PERIOD,
      mostUsedFeature: sortedByUsage[0]?.[0] ?? "",
      leastUsedFeature: sortedByUsage[sortedByUsage.length - 1]?.[0] ?? "",
      isPowerUser: true,
    });
  }

  return patterns;
}

/**
 * Finds features adopted by fewer than 20 % of clients.
 */
export function findUnderutilizedFeatures(
  featureUsages: readonly FeatureUsage[],
  totalClients: number,
): readonly AdoptionRate[] {
  const adoptionRates = calculateAdoptionRate(featureUsages, totalClients);

  return adoptionRates.filter((ar) => ar.rate < UNDERUTILIZED_THRESHOLD);
}

/**
 * Suggests training programmes based on underutilized features.
 * Features with lower adoption rates receive higher priority.
 */
export function suggestFeatureTraining(
  featureUsages: readonly FeatureUsage[],
  totalClients: number,
): readonly TrainingSuggestion[] {
  const underutilized = findUnderutilizedFeatures(featureUsages, totalClients);
  const lookup = buildFeatureLookup();

  return underutilized.map((item) => {
    const feature = lookup.get(item.featureId);
    const priority = derivePriority(item.rate);

    return {
      featureId: item.featureId,
      featureName: item.featureName,
      category: feature?.category ?? "Unknown",
      adoptionRate: item.rate,
      priority,
      reason: buildTrainingReason(item),
      suggestedAction: buildSuggestedAction(item, feature),
    };
  });
}

function derivePriority(
  rate: number,
): "critical" | "high" | "medium" | "low" {
  if (rate < 0.05) return "critical";
  if (rate < 0.1) return "high";
  if (rate < 0.15) return "medium";
  return "low";
}

function buildTrainingReason(item: AdoptionRate): string {
  const pct = (item.rate * 100).toFixed(1);
  if (item.rate < 0.05) {
    return (
      `Only ${pct}% of clients use ${item.featureName}. ` +
      "This feature is nearly invisible and may need onboarding changes."
    );
  }
  return (
    `${item.featureName} has a ${pct}% adoption rate, ` +
    "well below the 20% threshold. Targeted training could improve uptake."
  );
}

function buildSuggestedAction(
  item: AdoptionRate,
  feature: PlatformFeature | undefined,
): string {
  const category = feature?.category ?? "General";
  if (item.rate < 0.05) {
    return (
      `Schedule a dedicated ${category} onboarding webinar focusing ` +
      `on ${item.featureName}. Consider adding in-app guided tours.`
    );
  }
  if (item.rate < 0.1) {
    return (
      `Create a short tutorial video for ${item.featureName} and ` +
      "include it in the weekly client newsletter."
    );
  }
  return (
    `Add contextual tooltips and help links for ${item.featureName} ` +
    "within the platform to drive organic discovery."
  );
}

/* ------------------------------------------------------------------ */
/*  Report Generation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Generates a comprehensive feature usage report suitable for a
 * dashboard display. Aggregates adoption rates, power user lists,
 * under-utilised features, training suggestions, and ROI data.
 */
export function generateUsageReport(
  featureUsages: readonly FeatureUsage[],
  totalClients: number,
  allClientIds: readonly string[],
  clientRetentionMonths: ReadonlyMap<string, number>,
  clientMonthlyRevenue: ReadonlyMap<string, number>,
): FeatureReport {
  const adoptionRates = calculateAdoptionRate(featureUsages, totalClients);
  const powerUsers = identifyPowerUsers(featureUsages, allClientIds);
  const underutilizedFeatures = findUnderutilizedFeatures(
    featureUsages,
    totalClients,
  );
  const trainingSuggestions = suggestFeatureTraining(
    featureUsages,
    totalClients,
  );
  const featureROI = calculateFeatureROI(
    featureUsages,
    allClientIds,
    clientRetentionMonths,
    clientMonthlyRevenue,
  );

  const totalAdopted = adoptionRates.reduce(
    (sum, ar) => sum + ar.adoptedClients,
    0,
  );
  const overallAdoptionRate =
    adoptionRates.length > 0 && totalClients > 0
      ? totalAdopted / (adoptionRates.length * totalClients)
      : 0;

  const clientFeatureCounts = new Map<string, number>();
  for (const usage of featureUsages) {
    for (const metric of usage.metrics) {
      clientFeatureCounts.set(
        metric.clientId,
        (clientFeatureCounts.get(metric.clientId) ?? 0) + 1,
      );
    }
  }

  const averageFeaturesPerClient =
    clientFeatureCounts.size > 0
      ? Array.from(clientFeatureCounts.values()).reduce((s, v) => s + v, 0) /
        clientFeatureCounts.size
      : 0;

  return {
    generatedAt: new Date(),
    totalClients,
    totalFeatures: PLATFORM_FEATURES.length,
    adoptionRates,
    powerUsers,
    underutilizedFeatures,
    trainingSuggestions,
    featureROI,
    overallAdoptionRate,
    averageFeaturesPerClient,
  };
}

/* ------------------------------------------------------------------ */
/*  Feature ROI                                                        */
/* ------------------------------------------------------------------ */

/**
 * Correlates feature usage with client retention and revenue.
 *
 * For each feature, it computes a Pearson correlation between usage
 * counts and (a) retention months and (b) monthly revenue.  The
 * final `roiScore` is a weighted combination (60 % retention, 40 %
 * revenue) clamped to [-1, 1].
 */
export function calculateFeatureROI(
  featureUsages: readonly FeatureUsage[],
  allClientIds: readonly string[],
  clientRetentionMonths: ReadonlyMap<string, number>,
  clientMonthlyRevenue: ReadonlyMap<string, number>,
): readonly FeatureROI[] {
  const lookup = buildFeatureLookup();

  return featureUsages.map((usage) => {
    const feature = lookup.get(usage.featureId);

    const clientUsageMap = new Map<string, number>();
    for (const metric of usage.metrics) {
      clientUsageMap.set(
        metric.clientId,
        (clientUsageMap.get(metric.clientId) ?? 0) + metric.usageCount,
      );
    }

    const usageCounts: number[] = [];
    const retentionValues: number[] = [];
    const revenueValues: number[] = [];

    for (const clientId of allClientIds) {
      const count = clientUsageMap.get(clientId) ?? 0;
      const retention = clientRetentionMonths.get(clientId) ?? 0;
      const revenue = clientMonthlyRevenue.get(clientId) ?? 0;

      usageCounts.push(count);
      retentionValues.push(retention);
      revenueValues.push(revenue);
    }

    const retentionCorrelation = pearsonCorrelation(
      usageCounts,
      retentionValues,
    );
    const revenueCorrelation = pearsonCorrelation(
      usageCounts,
      revenueValues,
    );

    const roiScore = clamp(
      retentionCorrelation * 0.6 + revenueCorrelation * 0.4,
      -1,
      1,
    );

    return {
      featureId: usage.featureId,
      featureName: feature?.name ?? usage.featureName,
      usageCorrelation:
        pearsonCorrelation(usageCounts, usageCounts) === 0
          ? 0
          : retentionCorrelation,
      retentionImpact: retentionCorrelation,
      revenueImpact: revenueCorrelation,
      roiScore,
    };
  });
}
