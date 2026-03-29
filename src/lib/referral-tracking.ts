/**
 * Referral program tracking utility.
 *
 * Pure math/logic for referral code generation, reward calculation,
 * tier management, and program metrics. No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type ReferralStatus =
  | "pending"
  | "active"
  | "converted"
  | "expired"
  | "cancelled";

export type ReferralTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface Referral {
  readonly id: string;
  readonly referrerClientId: string;
  readonly refereeEmail: string;
  readonly referralCode: string;
  readonly status: ReferralStatus;
  readonly createdAt: Date;
  readonly convertedAt: Date | null;
  readonly revenueGenerated: number;
}

export interface ReferralReward {
  readonly referrerId: string;
  readonly tier: ReferralTier;
  readonly referralCount: number;
  readonly creditPerReferral: number;
  readonly totalCredit: number;
  readonly refereeDiscount: number;
  readonly refereeDiscountMonths: number;
}

export interface ReferralProgram {
  readonly referrerRewardAmount: number;
  readonly refereeDiscountPercent: number;
  readonly refereeDiscountMonths: number;
  readonly minimumSubscriptionMonths: number;
  readonly maximumReferrals: number | null;
  readonly tiers: readonly TierDefinition[];
}

export interface TierDefinition {
  readonly name: ReferralTier;
  readonly minReferrals: number;
  readonly maxReferrals: number | null;
}

export interface ReferralMetrics {
  readonly totalReferrals: number;
  readonly convertedReferrals: number;
  readonly pendingReferrals: number;
  readonly conversionRate: number;
  readonly totalRewardsPaid: number;
  readonly totalRevenueFromReferrals: number;
  readonly roi: number;
  readonly averageRevenuePerReferral: number;
  readonly topTier: ReferralTier;
  readonly activeTiers: ReadonlyMap<ReferralTier, number>;
}

export interface ReferrerLeaderboardEntry {
  readonly clientId: string;
  readonly referralCount: number;
  readonly convertedCount: number;
  readonly totalRevenueGenerated: number;
  readonly tier: ReferralTier;
  readonly rank: number;
}

export interface ReferralROI {
  readonly totalCost: number;
  readonly totalRevenue: number;
  readonly netRevenue: number;
  readonly roi: number;
  readonly costPerAcquisition: number;
}

export interface ReferralEligibility {
  readonly eligible: boolean;
  readonly reason: string;
  readonly subscriptionMonths: number;
  readonly minimumRequired: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const REFERRAL_PROGRAM: ReferralProgram = {
  referrerRewardAmount: 500,
  refereeDiscountPercent: 10,
  refereeDiscountMonths: 3,
  minimumSubscriptionMonths: 3,
  maximumReferrals: null,
  tiers: [
    { name: "Bronze", minReferrals: 1, maxReferrals: 2 },
    { name: "Silver", minReferrals: 3, maxReferrals: 5 },
    { name: "Gold", minReferrals: 6, maxReferrals: 10 },
    { name: "Platinum", minReferrals: 11, maxReferrals: null },
  ],
} as const;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Simple deterministic hash for generating referral code segments.
 * Produces a base-36 string from the input.
 */
function hashSegment(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash * 31 + char) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

/**
 * Count referrals matching a given status.
 */
function countByStatus(
  referrals: readonly Referral[],
  status: ReferralStatus,
): number {
  return referrals.filter((r) => r.status === status).length;
}

/**
 * Sum revenue across a collection of referrals.
 */
function sumRevenue(referrals: readonly Referral[]): number {
  return referrals.reduce((sum, r) => sum + r.revenueGenerated, 0);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Generate a unique referral code from a client name and ID.
 *
 * Format: REF-{nameSegment}-{idSegment}-{timestamp}
 * The code is deterministic for the same inputs when timestamp is
 * excluded, but includes a time component for uniqueness.
 */
export function generateReferralCode(
  clientName: string,
  clientId: string,
): string {
  const sanitizedName = clientName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const nameSegment = sanitizedName.slice(0, 4).padEnd(4, "X");
  const idSegment = hashSegment(clientId);
  const timeSegment = Date.now().toString(36).toUpperCase().slice(-4);

  return `REF-${nameSegment}-${idSegment}-${timeSegment}`;
}

/**
 * Determine the current referral tier based on the number of
 * converted referrals.
 *
 * Returns "Bronze" if the count is at least 1, otherwise falls
 * back to the lowest tier definition.
 */
export function getReferralTier(
  convertedCount: number,
  program: ReferralProgram = REFERRAL_PROGRAM,
): ReferralTier {
  const sorted = [...program.tiers].sort(
    (a, b) => b.minReferrals - a.minReferrals,
  );

  for (const tier of sorted) {
    if (convertedCount >= tier.minReferrals) {
      return tier.name;
    }
  }

  return program.tiers[0].name;
}

/**
 * Compute the referral reward for a given referrer based on their
 * converted referral count and the program configuration.
 */
export function calculateReferralReward(
  referrerId: string,
  convertedCount: number,
  program: ReferralProgram = REFERRAL_PROGRAM,
): ReferralReward {
  const tier = getReferralTier(convertedCount, program);
  const totalCredit = convertedCount * program.referrerRewardAmount;

  return {
    referrerId,
    tier,
    referralCount: convertedCount,
    creditPerReferral: program.referrerRewardAmount,
    totalCredit,
    refereeDiscount: program.refereeDiscountPercent,
    refereeDiscountMonths: program.refereeDiscountMonths,
  };
}

/**
 * Calculate ROI of the referral program by comparing the total cost
 * (rewards paid out) against the revenue generated by referred clients.
 */
export function calculateReferralROI(
  referrals: readonly Referral[],
  program: ReferralProgram = REFERRAL_PROGRAM,
): ReferralROI {
  const converted = referrals.filter((r) => r.status === "converted");
  const totalRevenue = sumRevenue(converted);
  const totalCost = converted.length * program.referrerRewardAmount;
  const netRevenue = totalRevenue - totalCost;
  const roi = totalCost > 0 ? (netRevenue / totalCost) * 100 : 0;
  const costPerAcquisition =
    converted.length > 0 ? totalCost / converted.length : 0;

  return {
    totalCost,
    totalRevenue,
    netRevenue,
    roi,
    costPerAcquisition,
  };
}

/**
 * Rank referrers by converted referral count and total revenue generated.
 * Returns a sorted leaderboard with rank assignments.
 */
export function getReferralLeaderboard(
  referrals: readonly Referral[],
  program: ReferralProgram = REFERRAL_PROGRAM,
): readonly ReferrerLeaderboardEntry[] {
  const referrerMap = new Map<
    string,
    { total: number; converted: number; revenue: number }
  >();

  for (const referral of referrals) {
    const existing = referrerMap.get(referral.referrerClientId) ?? {
      total: 0,
      converted: 0,
      revenue: 0,
    };

    const isConverted = referral.status === "converted";

    referrerMap.set(referral.referrerClientId, {
      total: existing.total + 1,
      converted: existing.converted + (isConverted ? 1 : 0),
      revenue: existing.revenue + referral.revenueGenerated,
    });
  }

  const entries = Array.from(referrerMap.entries())
    .map(([clientId, data]) => ({
      clientId,
      referralCount: data.total,
      convertedCount: data.converted,
      totalRevenueGenerated: data.revenue,
      tier: getReferralTier(data.converted, program),
    }))
    .sort((a, b) => {
      if (b.convertedCount !== a.convertedCount) {
        return b.convertedCount - a.convertedCount;
      }
      return b.totalRevenueGenerated - a.totalRevenueGenerated;
    });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

/**
 * Check whether a client meets the minimum requirements to participate
 * in the referral program.
 */
export function isEligibleToRefer(
  subscriptionMonths: number,
  program: ReferralProgram = REFERRAL_PROGRAM,
): ReferralEligibility {
  const eligible = subscriptionMonths >= program.minimumSubscriptionMonths;

  const reason = eligible
    ? "Client meets minimum subscription requirement."
    : `Client must be subscribed for at least ${program.minimumSubscriptionMonths} months. ` +
      `Current: ${subscriptionMonths} month${subscriptionMonths === 1 ? "" : "s"}.`;

  return {
    eligible,
    reason,
    subscriptionMonths,
    minimumRequired: program.minimumSubscriptionMonths,
  };
}

/**
 * Calculate overall program health metrics from the full set of referrals.
 */
export function calculateProgramMetrics(
  referrals: readonly Referral[],
  program: ReferralProgram = REFERRAL_PROGRAM,
): ReferralMetrics {
  const totalReferrals = referrals.length;
  const convertedReferrals = countByStatus(referrals, "converted");
  const pendingReferrals = countByStatus(referrals, "pending");
  const conversionRate =
    totalReferrals > 0 ? convertedReferrals / totalReferrals : 0;

  const totalRewardsPaid = convertedReferrals * program.referrerRewardAmount;
  const totalRevenueFromReferrals = sumRevenue(referrals);
  const roi =
    totalRewardsPaid > 0
      ? ((totalRevenueFromReferrals - totalRewardsPaid) / totalRewardsPaid) *
        100
      : 0;
  const averageRevenuePerReferral =
    convertedReferrals > 0
      ? totalRevenueFromReferrals / convertedReferrals
      : 0;

  const topTier = getReferralTier(convertedReferrals, program);

  const activeTiers = new Map<ReferralTier, number>();
  const leaderboard = getReferralLeaderboard(referrals, program);
  for (const entry of leaderboard) {
    const current = activeTiers.get(entry.tier) ?? 0;
    activeTiers.set(entry.tier, current + 1);
  }

  return {
    totalReferrals,
    convertedReferrals,
    pendingReferrals,
    conversionRate,
    totalRewardsPaid,
    totalRevenueFromReferrals,
    roi,
    averageRevenuePerReferral,
    topTier,
    activeTiers,
  };
}
