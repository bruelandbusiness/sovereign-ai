/**
 * Client Portfolio Analysis Utility
 *
 * Pure utility module for platform-wide business intelligence.
 * Provides cohort analysis, LTV calculations, revenue breakdowns,
 * retention metrics, and growth forecasting. No database calls --
 * all inputs are passed as function arguments.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

/** Represents a single client record for portfolio analysis. */
export interface PortfolioClient {
  readonly id: string;
  readonly name: string;
  readonly signupDate: Date;
  readonly cancelDate: Date | null;
  readonly tier: string;
  readonly trade: string;
  readonly region: string;
  readonly monthlyRevenue: number;
  readonly activeServices: readonly string[];
  readonly acquisitionCost: number;
  /** Revenue history ordered chronologically (oldest first). */
  readonly revenueHistory: readonly MonthlyRevenueEntry[];
}

/** A single month of revenue for a client. */
export interface MonthlyRevenueEntry {
  readonly month: string;
  readonly revenue: number;
  readonly tier: string;
  readonly services: readonly string[];
}

/** Aggregate portfolio-level metrics. */
export interface PortfolioMetrics {
  readonly totalClients: number;
  readonly activeClients: number;
  readonly totalMRR: number;
  readonly totalARR: number;
  readonly averageRevenuePerAccount: number;
  readonly averageLTV: number;
  readonly averageCAC: number;
  readonly cacToLTVRatio: number;
  readonly netRevenueRetention: number;
  readonly grossChurnRate: number;
  readonly averagePaybackMonths: number;
  readonly computedAt: string;
}

/** A cohort of clients grouped by signup month. */
export interface ClientCohort {
  readonly cohortKey: string;
  readonly signupMonth: string;
  readonly clientIds: readonly string[];
  readonly initialCount: number;
  readonly initialMRR: number;
}

/** Retention and revenue data for a cohort over time. */
export interface CohortAnalysis {
  readonly cohortKey: string;
  readonly signupMonth: string;
  readonly initialCount: number;
  readonly initialMRR: number;
  readonly periods: readonly CohortPeriod[];
}

/** A single period within a cohort analysis. */
export interface CohortPeriod {
  readonly monthOffset: number;
  readonly month: string;
  readonly activeCount: number;
  readonly retentionRate: number;
  readonly revenue: number;
  readonly revenueRetention: number;
}

/** Revenue broken down by multiple dimensions. */
export interface RevenueBreakdown {
  readonly byTier: Readonly<Record<string, TierRevenue>>;
  readonly byTrade: Readonly<Record<string, number>>;
  readonly byService: Readonly<Record<string, number>>;
  readonly byRegion: Readonly<Record<string, number>>;
  readonly totalMRR: number;
}

/** Revenue details for a single tier. */
export interface TierRevenue {
  readonly clientCount: number;
  readonly totalRevenue: number;
  readonly averageRevenue: number;
  readonly percentOfTotal: number;
}

/** Growth metrics and projections. */
export interface GrowthMetrics {
  readonly currentMRR: number;
  readonly previousMRR: number;
  readonly mrrGrowthRate: number;
  readonly projectedMRR3Months: number;
  readonly projectedMRR6Months: number;
  readonly projectedMRR12Months: number;
  readonly monthlyGrowthRates: readonly MonthlyGrowthEntry[];
  readonly trend: "accelerating" | "stable" | "decelerating";
}

/** A single month of growth data. */
export interface MonthlyGrowthEntry {
  readonly month: string;
  readonly mrr: number;
  readonly growthRate: number;
}

/** Expansion revenue from upgrades and add-ons. */
export interface ExpansionRevenue {
  readonly totalExpansion: number;
  readonly fromTierUpgrades: number;
  readonly fromNewServices: number;
  readonly expansionRate: number;
  readonly clients: readonly ExpansionClient[];
}

/** A client that generated expansion revenue. */
export interface ExpansionClient {
  readonly clientId: string;
  readonly expansionAmount: number;
  readonly source: "tier_upgrade" | "new_service";
}

/** Payback period result for a client. */
export interface PaybackResult {
  readonly clientId: string;
  readonly acquisitionCost: number;
  readonly monthlyRevenue: number;
  readonly paybackMonths: number;
  readonly recovered: boolean;
  readonly totalRevenuePaid: number;
}

/** Health indicator for the executive report. */
export type HealthIndicator = "strong" | "moderate" | "weak";

/** Executive-level portfolio report. */
export interface PortfolioReport {
  readonly generatedAt: string;
  readonly metrics: PortfolioMetrics;
  readonly revenueBreakdown: RevenueBreakdown;
  readonly growthMetrics: GrowthMetrics;
  readonly topCohorts: readonly CohortAnalysis[];
  readonly healthIndicators: PortfolioHealthIndicators;
  readonly recommendations: readonly string[];
}

/** Health indicators across key dimensions. */
export interface PortfolioHealthIndicators {
  readonly revenueHealth: HealthIndicator;
  readonly retentionHealth: HealthIndicator;
  readonly growthHealth: HealthIndicator;
  readonly unitEconomicsHealth: HealthIndicator;
  readonly overall: HealthIndicator;
}

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

/** Format a Date as "YYYY-MM". */
function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Round to two decimal places. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Safely compute an average; returns 0 when the list is empty. */
function avg(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Check whether a client was active during a given month. */
function isActiveInMonth(
  client: PortfolioClient,
  month: string,
): boolean {
  const signupKey = toMonthKey(client.signupDate);
  if (month < signupKey) return false;

  if (client.cancelDate !== null) {
    const cancelKey = toMonthKey(client.cancelDate);
    if (month > cancelKey) return false;
  }

  return true;
}

/** Get client revenue for a specific month from history. */
function getRevenueForMonth(
  client: PortfolioClient,
  month: string,
): number {
  const entry = client.revenueHistory.find((e) => e.month === month);
  if (entry) return entry.revenue;

  if (isActiveInMonth(client, month)) return client.monthlyRevenue;
  return 0;
}

/**
 * Generate an ordered list of month keys between two month keys
 * (inclusive on both ends).
 */
function getMonthRange(start: string, end: string): readonly string[] {
  const months: string[] = [];
  const [startYear, startMonth] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);

  let y = startYear;
  let m = startMonth;

  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return months;
}

/** Determine the latest month key present across all clients. */
function getLatestMonth(
  clients: readonly PortfolioClient[],
): string {
  let latest = "0000-00";
  for (const client of clients) {
    for (const entry of client.revenueHistory) {
      if (entry.month > latest) latest = entry.month;
    }
    const signupKey = toMonthKey(client.signupDate);
    if (signupKey > latest) latest = signupKey;
  }

  if (latest === "0000-00") return toMonthKey(new Date());
  return latest;
}

/** Filter to only active clients (no cancel date). */
function activeClients(
  clients: readonly PortfolioClient[],
): readonly PortfolioClient[] {
  return clients.filter((c) => c.cancelDate === null);
}

/* ------------------------------------------------------------------ */
/*  1. analyzeCohort                                                   */
/* ------------------------------------------------------------------ */

/**
 * Group clients by their signup month and track retention over time.
 *
 * Each cohort records the number of active clients and revenue at
 * each subsequent month offset from their signup month.
 */
export function analyzeCohort(
  clients: readonly PortfolioClient[],
): readonly CohortAnalysis[] {
  const cohortMap = new Map<string, PortfolioClient[]>();

  for (const client of clients) {
    const key = toMonthKey(client.signupDate);
    const existing = cohortMap.get(key);
    if (existing) {
      existing.push(client);
    } else {
      cohortMap.set(key, [client]);
    }
  }

  const latestMonth = getLatestMonth(clients);
  const results: CohortAnalysis[] = [];

  const sortedKeys = Array.from(cohortMap.keys()).sort();

  for (const cohortKey of sortedKeys) {
    const cohortClients = cohortMap.get(cohortKey)!;
    const initialCount = cohortClients.length;
    const initialMRR = cohortClients.reduce(
      (sum, c) => sum + getRevenueForMonth(c, cohortKey),
      0,
    );

    const monthRange = getMonthRange(cohortKey, latestMonth);
    const periods: CohortPeriod[] = [];

    for (let offset = 0; offset < monthRange.length; offset++) {
      const month = monthRange[offset];
      const activeInMonth = cohortClients.filter((c) =>
        isActiveInMonth(c, month),
      );
      const revenue = activeInMonth.reduce(
        (sum, c) => sum + getRevenueForMonth(c, month),
        0,
      );

      periods.push({
        monthOffset: offset,
        month,
        activeCount: activeInMonth.length,
        retentionRate:
          initialCount > 0
            ? round2(activeInMonth.length / initialCount)
            : 0,
        revenue,
        revenueRetention:
          initialMRR > 0 ? round2(revenue / initialMRR) : 0,
      });
    }

    results.push({
      cohortKey,
      signupMonth: cohortKey,
      initialCount,
      initialMRR,
      periods,
    });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  2. calculateLTVByCohort                                            */
/* ------------------------------------------------------------------ */

/**
 * Calculate lifetime value for each cohort.
 *
 * LTV is the sum of all revenue generated by the cohort divided by
 * the initial number of clients.
 */
export function calculateLTVByCohort(
  clients: readonly PortfolioClient[],
): ReadonlyMap<string, number> {
  const cohorts = analyzeCohort(clients);
  const result = new Map<string, number>();

  for (const cohort of cohorts) {
    const totalRevenue = cohort.periods.reduce(
      (sum, p) => sum + p.revenue,
      0,
    );
    const ltv =
      cohort.initialCount > 0
        ? round2(totalRevenue / cohort.initialCount)
        : 0;
    result.set(cohort.cohortKey, ltv);
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  3. getRevenueBreakdown                                             */
/* ------------------------------------------------------------------ */

/**
 * Break down current revenue by tier, trade, service, and region.
 *
 * Uses each active client's current monthlyRevenue.
 */
export function getRevenueBreakdown(
  clients: readonly PortfolioClient[],
): RevenueBreakdown {
  const active = activeClients(clients);
  let totalMRR = 0;

  const byTierAccum: Record<
    string,
    { count: number; revenue: number }
  > = {};
  const byTrade: Record<string, number> = {};
  const byService: Record<string, number> = {};
  const byRegion: Record<string, number> = {};

  for (const client of active) {
    totalMRR += client.monthlyRevenue;

    // Tier
    if (!byTierAccum[client.tier]) {
      byTierAccum[client.tier] = { count: 0, revenue: 0 };
    }
    byTierAccum[client.tier].count += 1;
    byTierAccum[client.tier].revenue += client.monthlyRevenue;

    // Trade
    byTrade[client.trade] =
      (byTrade[client.trade] ?? 0) + client.monthlyRevenue;

    // Services (revenue split evenly across services)
    const perService =
      client.activeServices.length > 0
        ? client.monthlyRevenue / client.activeServices.length
        : 0;
    for (const service of client.activeServices) {
      byService[service] = (byService[service] ?? 0) + perService;
    }

    // Region
    byRegion[client.region] =
      (byRegion[client.region] ?? 0) + client.monthlyRevenue;
  }

  const byTier: Record<string, TierRevenue> = {};
  for (const [tier, data] of Object.entries(byTierAccum)) {
    byTier[tier] = {
      clientCount: data.count,
      totalRevenue: round2(data.revenue),
      averageRevenue:
        data.count > 0 ? round2(data.revenue / data.count) : 0,
      percentOfTotal:
        totalMRR > 0 ? round2((data.revenue / totalMRR) * 100) : 0,
    };
  }

  // Round service values
  const roundedByService: Record<string, number> = {};
  for (const [key, value] of Object.entries(byService)) {
    roundedByService[key] = round2(value);
  }

  return {
    byTier,
    byTrade,
    byService: roundedByService,
    byRegion,
    totalMRR: round2(totalMRR),
  };
}

/* ------------------------------------------------------------------ */
/*  4. calculateNRR                                                    */
/* ------------------------------------------------------------------ */

/**
 * Calculate net revenue retention rate between two months.
 *
 * NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
 *
 * Returns a decimal (e.g. 1.05 for 105% NRR). Returns 0 when there is
 * no starting revenue.
 */
export function calculateNRR(
  clients: readonly PortfolioClient[],
  startMonth: string,
  endMonth: string,
): number {
  // Only consider clients that were active at the start
  const startingClients = clients.filter((c) =>
    isActiveInMonth(c, startMonth),
  );

  if (startingClients.length === 0) return 0;

  const startingMRR = startingClients.reduce(
    (sum, c) => sum + getRevenueForMonth(c, startMonth),
    0,
  );

  if (startingMRR === 0) return 0;

  const endMRR = startingClients.reduce(
    (sum, c) => sum + getRevenueForMonth(c, endMonth),
    0,
  );

  return round2(endMRR / startingMRR);
}

/* ------------------------------------------------------------------ */
/*  5. calculateGrossChurn                                             */
/* ------------------------------------------------------------------ */

/**
 * Calculate gross churn rate for a given period.
 *
 * Gross churn = clients lost during period / clients at start of period.
 * Returns a decimal (e.g. 0.05 for 5% churn). Returns 0 when no
 * clients existed at the start.
 */
export function calculateGrossChurn(
  clients: readonly PortfolioClient[],
  periodStart: Date,
  periodEnd: Date,
): number {
  const startMonth = toMonthKey(periodStart);
  const endMonth = toMonthKey(periodEnd);

  const activeAtStart = clients.filter((c) =>
    isActiveInMonth(c, startMonth),
  );

  if (activeAtStart.length === 0) return 0;

  const churned = activeAtStart.filter((c) => {
    if (c.cancelDate === null) return false;
    const cancelKey = toMonthKey(c.cancelDate);
    return cancelKey >= startMonth && cancelKey <= endMonth;
  });

  return round2(churned.length / activeAtStart.length);
}

/* ------------------------------------------------------------------ */
/*  6. identifyExpansionRevenue                                        */
/* ------------------------------------------------------------------ */

/**
 * Identify revenue expansion from tier upgrades and new service
 * additions by comparing two consecutive months of history.
 *
 * Returns total expansion and per-client details.
 */
export function identifyExpansionRevenue(
  clients: readonly PortfolioClient[],
  previousMonth: string,
  currentMonth: string,
): ExpansionRevenue {
  let fromTierUpgrades = 0;
  let fromNewServices = 0;
  const expansionClients: ExpansionClient[] = [];

  for (const client of clients) {
    if (!isActiveInMonth(client, previousMonth)) continue;
    if (!isActiveInMonth(client, currentMonth)) continue;

    const prevEntry = client.revenueHistory.find(
      (e) => e.month === previousMonth,
    );
    const currEntry = client.revenueHistory.find(
      (e) => e.month === currentMonth,
    );

    if (!prevEntry || !currEntry) continue;

    const revDelta = currEntry.revenue - prevEntry.revenue;
    if (revDelta <= 0) continue;

    // Determine source of expansion
    if (currEntry.tier !== prevEntry.tier) {
      fromTierUpgrades += revDelta;
      expansionClients.push({
        clientId: client.id,
        expansionAmount: round2(revDelta),
        source: "tier_upgrade",
      });
    } else if (currEntry.services.length > prevEntry.services.length) {
      fromNewServices += revDelta;
      expansionClients.push({
        clientId: client.id,
        expansionAmount: round2(revDelta),
        source: "new_service",
      });
    }
  }

  const totalExpansion = round2(fromTierUpgrades + fromNewServices);

  const startingMRR = clients
    .filter((c) => isActiveInMonth(c, previousMonth))
    .reduce((sum, c) => sum + getRevenueForMonth(c, previousMonth), 0);

  const expansionRate =
    startingMRR > 0 ? round2(totalExpansion / startingMRR) : 0;

  return {
    totalExpansion,
    fromTierUpgrades: round2(fromTierUpgrades),
    fromNewServices: round2(fromNewServices),
    expansionRate,
    clients: expansionClients,
  };
}

/* ------------------------------------------------------------------ */
/*  7. forecastGrowthRate                                               */
/* ------------------------------------------------------------------ */

/**
 * Project growth based on historical MRR trends.
 *
 * Computes month-over-month growth rates, then uses a weighted
 * average (recent months weigh more) to forecast 3, 6, and 12 months.
 */
export function forecastGrowthRate(
  clients: readonly PortfolioClient[],
  months: readonly string[],
): GrowthMetrics {
  if (months.length === 0) {
    return {
      currentMRR: 0,
      previousMRR: 0,
      mrrGrowthRate: 0,
      projectedMRR3Months: 0,
      projectedMRR6Months: 0,
      projectedMRR12Months: 0,
      monthlyGrowthRates: [],
      trend: "stable",
    };
  }

  const monthlyMRR: { month: string; mrr: number }[] = months.map(
    (month) => ({
      month,
      mrr: clients
        .filter((c) => isActiveInMonth(c, month))
        .reduce((sum, c) => sum + getRevenueForMonth(c, month), 0),
    }),
  );

  const growthEntries: MonthlyGrowthEntry[] = [];
  for (let i = 1; i < monthlyMRR.length; i++) {
    const prev = monthlyMRR[i - 1].mrr;
    const curr = monthlyMRR[i].mrr;
    const rate = prev > 0 ? round2((curr - prev) / prev) : 0;
    growthEntries.push({
      month: monthlyMRR[i].month,
      mrr: round2(curr),
      growthRate: rate,
    });
  }

  // Weighted average growth: more recent months weigh heavier
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < growthEntries.length; i++) {
    const weight = i + 1;
    weightedSum += growthEntries[i].growthRate * weight;
    totalWeight += weight;
  }
  const avgGrowthRate =
    totalWeight > 0 ? round2(weightedSum / totalWeight) : 0;

  const currentMRR = monthlyMRR[monthlyMRR.length - 1].mrr;
  const previousMRR =
    monthlyMRR.length >= 2
      ? monthlyMRR[monthlyMRR.length - 2].mrr
      : 0;

  const project = (months: number): number =>
    round2(currentMRR * Math.pow(1 + avgGrowthRate, months));

  // Detect trend: compare first-half growth to second-half growth
  let trend: GrowthMetrics["trend"] = "stable";
  if (growthEntries.length >= 4) {
    const mid = Math.floor(growthEntries.length / 2);
    const firstHalf = avg(
      growthEntries.slice(0, mid).map((e) => e.growthRate),
    );
    const secondHalf = avg(
      growthEntries.slice(mid).map((e) => e.growthRate),
    );
    const delta = secondHalf - firstHalf;
    if (delta > 0.02) trend = "accelerating";
    else if (delta < -0.02) trend = "decelerating";
  }

  return {
    currentMRR: round2(currentMRR),
    previousMRR: round2(previousMRR),
    mrrGrowthRate: avgGrowthRate,
    projectedMRR3Months: project(3),
    projectedMRR6Months: project(6),
    projectedMRR12Months: project(12),
    monthlyGrowthRates: growthEntries,
    trend,
  };
}

/* ------------------------------------------------------------------ */
/*  8. calculatePaybackPeriod                                          */
/* ------------------------------------------------------------------ */

/**
 * Calculate how many months it takes to recoup acquisition cost
 * from each client's monthly revenue.
 *
 * When a client's total historical revenue already exceeds their
 * CAC, `recovered` is true and `paybackMonths` reflects the actual
 * number of months it took.
 */
export function calculatePaybackPeriod(
  clients: readonly PortfolioClient[],
): readonly PaybackResult[] {
  return clients.map((client) => {
    const totalRevenue = client.revenueHistory.reduce(
      (sum, e) => sum + e.revenue,
      0,
    );

    let paybackMonths: number;
    let recovered: boolean;

    if (client.acquisitionCost <= 0) {
      paybackMonths = 0;
      recovered = true;
    } else if (totalRevenue >= client.acquisitionCost) {
      // Find exact month where CAC was recovered
      let cumulative = 0;
      let monthCount = 0;
      for (const entry of client.revenueHistory) {
        cumulative += entry.revenue;
        monthCount += 1;
        if (cumulative >= client.acquisitionCost) break;
      }
      paybackMonths = monthCount;
      recovered = true;
    } else if (client.monthlyRevenue > 0) {
      const remaining = client.acquisitionCost - totalRevenue;
      const additionalMonths = Math.ceil(
        remaining / client.monthlyRevenue,
      );
      paybackMonths =
        client.revenueHistory.length + additionalMonths;
      recovered = false;
    } else {
      paybackMonths = Infinity;
      recovered = false;
    }

    return {
      clientId: client.id,
      acquisitionCost: client.acquisitionCost,
      monthlyRevenue: client.monthlyRevenue,
      paybackMonths,
      recovered,
      totalRevenuePaid: round2(totalRevenue),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  9. generatePortfolioReport                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate an executive-level portfolio summary with health indicators
 * and actionable recommendations.
 */
export function generatePortfolioReport(
  clients: readonly PortfolioClient[],
  months: readonly string[],
): PortfolioReport {
  const active = activeClients(clients);
  const revenueBreakdown = getRevenueBreakdown(clients);
  const growthMetrics = forecastGrowthRate(clients, months);
  const cohorts = analyzeCohort(clients);
  const paybacks = calculatePaybackPeriod(clients);

  // NRR for the most recent two months
  const nrr =
    months.length >= 2
      ? calculateNRR(
          clients,
          months[months.length - 2],
          months[months.length - 1],
        )
      : 0;

  // Gross churn over the last 3 months (or full range)
  const churnStart =
    months.length >= 3
      ? months[months.length - 3]
      : months[0] ?? toMonthKey(new Date());
  const churnEnd = months[months.length - 1] ?? toMonthKey(new Date());
  const grossChurn = calculateGrossChurn(
    clients,
    new Date(churnStart + "-01"),
    new Date(churnEnd + "-01"),
  );

  const totalMRR = revenueBreakdown.totalMRR;
  const arpa = active.length > 0 ? round2(totalMRR / active.length) : 0;

  const avgCAC = avg(clients.map((c) => c.acquisitionCost));

  // LTV estimate: ARPA / monthly churn rate (annualized)
  const monthlyChurn = grossChurn > 0 ? grossChurn : 0.01;
  const avgLTV = round2(arpa / monthlyChurn);
  const cacToLTV = avgCAC > 0 ? round2(avgLTV / avgCAC) : 0;

  const avgPayback = avg(
    paybacks
      .filter((p) => p.paybackMonths !== Infinity)
      .map((p) => p.paybackMonths),
  );

  const metrics: PortfolioMetrics = {
    totalClients: clients.length,
    activeClients: active.length,
    totalMRR,
    totalARR: round2(totalMRR * 12),
    averageRevenuePerAccount: arpa,
    averageLTV: avgLTV,
    averageCAC: round2(avgCAC),
    cacToLTVRatio: cacToLTV,
    netRevenueRetention: nrr,
    grossChurnRate: grossChurn,
    averagePaybackMonths: round2(avgPayback),
    computedAt: new Date().toISOString(),
  };

  // Health indicators
  const revenueHealth = classifyHealth(
    growthMetrics.mrrGrowthRate,
    0.05,
    0.0,
  );
  const retentionHealth = classifyHealth(nrr, 1.0, 0.9);
  const growthHealth = classifyHealth(
    growthMetrics.mrrGrowthRate,
    0.03,
    -0.01,
  );
  const unitEconomicsHealth = classifyHealth(cacToLTV, 3, 1);

  const indicators: PortfolioHealthIndicators = {
    revenueHealth,
    retentionHealth,
    growthHealth,
    unitEconomicsHealth,
    overall: deriveOverallHealth([
      revenueHealth,
      retentionHealth,
      growthHealth,
      unitEconomicsHealth,
    ]),
  };

  const recommendations = buildRecommendations(
    metrics,
    indicators,
    growthMetrics,
  );

  // Top 5 cohorts by initial size
  const topCohorts = [...cohorts]
    .sort((a, b) => b.initialCount - a.initialCount)
    .slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    revenueBreakdown,
    growthMetrics,
    topCohorts,
    healthIndicators: indicators,
    recommendations,
  };
}

/* ------------------------------------------------------------------ */
/*  Internal: Health Classification                                    */
/* ------------------------------------------------------------------ */

/**
 * Classify a metric value into a health indicator.
 * "strong" when >= strongThreshold, "weak" when < weakThreshold.
 */
function classifyHealth(
  value: number,
  strongThreshold: number,
  weakThreshold: number,
): HealthIndicator {
  if (value >= strongThreshold) return "strong";
  if (value >= weakThreshold) return "moderate";
  return "weak";
}

/** Derive overall health from individual indicators. */
function deriveOverallHealth(
  indicators: readonly HealthIndicator[],
): HealthIndicator {
  const scores: Record<HealthIndicator, number> = {
    strong: 2,
    moderate: 1,
    weak: 0,
  };
  const total = indicators.reduce(
    (sum, ind) => sum + scores[ind],
    0,
  );
  const average = total / indicators.length;

  if (average >= 1.5) return "strong";
  if (average >= 0.75) return "moderate";
  return "weak";
}

/** Build actionable recommendations based on portfolio state. */
function buildRecommendations(
  metrics: PortfolioMetrics,
  indicators: PortfolioHealthIndicators,
  growth: GrowthMetrics,
): readonly string[] {
  const recs: string[] = [];

  if (indicators.retentionHealth === "weak") {
    recs.push(
      "Retention is below target. Prioritize churn reduction " +
        "with proactive outreach to at-risk clients.",
    );
  }

  if (metrics.cacToLTVRatio < 3) {
    recs.push(
      `CAC:LTV ratio is ${metrics.cacToLTVRatio}x (target: 3x+). ` +
        "Reduce acquisition costs or increase per-client revenue.",
    );
  }

  if (metrics.grossChurnRate > 0.05) {
    recs.push(
      `Gross churn is ${round2(metrics.grossChurnRate * 100)}%. ` +
        "Implement a client success program to address root causes.",
    );
  }

  if (growth.trend === "decelerating") {
    recs.push(
      "MRR growth is decelerating. Evaluate pricing strategy " +
        "and invest in new client acquisition channels.",
    );
  }

  if (metrics.netRevenueRetention < 1.0 && metrics.netRevenueRetention > 0) {
    recs.push(
      "Net revenue retention is below 100%. Focus on expansion " +
        "revenue through upsells and cross-sells.",
    );
  }

  if (metrics.averagePaybackMonths > 12) {
    recs.push(
      `Average payback period is ${metrics.averagePaybackMonths} months. ` +
        "Optimize onboarding to accelerate time-to-value.",
    );
  }

  if (indicators.revenueHealth === "strong" && growth.trend === "accelerating") {
    recs.push(
      "Portfolio is in strong growth mode. Consider scaling " +
        "customer success capacity to maintain service quality.",
    );
  }

  if (recs.length === 0) {
    recs.push(
      "Portfolio health is on track. Continue monitoring key " +
        "metrics and maintain current growth trajectory.",
    );
  }

  return recs;
}
