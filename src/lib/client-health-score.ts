/**
 * Client Health Scoring System
 *
 * Pure utility module for computing client health scores,
 * identifying trends, generating alerts, and recommending
 * interventions. No database calls -- all inputs are passed
 * as function arguments.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Identifier for each health factor used in scoring. */
export type HealthFactorId =
  | "login_frequency"
  | "feature_adoption"
  | "support_ticket_volume"
  | "payment_history"
  | "service_utilization"
  | "review_rating_trend"
  | "lead_conversion_rate"
  | "time_since_last_engagement";

/** A single health factor with its raw value and computed contribution. */
export interface HealthFactor {
  readonly id: HealthFactorId;
  readonly label: string;
  readonly weight: number;
  /** Normalized score for this factor (0-100). */
  readonly score: number;
  /** Weighted contribution to the overall health score. */
  readonly weightedScore: number;
}

/** Overall health score with its constituent factors. */
export interface HealthScore {
  /** Composite score from 0 (critical) to 100 (perfectly healthy). */
  readonly overall: number;
  readonly factors: readonly HealthFactor[];
  readonly risk: RiskCategory;
  readonly computedAt: string;
}

/** Direction and magnitude of change between two scoring periods. */
export interface HealthTrend {
  readonly currentScore: number;
  readonly previousScore: number;
  readonly delta: number;
  readonly direction: "improving" | "stable" | "declining";
  readonly percentChange: number;
}

/** Severity levels for health alerts. */
export type AlertSeverity = "info" | "warning" | "critical";

/** An actionable alert produced when a factor falls below threshold. */
export interface HealthAlert {
  readonly factorId: HealthFactorId;
  readonly severity: AlertSeverity;
  readonly message: string;
  readonly threshold: number;
  readonly actual: number;
}

/** Risk classification buckets. */
export type RiskCategory = "healthy" | "at-risk" | "critical";

/* ------------------------------------------------------------------ */
/*  Raw input contract                                                 */
/* ------------------------------------------------------------------ */

/** Raw metric values a caller must supply. Each value is 0-100. */
export interface HealthFactorInputs {
  /** How frequently the client logs in (0 = never, 100 = daily+). */
  readonly loginFrequency: number;
  /** Percentage of available features actively used. */
  readonly featureAdoption: number;
  /**
   * Support ticket volume normalized to 0-100.
   * Higher values mean MORE tickets (inverse relationship with health).
   */
  readonly supportTicketVolume: number;
  /** Payment reliability score (0 = delinquent, 100 = perfect). */
  readonly paymentHistory: number;
  /** Percentage of provisioned services actively consumed. */
  readonly serviceUtilization: number;
  /** Review / rating trend (0 = declining, 100 = strongly positive). */
  readonly reviewRatingTrend: number;
  /** Percentage of leads that convert (0-100). */
  readonly leadConversionRate: number;
  /**
   * Recency of last engagement normalized to 0-100.
   * 100 = engaged today, 0 = no engagement in defined window.
   */
  readonly timeSinceLastEngagement: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

interface FactorMeta {
  readonly id: HealthFactorId;
  readonly label: string;
  readonly weight: number;
  readonly inputKey: keyof HealthFactorInputs;
  /** When true, a higher raw value is BAD (e.g., support tickets). */
  readonly inverse: boolean;
}

const FACTOR_DEFINITIONS: readonly FactorMeta[] = [
  {
    id: "login_frequency",
    label: "Login Frequency",
    weight: 0.15,
    inputKey: "loginFrequency",
    inverse: false,
  },
  {
    id: "feature_adoption",
    label: "Feature Adoption",
    weight: 0.15,
    inputKey: "featureAdoption",
    inverse: false,
  },
  {
    id: "support_ticket_volume",
    label: "Support Ticket Volume",
    weight: 0.10,
    inputKey: "supportTicketVolume",
    inverse: true,
  },
  {
    id: "payment_history",
    label: "Payment History",
    weight: 0.15,
    inputKey: "paymentHistory",
    inverse: false,
  },
  {
    id: "service_utilization",
    label: "Service Utilization",
    weight: 0.15,
    inputKey: "serviceUtilization",
    inverse: false,
  },
  {
    id: "review_rating_trend",
    label: "Review / Rating Trend",
    weight: 0.10,
    inputKey: "reviewRatingTrend",
    inverse: false,
  },
  {
    id: "lead_conversion_rate",
    label: "Lead Conversion Rate",
    weight: 0.10,
    inputKey: "leadConversionRate",
    inverse: false,
  },
  {
    id: "time_since_last_engagement",
    label: "Time Since Last Engagement",
    weight: 0.10,
    inputKey: "timeSinceLastEngagement",
    inverse: false,
  },
] as const;

/** Thresholds below which an alert is generated for each factor. */
const ALERT_THRESHOLDS: Readonly<Record<HealthFactorId, number>> = {
  login_frequency: 30,
  feature_adoption: 25,
  support_ticket_volume: 40,
  payment_history: 50,
  service_utilization: 30,
  review_rating_trend: 35,
  lead_conversion_rate: 20,
  time_since_last_engagement: 25,
};

const RISK_BOUNDARY_AT_RISK = 60;
const RISK_BOUNDARY_CRITICAL = 35;
const TREND_STABLE_THRESHOLD = 3;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Clamp a number to the 0-100 range. */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Round to two decimal places. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ------------------------------------------------------------------ */
/*  Core functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Compute a composite health score (0-100) from raw factor inputs.
 *
 * Each factor is normalized and clamped to 0-100 before weighting.
 * Inverse factors (e.g., support ticket volume) are flipped so that
 * a high raw value reduces health.
 */
export function calculateHealthScore(
  inputs: HealthFactorInputs,
): HealthScore {
  const factors: HealthFactor[] = FACTOR_DEFINITIONS.map((meta) => {
    const raw = clamp(inputs[meta.inputKey]);
    const score = meta.inverse ? 100 - raw : raw;
    const weightedScore = round2(score * meta.weight);

    return {
      id: meta.id,
      label: meta.label,
      weight: meta.weight,
      score: round2(score),
      weightedScore,
    };
  });

  const overall = round2(
    factors.reduce((sum, f) => sum + f.weightedScore, 0),
  );

  return {
    overall,
    factors,
    risk: classifyRisk(overall),
    computedAt: new Date().toISOString(),
  };
}

/**
 * Compare the current period score against a previous period score
 * and return a trend summary.
 */
export function getHealthTrend(
  currentScore: number,
  previousScore: number,
): HealthTrend {
  const delta = round2(currentScore - previousScore);
  const percentChange =
    previousScore === 0
      ? currentScore > 0
        ? 100
        : 0
      : round2((delta / previousScore) * 100);

  let direction: HealthTrend["direction"];
  if (delta > TREND_STABLE_THRESHOLD) {
    direction = "improving";
  } else if (delta < -TREND_STABLE_THRESHOLD) {
    direction = "declining";
  } else {
    direction = "stable";
  }

  return { currentScore, previousScore, delta, direction, percentChange };
}

/**
 * Produce alerts for any health factor whose score falls below its
 * predefined threshold.
 */
export function generateHealthAlerts(
  healthScore: HealthScore,
): readonly HealthAlert[] {
  const alerts: HealthAlert[] = [];

  for (const factor of healthScore.factors) {
    const threshold = ALERT_THRESHOLDS[factor.id];

    if (factor.score < threshold) {
      const severity = deriveSeverity(factor.score, threshold);

      alerts.push({
        factorId: factor.id,
        severity,
        message: buildAlertMessage(factor, severity),
        threshold,
        actual: factor.score,
      });
    }
  }

  return alerts;
}

/**
 * Classify a numeric health score into a risk category.
 *
 * - healthy:  score >= 60
 * - at-risk:  35 <= score < 60
 * - critical: score < 35
 */
export function classifyRisk(score: number): RiskCategory {
  if (score >= RISK_BOUNDARY_AT_RISK) {
    return "healthy";
  }
  if (score >= RISK_BOUNDARY_CRITICAL) {
    return "at-risk";
  }
  return "critical";
}

/**
 * Suggest concrete interventions based on the weakest-scoring
 * factors in a health score.
 *
 * Returns up to `maxActions` recommendations, ordered from the
 * weakest factor to the strongest.
 */
export function getRecommendedActions(
  healthScore: HealthScore,
  maxActions: number = 3,
): readonly string[] {
  const sorted = [...healthScore.factors].sort(
    (a, b) => a.score - b.score,
  );

  const actions: string[] = [];

  for (const factor of sorted) {
    if (actions.length >= maxActions) break;

    const action = ACTION_MAP[factor.id];
    if (action) {
      actions.push(action(factor.score));
    }
  }

  return actions;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function deriveSeverity(
  score: number,
  threshold: number,
): AlertSeverity {
  const gap = threshold - score;
  if (gap > 25) return "critical";
  if (gap > 10) return "warning";
  return "info";
}

function buildAlertMessage(
  factor: HealthFactor,
  severity: AlertSeverity,
): string {
  const prefix =
    severity === "critical"
      ? "CRITICAL"
      : severity === "warning"
        ? "Warning"
        : "Notice";

  return (
    `${prefix}: ${factor.label} score is ${factor.score}/100, ` +
    `below the ${ALERT_THRESHOLDS[factor.id]} threshold.`
  );
}

/** Maps each factor to a function that returns a recommended action. */
const ACTION_MAP: Readonly<
  Record<HealthFactorId, (score: number) => string>
> = {
  login_frequency: (s) =>
    s < 15
      ? "Schedule an urgent re-engagement call; client has not logged in recently."
      : "Send a personalized check-in email highlighting new features to encourage logins.",

  feature_adoption: (s) =>
    s < 20
      ? "Arrange a dedicated onboarding session to walk through underused features."
      : "Share a curated feature tips newsletter targeting the client's industry.",

  support_ticket_volume: (s) =>
    s < 20
      ? "Escalate to a senior support specialist; high ticket volume indicates systemic issues."
      : "Review recent tickets for patterns and provide proactive documentation or training.",

  payment_history: (s) =>
    s < 30
      ? "Engage the billing team for a payment recovery plan immediately."
      : "Send a friendly payment reminder and offer flexible billing options.",

  service_utilization: (s) =>
    s < 20
      ? "Conduct a service audit to identify barriers preventing the client from using provisioned services."
      : "Recommend a service optimization session to align provisioned services with actual needs.",

  review_rating_trend: (s) =>
    s < 20
      ? "Initiate a customer satisfaction recovery program with direct outreach."
      : "Request feedback through a brief survey to understand declining sentiment.",

  lead_conversion_rate: (s) =>
    s < 15
      ? "Review the client's lead pipeline and offer conversion optimization consulting."
      : "Share best-practice guides and case studies for improving lead conversion.",

  time_since_last_engagement: (s) =>
    s < 15
      ? "Flag as at-risk for churn; launch a win-back campaign immediately."
      : "Schedule a quarterly business review to re-establish engagement cadence.",
};
