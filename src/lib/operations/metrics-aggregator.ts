/**
 * Metrics Aggregator
 *
 * Pure calculation functions for Sovereign Empire operational metrics.
 * No side effects, no DB access — these transform raw inputs into
 * the numbers needed by digest formatters.
 */

// ---------------------------------------------------------------------------
// Input interface — raw counts that would come from DB queries
// ---------------------------------------------------------------------------

export interface MetricInput {
  activeClients: number;
  totalMrr: number;
  previousWeekMrr?: number;
  previousMonthMrr?: number;
  leadsDiscoveredToday: number;
  outreachSentToday: number;
  repliesReceivedToday: number;
  appointmentsBookedToday: number;
  paymentsToday: { count: number; total: number };
  apiCosts: { today: number; thisWeek: number; thisMonth: number };
  errorCount: number;
  pendingApprovalCount: number;
}

// ---------------------------------------------------------------------------
// Health thresholds
// ---------------------------------------------------------------------------

/** Green >= 70, Yellow 40-69, Red < 40 */
const HEALTH_GREEN_THRESHOLD = 70;
const HEALTH_YELLOW_THRESHOLD = 40;

// ---------------------------------------------------------------------------
// Calculation functions
// ---------------------------------------------------------------------------

/**
 * Calculate MRR growth rate as a percentage.
 *
 * @param current  - Current MRR value
 * @param previous - Previous period MRR value
 * @returns Growth rate as a percentage (e.g. 12.5 for 12.5%). Returns 0 when
 *          previous is zero to avoid division-by-zero.
 */
export function calculateMrrGrowthRate(
  current: number,
  previous: number,
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate Net Revenue Retention (NRR).
 *
 * NRR = (startMrr + expansionMrr - churnedMrr) / startMrr * 100
 *
 * @param startMrr     - MRR at the start of the period
 * @param _endMrr      - MRR at end of period (informational; not used in formula)
 * @param expansionMrr - Revenue gained from upsells / expansion
 * @param churnedMrr   - Revenue lost to churn or contraction
 * @returns NRR as a percentage (e.g. 110 means 110% retention)
 */
export function calculateNetRevenueRetention(
  startMrr: number,
  _endMrr: number,
  expansionMrr: number,
  churnedMrr: number,
): number {
  if (startMrr === 0) return 0;
  return ((startMrr + expansionMrr - churnedMrr) / startMrr) * 100;
}

/**
 * Calculate gross margin percentage.
 *
 * @param revenue - Total revenue for the period
 * @param costs   - Total costs for the period
 * @returns Gross margin as a percentage (e.g. 75.0 for 75%)
 */
export function calculateGrossMargin(
  revenue: number,
  costs: number,
): number {
  if (revenue === 0) return 0;
  return ((revenue - costs) / revenue) * 100;
}

/**
 * Calculate average cost per client.
 *
 * @param totalCosts  - Total operational costs
 * @param clientCount - Number of active clients
 * @returns Cost per client in dollars. Returns 0 when clientCount is zero.
 */
export function calculateCostPerClient(
  totalCosts: number,
  clientCount: number,
): number {
  if (clientCount === 0) return 0;
  return totalCosts / clientCount;
}

/**
 * Project annual revenue from current MRR.
 *
 * @param mrr - Current monthly recurring revenue
 * @returns Projected annual revenue (MRR * 12)
 */
export function calculateProjectedAnnualRevenue(mrr: number): number {
  return mrr * 12;
}

/**
 * Calculate cost per acquisition (CPA).
 *
 * @param totalSpend     - Total acquisition spend for the period
 * @param clientsAcquired - Number of clients acquired
 * @returns CPA in dollars. Returns 0 when clientsAcquired is zero.
 */
export function calculateCostPerAcquisition(
  totalSpend: number,
  clientsAcquired: number,
): number {
  if (clientsAcquired === 0) return 0;
  return totalSpend / clientsAcquired;
}

/**
 * Calculate lead delivery rate as a percentage of target.
 *
 * @param delivered - Number of leads delivered
 * @param target    - Contracted lead target
 * @returns Delivery percentage (e.g. 95.0 for 95%). Returns 0 when target is zero.
 */
export function calculateLeadDeliveryRate(
  delivered: number,
  target: number,
): number {
  if (target === 0) return 0;
  return (delivered / target) * 100;
}

// ---------------------------------------------------------------------------
// Threshold checks
// ---------------------------------------------------------------------------

/**
 * Check whether API spend is on track relative to the monthly budget.
 *
 * Uses a linear budget model: expected daily spend = monthlyBudget / 30.
 * Compares actual daily spend against that expectation.
 *
 * @param dailySpend    - Today's API spend in dollars
 * @param monthlyBudget - Total monthly API budget in dollars
 * @param dayOfMonth    - Current day of the month (1-31)
 * @returns Object with on-track boolean, projected monthly total, and percent
 *          of budget consumed so far.
 */
export function isApiSpendOnTrack(
  dailySpend: number,
  monthlyBudget: number,
  dayOfMonth: number,
): { onTrack: boolean; projectedMonthly: number; percentOfBudget: number } {
  const daysInMonth = 30; // simplified model
  const projectedMonthly = dailySpend * daysInMonth;
  const expectedSpentSoFar = (monthlyBudget / daysInMonth) * dayOfMonth;
  const actualSpentSoFar = dailySpend * dayOfMonth; // rough proxy
  const percentOfBudget =
    monthlyBudget === 0 ? 0 : (actualSpentSoFar / monthlyBudget) * 100;

  return {
    onTrack: actualSpentSoFar <= expectedSpentSoFar * 1.1, // 10% grace
    projectedMonthly: Math.round(projectedMonthly * 100) / 100,
    percentOfBudget: Math.round(percentOfBudget * 100) / 100,
  };
}

/**
 * Bucket an array of health scores into green / yellow / red counts.
 *
 * Thresholds:
 *   - Green:  score >= 70
 *   - Yellow: 40 <= score < 70
 *   - Red:    score < 40
 *
 * @param scores - Array of client health scores (0-100)
 * @returns Counts per bucket
 */
export function getHealthSummary(
  scores: number[],
): { green: number; yellow: number; red: number } {
  let green = 0;
  let yellow = 0;
  let red = 0;

  for (const score of scores) {
    if (score >= HEALTH_GREEN_THRESHOLD) {
      green++;
    } else if (score >= HEALTH_YELLOW_THRESHOLD) {
      yellow++;
    } else {
      red++;
    }
  }

  return { green, yellow, red };
}
