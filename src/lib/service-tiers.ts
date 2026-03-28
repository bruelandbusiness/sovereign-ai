/**
 * Service Tier Definitions — maps SERVICES.md into code.
 *
 * Defines what each tier includes, contracted lead volumes,
 * quality benchmarks, SLA thresholds, and guarantee enforcement.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TierId = "starter" | "growth" | "scale" | "enterprise";

export interface TierChannels {
  email: boolean;
  sms: boolean;
  voice: boolean;
}

export interface TierSLA {
  supportResponseHours: number;
  dashboardUptimePercent: number;
  reportDay: string; // "monday" | "5th" etc.
}

export interface TierDefinition {
  id: TierId;
  name: string;
  monthlyPrice: number; // cents
  setupFee: number; // cents
  contractedLeads: number; // per month
  discoverySources: number;
  followUpSteps: number;
  channels: TierChannels;
  minLeadScore: number;
  targetAvgScore: number;
  overagePerLead: number; // cents
  abTesting: boolean;
  roiAttribution: boolean;
  reputationManagement: boolean;
  voiceReceptionist: boolean;
  gbpOptimization: boolean;
  calendarIntegration: boolean;
  crmIntegration: boolean;
  sla: TierSLA;
  strategyCallMinutes: number;
  strategyCallFrequency: "monthly" | "biweekly" | "weekly";
}

export interface QualityBenchmark {
  metric: string;
  good: string;
  goodThreshold: number;
  acceptable: string;
  acceptableThreshold: number;
  poor: string;
  unit: string;
}

export interface GuaranteeCheck {
  clientId: string;
  tierId: TierId;
  month: string; // YYYY-MM
  contractedLeads: number;
  deliveredLeads: number;
  deliveryPercent: number;
  status: "met" | "credit" | "full_credit" | "exit_eligible";
  creditAmount: number; // cents
}

// ---------------------------------------------------------------------------
// Tier Definitions
// ---------------------------------------------------------------------------

export const TIER_DEFINITIONS: Record<TierId, TierDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 150_000, // $1,500
    setupFee: 250_000, // $2,500
    contractedLeads: 50,
    discoverySources: 3,
    followUpSteps: 4,
    channels: { email: true, sms: false, voice: false },
    minLeadScore: 50,
    targetAvgScore: 65,
    overagePerLead: 2_500, // $25
    abTesting: false,
    roiAttribution: false,
    reputationManagement: false,
    voiceReceptionist: false,
    gbpOptimization: false,
    calendarIntegration: false,
    crmIntegration: false,
    sla: {
      supportResponseHours: 24,
      dashboardUptimePercent: 99.5,
      reportDay: "monday",
    },
    strategyCallMinutes: 15,
    strategyCallFrequency: "monthly",
  },

  growth: {
    id: "growth",
    name: "Growth",
    monthlyPrice: 350_000, // $3,500
    setupFee: 500_000, // $5,000
    contractedLeads: 150,
    discoverySources: 5,
    followUpSteps: 6,
    channels: { email: true, sms: true, voice: false },
    minLeadScore: 50,
    targetAvgScore: 70,
    overagePerLead: 2_000, // $20
    abTesting: true,
    roiAttribution: true,
    reputationManagement: true,
    voiceReceptionist: false,
    gbpOptimization: false,
    calendarIntegration: false,
    crmIntegration: false,
    sla: {
      supportResponseHours: 4,
      dashboardUptimePercent: 99.5,
      reportDay: "5th",
    },
    strategyCallMinutes: 30,
    strategyCallFrequency: "biweekly",
  },

  scale: {
    id: "scale",
    name: "Scale",
    monthlyPrice: 600_000, // $6,000
    setupFee: 750_000, // $7,500
    contractedLeads: 300,
    discoverySources: 99, // all available
    followUpSteps: 7,
    channels: { email: true, sms: true, voice: true },
    minLeadScore: 50,
    targetAvgScore: 72,
    overagePerLead: 1_500, // $15
    abTesting: true,
    roiAttribution: true,
    reputationManagement: true,
    voiceReceptionist: true,
    gbpOptimization: true,
    calendarIntegration: true,
    crmIntegration: false,
    sla: {
      supportResponseHours: 1,
      dashboardUptimePercent: 99.5,
      reportDay: "5th",
    },
    strategyCallMinutes: 30,
    strategyCallFrequency: "weekly",
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 800_000, // $8,000 minimum
    setupFee: 0, // custom
    contractedLeads: 0, // custom, set per contract
    discoverySources: 99,
    followUpSteps: 7,
    channels: { email: true, sms: true, voice: true },
    minLeadScore: 50,
    targetAvgScore: 72,
    overagePerLead: 0, // custom
    abTesting: true,
    roiAttribution: true,
    reputationManagement: true,
    voiceReceptionist: true,
    gbpOptimization: true,
    calendarIntegration: true,
    crmIntegration: true,
    sla: {
      supportResponseHours: 0.5, // 30 minutes
      dashboardUptimePercent: 99.9,
      reportDay: "5th",
    },
    strategyCallMinutes: 60,
    strategyCallFrequency: "weekly",
  },
};

// ---------------------------------------------------------------------------
// Quality Benchmarks (from SERVICES.md)
// ---------------------------------------------------------------------------

export const QUALITY_BENCHMARKS: QualityBenchmark[] = [
  {
    metric: "lead_delivery",
    good: "100%+ of contracted volume",
    goodThreshold: 100,
    acceptable: "80-99% of contracted volume",
    acceptableThreshold: 80,
    poor: "Below 80%",
    unit: "percent",
  },
  {
    metric: "lead_quality_score",
    good: "Average score 75+",
    goodThreshold: 75,
    acceptable: "Average score 65-74",
    acceptableThreshold: 65,
    poor: "Average score below 65",
    unit: "score",
  },
  {
    metric: "response_rate",
    good: "10%+ of contacted leads respond",
    goodThreshold: 10,
    acceptable: "6-10% response rate",
    acceptableThreshold: 6,
    poor: "Below 6%",
    unit: "percent",
  },
  {
    metric: "appointment_rate",
    good: "20%+ of responses become appointments",
    goodThreshold: 20,
    acceptable: "10-20% appointment rate",
    acceptableThreshold: 10,
    poor: "Below 10%",
    unit: "percent",
  },
  {
    metric: "client_roi",
    good: "5x+ ROI",
    goodThreshold: 5,
    acceptable: "3-5x ROI",
    acceptableThreshold: 3,
    poor: "Below 3x",
    unit: "multiple",
  },
  {
    metric: "email_deliverability",
    good: "97%+ inbox placement",
    goodThreshold: 97,
    acceptable: "95-97%",
    acceptableThreshold: 95,
    poor: "Below 95%",
    unit: "percent",
  },
  {
    metric: "sms_delivery",
    good: "99%+ delivery rate",
    goodThreshold: 99,
    acceptable: "97-99%",
    acceptableThreshold: 97,
    poor: "Below 97%",
    unit: "percent",
  },
  {
    metric: "review_velocity",
    good: "8+ new reviews per month",
    goodThreshold: 8,
    acceptable: "4-7 new reviews per month",
    acceptableThreshold: 4,
    poor: "Below 4",
    unit: "count",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a tier definition by ID. */
export function getTier(id: TierId): TierDefinition {
  return TIER_DEFINITIONS[id];
}

/** Map a bundleId from the Subscription model to a TierId. */
export function bundleToTier(bundleId: string | null): TierId | null {
  const map: Record<string, TierId> = {
    starter: "starter",
    growth: "growth",
    scale: "scale",
    empire: "enterprise",
  };
  return bundleId ? map[bundleId] ?? null : null;
}

/** Classify a metric value against benchmarks. */
export function classifyMetric(
  metric: string,
  value: number,
): "good" | "acceptable" | "poor" | "unknown" {
  const benchmark = QUALITY_BENCHMARKS.find((b) => b.metric === metric);
  if (!benchmark) return "unknown";
  if (value >= benchmark.goodThreshold) return "good";
  if (value >= benchmark.acceptableThreshold) return "acceptable";
  return "poor";
}

// ---------------------------------------------------------------------------
// Guarantee Enforcement
// ---------------------------------------------------------------------------

/**
 * Check whether a client's lead delivery meets their guarantee for a given month.
 *
 * Returns the guarantee status and any credit due.
 */
export function checkGuarantee(
  clientId: string,
  tierId: TierId,
  month: string,
  deliveredLeads: number,
  customTarget?: number,
): GuaranteeCheck {
  const tier = getTier(tierId);
  const contractedLeads = customTarget ?? tier.contractedLeads;

  if (contractedLeads === 0) {
    // Enterprise with no defined target — always met
    return {
      clientId,
      tierId,
      month,
      contractedLeads: 0,
      deliveredLeads,
      deliveryPercent: 100,
      status: "met",
      creditAmount: 0,
    };
  }

  const deliveryPercent = Math.round((deliveredLeads / contractedLeads) * 100);

  if (deliveryPercent >= 80) {
    return {
      clientId,
      tierId,
      month,
      contractedLeads,
      deliveredLeads,
      deliveryPercent,
      status: "met",
      creditAmount: 0,
    };
  }

  if (deliveryPercent >= 50) {
    // Pro-rated credit for shortfall
    const shortfall = contractedLeads - deliveredLeads;
    const creditPerLead = Math.round(tier.monthlyPrice / contractedLeads);
    const creditAmount = shortfall * creditPerLead;

    return {
      clientId,
      tierId,
      month,
      contractedLeads,
      deliveredLeads,
      deliveryPercent,
      status: "credit",
      creditAmount,
    };
  }

  // Below 50% — full month credit + exit option
  return {
    clientId,
    tierId,
    month,
    contractedLeads,
    deliveredLeads,
    deliveryPercent,
    status: "full_credit",
    creditAmount: tier.monthlyPrice,
  };
}

/**
 * Determine allowed channels for a client based on their tier.
 */
export function getAllowedChannels(tierId: TierId): string[] {
  const tier = getTier(tierId);
  const channels: string[] = [];
  if (tier.channels.email) channels.push("email");
  if (tier.channels.sms) channels.push("sms");
  if (tier.channels.voice) channels.push("voice");
  return channels;
}

/**
 * Check if a specific feature is available on a tier.
 */
export function hasFeature(
  tierId: TierId,
  feature: keyof Pick<
    TierDefinition,
    | "abTesting"
    | "roiAttribution"
    | "reputationManagement"
    | "voiceReceptionist"
    | "gbpOptimization"
    | "calendarIntegration"
    | "crmIntegration"
  >,
): boolean {
  return getTier(tierId)[feature];
}

/**
 * Calculate overage charges for leads above the contracted amount.
 */
export function calculateOverage(
  tierId: TierId,
  deliveredLeads: number,
  customTarget?: number,
): { overageLeads: number; overageAmount: number } {
  const tier = getTier(tierId);
  const target = customTarget ?? tier.contractedLeads;

  if (target === 0 || deliveredLeads <= target) {
    return { overageLeads: 0, overageAmount: 0 };
  }

  const overageLeads = deliveredLeads - target;
  return {
    overageLeads,
    overageAmount: overageLeads * tier.overagePerLead,
  };
}

/**
 * Format a guarantee check result for display (dashboard, Telegram, reports).
 */
export function formatGuaranteeStatus(check: GuaranteeCheck): string {
  const tierName = getTier(check.tierId).name;

  switch (check.status) {
    case "met":
      return `${tierName} — ${check.deliveredLeads}/${check.contractedLeads} leads (${check.deliveryPercent}%) ✓`;
    case "credit":
      return `${tierName} — ${check.deliveredLeads}/${check.contractedLeads} leads (${check.deliveryPercent}%) — $${(check.creditAmount / 100).toFixed(0)} credit due`;
    case "full_credit":
      return `${tierName} — ${check.deliveredLeads}/${check.contractedLeads} leads (${check.deliveryPercent}%) — FULL MONTH CREDIT — client exit-eligible`;
    default:
      return `${tierName} — ${check.deliveryPercent}% delivery`;
  }
}
