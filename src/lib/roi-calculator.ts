// ---------------------------------------------------------------------------
// ROI Calculator Utility
// ---------------------------------------------------------------------------
// Helps prospective and current clients understand the return on investment
// from Sovereign AI's home-service marketing platform.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoiInputs {
  /** Monthly subscription cost (what they pay us) */
  monthlySubscriptionCost: number;
  /** Number of new leads generated per month */
  leadsPerMonth: number;
  /** Lead-to-customer conversion rate (e.g., 0.15 = 15%) */
  leadToCustomerRate: number;
  /** Average revenue per completed job */
  averageJobValue: number;
  /** Average profit per completed job */
  averageJobProfit: number;
  /** New reviews gained per month via automated follow-ups */
  reviewsGainedPerMonth: number;
  /** Estimated lifetime revenue generated per 5-star review */
  estimatedRevenuePerReview: number;
  /** Hours of manual work automated per week (follow-ups, scheduling, etc.) */
  hoursAutomatedPerWeek: number;
  /** Hourly cost of the labor being automated */
  hourlyLaborCost: number;
}

export interface RoiResults {
  /** Monthly revenue attributable to new customers from leads */
  monthlyRevenue: number;
  /** Monthly profit from those new customers */
  monthlyProfit: number;
  /** Monthly dollar value of time saved through automation */
  monthlyLaborSavings: number;
  /** Monthly dollar value of new reviews gained */
  monthlyReviewValue: number;
  /** Sum of profit + labor savings + review value */
  totalMonthlyValue: number;
  /** Monthly ROI percentage: (totalValue - cost) / cost * 100 */
  monthlyRoi: number;
  /** Annualized ROI percentage */
  annualRoi: number;
  /** Days until total accumulated value exceeds total cost */
  paybackDays: number;
  /** Subscription cost divided by leads per month */
  costPerLead: number;
  /** Subscription cost divided by new customers per month */
  costPerCustomer: number;
}

export interface IndustryBenchmarks {
  vertical: string;
  averageJobValue: number;
  averageJobProfit: number;
  leadToCustomerRate: number;
  leadsPerMonth: number;
  reviewsGainedPerMonth: number;
  estimatedRevenuePerReview: number;
  hoursAutomatedPerWeek: number;
  hourlyLaborCost: number;
}

// ---------------------------------------------------------------------------
// Default inputs (representative home-service business)
// ---------------------------------------------------------------------------

export const DEFAULT_ROI_INPUTS: RoiInputs = {
  monthlySubscriptionCost: 497,
  leadsPerMonth: 40,
  leadToCustomerRate: 0.15,
  averageJobValue: 1200,
  averageJobProfit: 480,
  reviewsGainedPerMonth: 6,
  estimatedRevenuePerReview: 500,
  hoursAutomatedPerWeek: 8,
  hourlyLaborCost: 25,
};

// ---------------------------------------------------------------------------
// Industry benchmarks
// ---------------------------------------------------------------------------

const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmarks> = {
  hvac: {
    vertical: "HVAC",
    averageJobValue: 1800,
    averageJobProfit: 720,
    leadToCustomerRate: 0.18,
    leadsPerMonth: 45,
    reviewsGainedPerMonth: 7,
    estimatedRevenuePerReview: 600,
    hoursAutomatedPerWeek: 10,
    hourlyLaborCost: 28,
  },
  plumbing: {
    vertical: "Plumbing",
    averageJobValue: 950,
    averageJobProfit: 380,
    leadToCustomerRate: 0.2,
    leadsPerMonth: 50,
    reviewsGainedPerMonth: 8,
    estimatedRevenuePerReview: 450,
    hoursAutomatedPerWeek: 7,
    hourlyLaborCost: 25,
  },
  roofing: {
    vertical: "Roofing",
    averageJobValue: 8500,
    averageJobProfit: 2550,
    leadToCustomerRate: 0.1,
    leadsPerMonth: 25,
    reviewsGainedPerMonth: 4,
    estimatedRevenuePerReview: 800,
    hoursAutomatedPerWeek: 6,
    hourlyLaborCost: 30,
  },
  electrical: {
    vertical: "Electrical",
    averageJobValue: 1100,
    averageJobProfit: 440,
    leadToCustomerRate: 0.17,
    leadsPerMonth: 35,
    reviewsGainedPerMonth: 5,
    estimatedRevenuePerReview: 500,
    hoursAutomatedPerWeek: 7,
    hourlyLaborCost: 30,
  },
  landscaping: {
    vertical: "Landscaping",
    averageJobValue: 750,
    averageJobProfit: 300,
    leadToCustomerRate: 0.22,
    leadsPerMonth: 55,
    reviewsGainedPerMonth: 6,
    estimatedRevenuePerReview: 350,
    hoursAutomatedPerWeek: 9,
    hourlyLaborCost: 22,
  },
  painting: {
    vertical: "Painting",
    averageJobValue: 3200,
    averageJobProfit: 1280,
    leadToCustomerRate: 0.14,
    leadsPerMonth: 30,
    reviewsGainedPerMonth: 5,
    estimatedRevenuePerReview: 550,
    hoursAutomatedPerWeek: 6,
    hourlyLaborCost: 24,
  },
  "pest-control": {
    vertical: "Pest Control",
    averageJobValue: 350,
    averageJobProfit: 175,
    leadToCustomerRate: 0.25,
    leadsPerMonth: 60,
    reviewsGainedPerMonth: 10,
    estimatedRevenuePerReview: 300,
    hoursAutomatedPerWeek: 8,
    hourlyLaborCost: 20,
  },
  "garage-door": {
    vertical: "Garage Door",
    averageJobValue: 1400,
    averageJobProfit: 630,
    leadToCustomerRate: 0.2,
    leadsPerMonth: 30,
    reviewsGainedPerMonth: 5,
    estimatedRevenuePerReview: 500,
    hoursAutomatedPerWeek: 6,
    hourlyLaborCost: 26,
  },
};

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Calculate ROI metrics from the given inputs.
 *
 * All monetary values are in dollars (not cents).
 */
export function calculateRoi(inputs: RoiInputs): RoiResults {
  const {
    monthlySubscriptionCost,
    leadsPerMonth,
    leadToCustomerRate,
    averageJobValue,
    averageJobProfit,
    reviewsGainedPerMonth,
    estimatedRevenuePerReview,
    hoursAutomatedPerWeek,
    hourlyLaborCost,
  } = inputs;

  const newCustomersPerMonth = leadsPerMonth * leadToCustomerRate;

  const monthlyRevenue = newCustomersPerMonth * averageJobValue;
  const monthlyProfit = newCustomersPerMonth * averageJobProfit;

  const weeksPerMonth = 52 / 12;
  const monthlyLaborSavings =
    hoursAutomatedPerWeek * hourlyLaborCost * weeksPerMonth;

  const monthlyReviewValue =
    reviewsGainedPerMonth * estimatedRevenuePerReview;

  const totalMonthlyValue =
    monthlyProfit + monthlyLaborSavings + monthlyReviewValue;

  const netMonthlyValue = totalMonthlyValue - monthlySubscriptionCost;

  const monthlyRoi =
    monthlySubscriptionCost > 0
      ? (netMonthlyValue / monthlySubscriptionCost) * 100
      : 0;

  const annualRoi = monthlyRoi;

  const dailyValue = totalMonthlyValue / 30;
  const dailyCost = monthlySubscriptionCost / 30;
  const paybackDays =
    dailyValue > dailyCost
      ? Math.ceil(monthlySubscriptionCost / (dailyValue - dailyCost))
      : Infinity;

  const costPerLead =
    leadsPerMonth > 0 ? monthlySubscriptionCost / leadsPerMonth : Infinity;

  const costPerCustomer =
    newCustomersPerMonth > 0
      ? monthlySubscriptionCost / newCustomersPerMonth
      : Infinity;

  return {
    monthlyRevenue: round(monthlyRevenue),
    monthlyProfit: round(monthlyProfit),
    monthlyLaborSavings: round(monthlyLaborSavings),
    monthlyReviewValue: round(monthlyReviewValue),
    totalMonthlyValue: round(totalMonthlyValue),
    monthlyRoi: round(monthlyRoi),
    annualRoi: round(annualRoi),
    paybackDays,
    costPerLead: round(costPerLead),
    costPerCustomer: round(costPerCustomer),
  };
}

// ---------------------------------------------------------------------------
// Industry benchmarks lookup
// ---------------------------------------------------------------------------

/**
 * Return typical ROI-calculator inputs for a given home-service vertical.
 *
 * The `vertical` parameter is case-insensitive and supports common aliases
 * (e.g., "HVAC", "hvac", "plumbing").
 *
 * Returns `null` when no benchmark data exists for the requested vertical.
 */
export function getIndustryBenchmarks(
  vertical: string,
): IndustryBenchmarks | null {
  const key = vertical.toLowerCase().replace(/\s+/g, "-");
  return INDUSTRY_BENCHMARKS[key] ?? null;
}

/**
 * Return all supported industry verticals.
 */
export function listVerticals(): string[] {
  return Object.values(INDUSTRY_BENCHMARKS).map((b) => b.vertical);
}

/**
 * Build a full RoiInputs object from industry benchmarks plus a subscription cost.
 */
export function buildInputsFromBenchmarks(
  vertical: string,
  monthlySubscriptionCost: number = DEFAULT_ROI_INPUTS.monthlySubscriptionCost,
): RoiInputs | null {
  const benchmarks = getIndustryBenchmarks(vertical);
  if (!benchmarks) {
    return null;
  }

  return {
    monthlySubscriptionCost,
    leadsPerMonth: benchmarks.leadsPerMonth,
    leadToCustomerRate: benchmarks.leadToCustomerRate,
    averageJobValue: benchmarks.averageJobValue,
    averageJobProfit: benchmarks.averageJobProfit,
    reviewsGainedPerMonth: benchmarks.reviewsGainedPerMonth,
    estimatedRevenuePerReview: benchmarks.estimatedRevenuePerReview,
    hoursAutomatedPerWeek: benchmarks.hoursAutomatedPerWeek,
    hourlyLaborCost: benchmarks.hourlyLaborCost,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
