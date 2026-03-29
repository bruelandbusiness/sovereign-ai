/**
 * A/B testing framework utility.
 *
 * Pure math/logic for experiment management, variant assignment,
 * and statistical significance calculations. No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export interface Variant {
  readonly id: string;
  readonly name: string;
  readonly weight: number;
  readonly conversions: number;
  readonly impressions: number;
}

export interface Experiment {
  readonly id: string;
  readonly name: string;
  readonly controlId: string;
  readonly variants: readonly Variant[];
  readonly startDate: Date;
  readonly maxDurationDays: number;
  readonly targetSampleSize: number;
}

export interface ConfidenceInterval {
  readonly lower: number;
  readonly upper: number;
}

export interface ConversionRateResult {
  readonly rate: number;
  readonly confidenceInterval: ConfidenceInterval;
  readonly sampleSize: number;
}

export interface StatisticalSignificance {
  readonly zScore: number;
  readonly pValue: number;
  readonly isSignificant: boolean;
  readonly confidenceLevel: number;
}

export interface ExperimentResult {
  readonly experimentId: string;
  readonly winnerId: string | null;
  readonly isSignificant: boolean;
  readonly controlConversionRate: ConversionRateResult;
  readonly variantResults: readonly VariantResult[];
}

export interface VariantResult {
  readonly variantId: string;
  readonly conversionRate: ConversionRateResult;
  readonly significance: StatisticalSignificance;
  readonly lift: number;
}

export interface StopRecommendation {
  readonly shouldStop: boolean;
  readonly reason: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const Z_SCORE_95 = 1.96;
const DEFAULT_CONFIDENCE_LEVEL = 0.95;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Simple deterministic hash of a string to a number in [0, 1).
 *
 * Uses a variant of DJB2 to produce a 32-bit integer, then normalizes.
 */
function hashToUnit(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) / 2147483647;
}

/**
 * Approximate the cumulative distribution function of the standard
 * normal distribution using the Abramowitz & Stegun approximation.
 */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);

  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;

  const t = 1.0 / (1.0 + p * absZ);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const pdf = Math.exp(-0.5 * absZ * absZ) / Math.sqrt(2 * Math.PI);
  const cdf =
    1.0 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5);

  return 0.5 + sign * (cdf - 0.5);
}

/**
 * Approximate the inverse of the standard normal CDF (quantile function).
 * Uses the rational approximation by Peter Acklam.
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a1 = -3.969683028665376e1;
  const a2 = 2.209460984245205e2;
  const a3 = -2.759285104469687e2;
  const a4 = 1.383577518672690e2;
  const a5 = -3.066479806614716e1;
  const a6 = 2.506628277459239e0;

  const b1 = -5.447609879822406e1;
  const b2 = 1.615858368580409e2;
  const b3 = -1.556989798598866e2;
  const b4 = 6.680131188771972e1;
  const b5 = -1.328068155288572e1;

  const c1 = -7.784894002430293e-3;
  const c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838e0;
  const c4 = -2.549732539343734e0;
  const c5 = 4.374664141464968e0;
  const c6 = 2.938163982698783e0;

  const d1 = 7.784695709041462e-3;
  const d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996e0;
  const d4 = 3.754408661907416e0;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  }

  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q) /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  }

  q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
    ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
  );
}

function findVariant(
  experiment: Experiment,
  variantId: string,
): Variant {
  const variant = experiment.variants.find((v) => v.id === variantId);
  if (!variant) {
    throw new Error(
      `Variant "${variantId}" not found in experiment "${experiment.id}"`,
    );
  }
  return variant;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Create a new experiment with a control and one or more variants.
 *
 * Weights are normalized so they sum to 1. If no weights are
 * provided, traffic is split evenly across all variants.
 */
export function createExperiment(params: {
  readonly id: string;
  readonly name: string;
  readonly controlId: string;
  readonly variants: readonly Omit<Variant, "conversions" | "impressions">[];
  readonly startDate?: Date;
  readonly maxDurationDays?: number;
  readonly targetSampleSize?: number;
}): Experiment {
  if (params.variants.length < 2) {
    throw new Error("An experiment requires at least two variants (control + treatment)");
  }

  const controlExists = params.variants.some(
    (v) => v.id === params.controlId,
  );
  if (!controlExists) {
    throw new Error(
      `Control ID "${params.controlId}" must match one of the variant IDs`,
    );
  }

  const totalWeight = params.variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Total variant weight must be greater than zero");
  }

  const normalizedVariants: readonly Variant[] = params.variants.map(
    (v) => ({
      id: v.id,
      name: v.name,
      weight: v.weight / totalWeight,
      conversions: 0,
      impressions: 0,
    }),
  );

  return {
    id: params.id,
    name: params.name,
    controlId: params.controlId,
    variants: normalizedVariants,
    startDate: params.startDate ?? new Date(),
    maxDurationDays: params.maxDurationDays ?? 30,
    targetSampleSize: params.targetSampleSize ?? 1000,
  };
}

/**
 * Deterministically assign a variant to a user based on a hash
 * of `userId + experimentId`.
 *
 * The hash produces a value in [0, 1) which is mapped to a
 * variant using the cumulative weight distribution.
 */
export function assignVariant(
  experiment: Experiment,
  userId: string,
): Variant {
  const bucket = hashToUnit(`${userId}:${experiment.id}`);

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant (handles floating-point edge case).
  return experiment.variants[experiment.variants.length - 1];
}

/**
 * Calculate the conversion rate for a variant with a 95% Wilson
 * score confidence interval.
 */
export function calculateConversionRate(
  variant: Variant,
): ConversionRateResult {
  if (variant.impressions === 0) {
    return {
      rate: 0,
      confidenceInterval: { lower: 0, upper: 0 },
      sampleSize: 0,
    };
  }

  const n = variant.impressions;
  const p = variant.conversions / n;
  const z = Z_SCORE_95;
  const z2 = z * z;

  // Wilson score interval
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denominator;

  return {
    rate: p,
    confidenceInterval: {
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin),
    },
    sampleSize: n,
  };
}

/**
 * Perform a two-proportion z-test comparing two conversion rates.
 *
 * Returns the z-score, two-tailed p-value, and whether the
 * result is significant at the 95% confidence level.
 */
export function calculateStatisticalSignificance(
  control: Variant,
  treatment: Variant,
  confidenceLevel: number = DEFAULT_CONFIDENCE_LEVEL,
): StatisticalSignificance {
  const n1 = control.impressions;
  const n2 = treatment.impressions;

  if (n1 === 0 || n2 === 0) {
    return {
      zScore: 0,
      pValue: 1,
      isSignificant: false,
      confidenceLevel,
    };
  }

  const p1 = control.conversions / n1;
  const p2 = treatment.conversions / n2;

  // Pooled proportion under H0
  const pPooled =
    (control.conversions + treatment.conversions) / (n1 + n2);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return {
      zScore: 0,
      pValue: 1,
      isSignificant: false,
      confidenceLevel,
    };
  }

  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));
  const alpha = 1 - confidenceLevel;

  return {
    zScore,
    pValue,
    isSignificant: pValue < alpha,
    confidenceLevel,
  };
}

/**
 * Check whether an experiment has a statistically significant winner.
 *
 * Compares each non-control variant against the control and returns
 * the full result set.
 */
export function determineWinner(
  experiment: Experiment,
): ExperimentResult {
  const control = findVariant(experiment, experiment.controlId);
  const controlConversionRate = calculateConversionRate(control);

  const variantResults: VariantResult[] = experiment.variants
    .filter((v) => v.id !== experiment.controlId)
    .map((treatment) => {
      const significance = calculateStatisticalSignificance(
        control,
        treatment,
      );
      const conversionRate = calculateConversionRate(treatment);
      const lift = calculateLift(control, treatment);

      return {
        variantId: treatment.id,
        conversionRate,
        significance,
        lift,
      };
    });

  const significantWinners = variantResults.filter(
    (r) => r.significance.isSignificant && r.lift > 0,
  );

  let winnerId: string | null = null;
  if (significantWinners.length > 0) {
    winnerId = significantWinners.reduce((best, curr) =>
      curr.lift > best.lift ? curr : best,
    ).variantId;
  }

  const isSignificant = variantResults.some(
    (r) => r.significance.isSignificant,
  );

  return {
    experimentId: experiment.id,
    winnerId,
    isSignificant,
    controlConversionRate,
    variantResults,
  };
}

/**
 * Calculate the minimum sample size per variant needed to detect a
 * given minimum detectable effect (MDE) with the desired statistical
 * power and confidence level.
 *
 * Uses the standard formula for two-proportion tests.
 *
 * @param baselineRate - Expected conversion rate of the control (0-1).
 * @param mde - Minimum detectable effect as an absolute difference (0-1).
 * @param power - Desired statistical power (default 0.8).
 * @param confidenceLevel - Desired confidence level (default 0.95).
 * @returns Minimum sample size per variant.
 */
export function calculateSampleSize(
  baselineRate: number,
  mde: number,
  power: number = 0.8,
  confidenceLevel: number = DEFAULT_CONFIDENCE_LEVEL,
): number {
  if (baselineRate <= 0 || baselineRate >= 1) {
    throw new Error("Baseline rate must be between 0 and 1 (exclusive)");
  }
  if (mde <= 0) {
    throw new Error("Minimum detectable effect must be greater than zero");
  }

  const alpha = 1 - confidenceLevel;
  const zAlpha = normalQuantile(1 - alpha / 2);
  const zBeta = normalQuantile(power);

  const p1 = baselineRate;
  const p2 = baselineRate + mde;
  const pBar = (p1 + p2) / 2;

  const numerator =
    (zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denominator = (p2 - p1) ** 2;

  return Math.ceil(numerator / denominator);
}

/**
 * Calculate the percentage improvement (lift) of a treatment
 * variant over the control.
 *
 * Returns 0 if the control has no conversions.
 */
export function calculateLift(
  control: Variant,
  treatment: Variant,
): number {
  if (control.impressions === 0) {
    return 0;
  }

  const controlRate = control.conversions / control.impressions;
  if (controlRate === 0) {
    return 0;
  }

  const treatmentRate = treatment.conversions / treatment.impressions;
  return ((treatmentRate - controlRate) / controlRate) * 100;
}

/**
 * Recommend whether to stop an experiment based on:
 * - Statistical significance has been reached.
 * - Maximum experiment duration has elapsed.
 * - Target sample size has been met without significance.
 */
export function shouldStopExperiment(
  experiment: Experiment,
  currentDate: Date = new Date(),
): StopRecommendation {
  const elapsedMs =
    currentDate.getTime() - experiment.startDate.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  // Check if max duration has been exceeded.
  if (elapsedDays >= experiment.maxDurationDays) {
    return {
      shouldStop: true,
      reason: `Maximum duration of ${experiment.maxDurationDays} days has been reached`,
    };
  }

  // Check for statistical significance.
  const result = determineWinner(experiment);
  if (result.isSignificant) {
    return {
      shouldStop: true,
      reason: result.winnerId
        ? `Statistically significant winner found: variant "${result.winnerId}"`
        : "Statistical significance reached (no clear winner — control may be best)",
    };
  }

  // Check if target sample size has been met without significance.
  const totalImpressions = experiment.variants.reduce(
    (sum, v) => sum + v.impressions,
    0,
  );
  if (totalImpressions >= experiment.targetSampleSize) {
    return {
      shouldStop: true,
      reason:
        "Target sample size reached without statistical significance — consider accepting the null hypothesis",
    };
  }

  return {
    shouldStop: false,
    reason: "Experiment is still collecting data",
  };
}
