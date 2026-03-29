import { prisma } from "@/lib/db";

/* ─── Types ─────────────────────────────────────────────────── */

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerAccount: number;
  lifetimeValue: number;
  revenueGrowthRate: number;
}

export interface RevenueBreakdown {
  byPlan: Record<string, { count: number; revenue: number }>;
  byInterval: { monthly: number; annual: number };
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
}

interface SubscriptionRecord {
  monthlyAmount: number;
  status: string;
  bundleId: string | null;
  createdAt: Date;
}

/* ─── Core Calculations ─────────────────────────────────────── */

/**
 * Sum of all active monthly-normalized subscription amounts.
 * Amounts are stored in cents; result is also in cents.
 */
export function calculateMRR(
  subscriptions: ReadonlyArray<Pick<SubscriptionRecord, "monthlyAmount" | "status">>,
): number {
  return subscriptions
    .filter((s) => s.status === "active" || s.status === "past_due")
    .reduce((sum, s) => sum + s.monthlyAmount, 0);
}

/**
 * Standard churn-rate formula:
 *   churnRate = canceledCount / startCount
 *
 * Returns a decimal (e.g. 0.05 for 5 %). Returns 0 when startCount is 0.
 */
export function calculateChurnRate(
  startCount: number,
  _endCount: number,
  canceledCount: number,
): number {
  if (startCount <= 0) return 0;
  return canceledCount / startCount;
}

/**
 * Customer Lifetime Value estimate: ARPA / churnRate.
 * Returns 0 when churnRate is 0 (infinite LTV is not useful).
 */
export function calculateLTV(arpa: number, churnRate: number): number {
  if (churnRate <= 0) return 0;
  return arpa / churnRate;
}

/* ─── Full Metrics via Prisma ───────────────────────────────── */

/**
 * Build a complete RevenueMetrics snapshot.
 * When `clientId` is provided the calculation is scoped to that client.
 */
export async function calculateRevenueMetrics(
  clientId?: string,
): Promise<RevenueMetrics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const whereClient = clientId ? { clientId } : {};

  const [activeSubs, canceledLast30, previousPeriodSubs] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        ...whereClient,
        status: { in: ["active", "past_due"] },
      },
      select: {
        monthlyAmount: true,
        status: true,
        bundleId: true,
        createdAt: true,
      },
    }),

    prisma.subscription.count({
      where: {
        ...whereClient,
        status: "canceled",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),

    prisma.subscription.findMany({
      where: {
        ...whereClient,
        createdAt: { lte: thirtyDaysAgo },
        OR: [
          { status: { in: ["active", "past_due"] } },
          {
            status: "canceled",
            updatedAt: { gte: thirtyDaysAgo },
          },
        ],
      },
      select: { monthlyAmount: true, status: true },
    }),
  ]);

  const mrr = calculateMRR(activeSubs);
  const arr = mrr * 12;
  const activeCount = activeSubs.length;

  const startCount = previousPeriodSubs.length + canceledLast30;
  const churnRate = calculateChurnRate(startCount, activeCount, canceledLast30);

  const arpa = activeCount > 0 ? mrr / activeCount : 0;
  const lifetimeValue = calculateLTV(arpa, churnRate);

  const previousMrr = previousPeriodSubs
    .filter((s) => s.status === "active" || s.status === "past_due")
    .reduce((sum, s) => sum + s.monthlyAmount, 0);

  const revenueGrowthRate =
    previousMrr > 0 ? (mrr - previousMrr) / previousMrr : 0;

  return {
    mrr,
    arr,
    activeSubscriptions: activeCount,
    churnRate,
    averageRevenuePerAccount: arpa,
    lifetimeValue,
    revenueGrowthRate,
  };
}

/**
 * Break revenue down by plan, interval, and MRR movement categories.
 * When `clientId` is provided the breakdown is scoped to that client.
 */
export async function calculateRevenueBreakdown(
  clientId?: string,
): Promise<RevenueBreakdown> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const whereClient = clientId ? { clientId } : {};

  const [activeSubs, newSubs, canceledSubs] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        ...whereClient,
        status: { in: ["active", "past_due"] },
      },
      select: {
        monthlyAmount: true,
        bundleId: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    }),

    prisma.subscription.findMany({
      where: {
        ...whereClient,
        status: { in: ["active", "past_due"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { monthlyAmount: true },
    }),

    prisma.subscription.findMany({
      where: {
        ...whereClient,
        status: "canceled",
        updatedAt: { gte: thirtyDaysAgo },
      },
      select: { monthlyAmount: true },
    }),
  ]);

  const byPlan: Record<string, { count: number; revenue: number }> = {};
  let monthlyRevenue = 0;
  let annualRevenue = 0;

  for (const sub of activeSubs) {
    const plan = sub.bundleId ?? "a_la_carte";

    if (!byPlan[plan]) {
      byPlan[plan] = { count: 0, revenue: 0 };
    }
    byPlan[plan].count += 1;
    byPlan[plan].revenue += sub.monthlyAmount;

    const isAnnual =
      sub.currentPeriodEnd !== null &&
      sub.currentPeriodEnd.getTime() - now.getTime() > 45 * 24 * 60 * 60 * 1000;

    if (isAnnual) {
      annualRevenue += sub.monthlyAmount;
    } else {
      monthlyRevenue += sub.monthlyAmount;
    }
  }

  const newMrr = newSubs.reduce((s, sub) => s + sub.monthlyAmount, 0);
  const churnedMrr = canceledSubs.reduce((s, sub) => s + sub.monthlyAmount, 0);

  return {
    byPlan,
    byInterval: { monthly: monthlyRevenue, annual: annualRevenue },
    newMrr,
    expansionMrr: 0,
    contractionMrr: 0,
    churnedMrr,
  };
}
