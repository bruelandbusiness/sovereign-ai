/**
 * Competitor monitoring and alert utility.
 *
 * Pure logic for tracking competitor changes, assessing threats,
 * and generating strategic recommendations. Works on provided data
 * only — no web scraping.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type ThreatLevel = "low" | "medium" | "high" | "critical";

export type ChangeType =
  | "pricing"
  | "feature_launch"
  | "feature_removal"
  | "marketing_campaign"
  | "market_positioning"
  | "customer_sentiment";

export interface PriceChange {
  readonly competitorId: string;
  readonly planName: string;
  readonly oldPrice: number;
  readonly newPrice: number;
  readonly percentageChange: number;
  readonly direction: "increase" | "decrease";
  readonly detectedAt: Date;
  readonly currency: string;
}

export interface FeatureChange {
  readonly competitorId: string;
  readonly added: readonly string[];
  readonly removed: readonly string[];
  readonly detectedAt: Date;
}

export interface MarketAlert {
  readonly id: string;
  readonly competitorId: string;
  readonly competitorName: string;
  readonly changeType: ChangeType;
  readonly threatLevel: ThreatLevel;
  readonly summary: string;
  readonly details: string;
  readonly suggestedActions: readonly string[];
  readonly createdAt: Date;
}

export interface CompetitorUpdate {
  readonly competitorId: string;
  readonly competitorName: string;
  readonly timestamp: Date;
  readonly changeType: ChangeType;
  readonly description: string;
  readonly priceChange?: PriceChange;
  readonly featureChange?: FeatureChange;
  readonly rawData?: Record<string, unknown>;
}

export interface CompetitorProfile {
  readonly id: string;
  readonly name: string;
  readonly marketShare: number;
  readonly strengthScore: number;
  readonly plans: readonly PlanInfo[];
  readonly features: readonly string[];
  readonly recentUpdates: readonly CompetitorUpdate[];
}

export interface PlanInfo {
  readonly name: string;
  readonly price: number;
  readonly currency: string;
  readonly features: readonly string[];
}

export interface MonitoringConfig {
  readonly competitors: readonly CompetitorProfile[];
  readonly alertThresholds: {
    readonly priceChangePercent: number;
    readonly minThreatLevel: ThreatLevel;
  };
  readonly reportFrequency: "daily" | "weekly" | "monthly";
  readonly enabledChangeTypes: readonly ChangeType[];
}

export interface CompetitiveReport {
  readonly generatedAt: Date;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly totalAlerts: number;
  readonly alertsByThreatLevel: Record<ThreatLevel, number>;
  readonly alertsByCompetitor: Record<string, number>;
  readonly topThreats: readonly MarketAlert[];
  readonly recommendations: readonly string[];
  readonly summary: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export interface MonitoringPoint {
  readonly category: string;
  readonly items: readonly string[];
}

export const MONITORING_POINTS: readonly MonitoringPoint[] = [
  {
    category: "Pricing changes",
    items: [
      "Monthly and annual plan cost adjustments",
      "Feature bundling and tier restructuring",
      "Promotional discounts and limited-time offers",
      "Free tier scope changes",
      "Enterprise pricing model shifts",
    ],
  },
  {
    category: "New feature launches",
    items: [
      "Core product feature additions",
      "API capability expansions",
      "Integration announcements",
      "Beta and early-access programs",
      "Platform or SDK releases",
    ],
  },
  {
    category: "Marketing campaign changes",
    items: [
      "Messaging and positioning pivots",
      "Target audience shifts",
      "Channel strategy changes",
      "Content marketing themes",
      "Partnership and co-marketing announcements",
    ],
  },
  {
    category: "Market positioning shifts",
    items: [
      "Segment focus changes (SMB vs enterprise)",
      "Vertical market expansion",
      "Geographic market entry or exit",
      "Brand identity and value proposition changes",
      "Analyst and industry report positioning",
    ],
  },
  {
    category: "Customer review sentiment",
    items: [
      "Overall satisfaction trend direction",
      "Feature-specific praise or complaints",
      "Support quality perception",
      "Pricing fairness sentiment",
      "Churn indicator signals",
    ],
  },
] as const;

const THREAT_LEVEL_ORDER: Record<ThreatLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/* ------------------------------------------------------------------ */
/*  Helper – UUID-like ID generator (no crypto dependency)             */
/* ------------------------------------------------------------------ */

function generateAlertId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `alert_${timestamp}_${random}`;
}

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Compare old versus new pricing and calculate percentage change.
 *
 * Returns null when oldPrice is zero (cannot compute percentage).
 */
export function detectPriceChange(
  competitorId: string,
  planName: string,
  oldPrice: number,
  newPrice: number,
  currency: string = "USD",
): PriceChange | null {
  if (oldPrice === 0) {
    return null;
  }

  const percentageChange =
    Math.round(((newPrice - oldPrice) / oldPrice) * 10000) / 100;

  return {
    competitorId,
    planName,
    oldPrice,
    newPrice,
    percentageChange,
    direction: newPrice > oldPrice ? "increase" : "decrease",
    detectedAt: new Date(),
    currency,
  };
}

/**
 * Diff two feature lists to find additions and removals.
 */
export function detectFeatureChange(
  competitorId: string,
  oldFeatures: readonly string[],
  newFeatures: readonly string[],
): FeatureChange {
  const oldSet = new Set(oldFeatures);
  const newSet = new Set(newFeatures);

  const added = newFeatures.filter((f) => !oldSet.has(f));
  const removed = oldFeatures.filter((f) => !newSet.has(f));

  return {
    competitorId,
    added,
    removed,
    detectedAt: new Date(),
  };
}

/**
 * Create an alert when a significant competitive change is detected.
 */
export function generateMarketAlert(
  update: CompetitorUpdate,
  threatLevel: ThreatLevel,
  suggestedActions: readonly string[],
): MarketAlert {
  return {
    id: generateAlertId(),
    competitorId: update.competitorId,
    competitorName: update.competitorName,
    changeType: update.changeType,
    threatLevel,
    summary: buildAlertSummary(update),
    details: update.description,
    suggestedActions,
    createdAt: new Date(),
  };
}

function buildAlertSummary(update: CompetitorUpdate): string {
  const typeLabels: Record<ChangeType, string> = {
    pricing: "Pricing Change",
    feature_launch: "Feature Launch",
    feature_removal: "Feature Removal",
    marketing_campaign: "Marketing Campaign",
    market_positioning: "Market Positioning",
    customer_sentiment: "Sentiment Shift",
  };

  const label = typeLabels[update.changeType];
  return `${label} detected for ${update.competitorName}`;
}

/**
 * Assess threat level based on change type and competitor strength.
 *
 * strengthScore: 0–100 representing competitor market influence.
 * priceChangePercent: absolute percentage change (optional, for pricing).
 */
export function calculateThreatLevel(
  changeType: ChangeType,
  strengthScore: number,
  priceChangePercent?: number,
): ThreatLevel {
  const clampedStrength = Math.max(0, Math.min(100, strengthScore));
  let score = 0;

  // Base score from change type
  const typeWeights: Record<ChangeType, number> = {
    pricing: 30,
    feature_launch: 25,
    feature_removal: 10,
    marketing_campaign: 15,
    market_positioning: 20,
    customer_sentiment: 15,
  };
  score += typeWeights[changeType];

  // Strength contribution (up to 40 points)
  score += (clampedStrength / 100) * 40;

  // Price magnitude bonus for pricing changes
  if (changeType === "pricing" && priceChangePercent !== undefined) {
    const absChange = Math.abs(priceChangePercent);
    if (absChange >= 30) {
      score += 25;
    } else if (absChange >= 15) {
      score += 15;
    } else if (absChange >= 5) {
      score += 5;
    }
  }

  if (score >= 70) {
    return "critical";
  }
  if (score >= 50) {
    return "high";
  }
  if (score >= 30) {
    return "medium";
  }
  return "low";
}

/**
 * Recommend a strategic response to a competitor change.
 */
export function suggestCounterStrategy(
  update: CompetitorUpdate,
  ownFeatures: readonly string[],
): readonly string[] {
  const strategies: string[] = [];

  switch (update.changeType) {
    case "pricing": {
      const pc = update.priceChange;
      if (pc && pc.direction === "decrease") {
        strategies.push(
          "Evaluate whether a price-match or value-add response is warranted",
          "Highlight unique differentiators that justify current pricing",
          "Consider introducing a limited-time promotional offer",
          "Analyze customer price sensitivity for affected tiers",
        );
      } else {
        strategies.push(
          "Capitalize on competitor price increase in marketing",
          "Target competitor customers who may be cost-sensitive",
          "Emphasize pricing stability as a brand strength",
        );
      }
      break;
    }

    case "feature_launch": {
      const fc = update.featureChange;
      if (fc) {
        const ownSet = new Set(ownFeatures);
        const weAlreadyHave = fc.added.filter((f) => ownSet.has(f));
        const weLack = fc.added.filter((f) => !ownSet.has(f));

        if (weAlreadyHave.length > 0) {
          strategies.push(
            `Amplify existing feature parity: ${weAlreadyHave.join(", ")}`,
          );
        }
        if (weLack.length > 0) {
          strategies.push(
            `Evaluate roadmap priority for: ${weLack.join(", ")}`,
            "Assess customer demand for these capabilities",
          );
        }
      }
      strategies.push(
        "Publish comparison content highlighting our strengths",
        "Accelerate release of upcoming differentiating features",
      );
      break;
    }

    case "feature_removal":
      strategies.push(
        "Target affected competitor users with migration messaging",
        "Ensure our equivalent features are well-documented",
        "Create switching guides for displaced users",
      );
      break;

    case "marketing_campaign":
      strategies.push(
        "Analyze campaign messaging to identify competitive claims",
        "Prepare counter-narratives for sales enablement",
        "Increase share-of-voice in targeted channels",
        "Update battle cards for the sales team",
      );
      break;

    case "market_positioning":
      strategies.push(
        "Review and reinforce our own positioning statement",
        "Identify underserved segments the competitor is abandoning",
        "Update competitive intelligence briefings for leadership",
        "Consider analyst briefing to solidify our market narrative",
      );
      break;

    case "customer_sentiment":
      strategies.push(
        "Monitor review platforms for actionable competitor weaknesses",
        "Launch targeted outreach to dissatisfied competitor customers",
        "Reinforce our support and satisfaction story in marketing",
        "Collect and publish customer testimonials in response",
      );
      break;
  }

  return strategies;
}

/**
 * Generate a competitive landscape summary for a given period.
 */
export function generateCompetitiveReport(
  config: MonitoringConfig,
  alerts: readonly MarketAlert[],
  periodStart: Date,
  periodEnd: Date,
): CompetitiveReport {
  const periodAlerts = alerts.filter(
    (a) => a.createdAt >= periodStart && a.createdAt <= periodEnd,
  );

  const alertsByThreatLevel: Record<ThreatLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const alertsByCompetitor: Record<string, number> = {};

  for (const alert of periodAlerts) {
    alertsByThreatLevel[alert.threatLevel] += 1;
    alertsByCompetitor[alert.competitorName] =
      (alertsByCompetitor[alert.competitorName] ?? 0) + 1;
  }

  const topThreats = [...periodAlerts]
    .sort(
      (a, b) =>
        THREAT_LEVEL_ORDER[b.threatLevel] -
        THREAT_LEVEL_ORDER[a.threatLevel],
    )
    .slice(0, 5);

  const recommendations = buildReportRecommendations(
    periodAlerts,
    config,
  );

  const summary = buildReportSummary(
    periodAlerts,
    alertsByThreatLevel,
    periodStart,
    periodEnd,
  );

  return {
    generatedAt: new Date(),
    periodStart,
    periodEnd,
    totalAlerts: periodAlerts.length,
    alertsByThreatLevel,
    alertsByCompetitor,
    topThreats,
    recommendations,
    summary,
  };
}

/* ------------------------------------------------------------------ */
/*  Report Helpers                                                     */
/* ------------------------------------------------------------------ */

function buildReportRecommendations(
  alerts: readonly MarketAlert[],
  config: MonitoringConfig,
): readonly string[] {
  const recommendations: string[] = [];

  const criticalCount = alerts.filter(
    (a) => a.threatLevel === "critical",
  ).length;
  const highCount = alerts.filter(
    (a) => a.threatLevel === "high",
  ).length;
  const pricingAlerts = alerts.filter(
    (a) => a.changeType === "pricing",
  );
  const featureAlerts = alerts.filter(
    (a) =>
      a.changeType === "feature_launch" ||
      a.changeType === "feature_removal",
  );

  if (criticalCount > 0) {
    recommendations.push(
      `${criticalCount} critical alert(s) require immediate leadership review`,
    );
  }

  if (highCount > 2) {
    recommendations.push(
      "Elevated competitive activity — consider accelerating roadmap priorities",
    );
  }

  if (pricingAlerts.length > 0) {
    recommendations.push(
      "Pricing movements detected — conduct pricing committee review",
    );
  }

  if (featureAlerts.length >= 3) {
    recommendations.push(
      "Multiple feature changes across competitors — schedule product strategy sync",
    );
  }

  if (config.competitors.length > 0) {
    const strongCompetitors = config.competitors.filter(
      (c) => c.strengthScore >= 70,
    );
    if (strongCompetitors.length > 0) {
      const names = strongCompetitors.map((c) => c.name).join(", ");
      recommendations.push(
        `Maintain close monitoring of high-strength competitors: ${names}`,
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "No significant competitive shifts — maintain current strategy",
    );
  }

  return recommendations;
}

function buildReportSummary(
  alerts: readonly MarketAlert[],
  byThreat: Record<ThreatLevel, number>,
  periodStart: Date,
  periodEnd: Date,
): string {
  const startStr = periodStart.toISOString().slice(0, 10);
  const endStr = periodEnd.toISOString().slice(0, 10);

  if (alerts.length === 0) {
    return (
      `Competitive landscape report for ${startStr} to ${endStr}: ` +
      "No significant competitor activity detected during this period."
    );
  }

  const parts: string[] = [
    `Competitive landscape report for ${startStr} to ${endStr}:`,
    `${alerts.length} alert(s) detected.`,
  ];

  if (byThreat.critical > 0) {
    parts.push(`${byThreat.critical} critical.`);
  }
  if (byThreat.high > 0) {
    parts.push(`${byThreat.high} high.`);
  }
  if (byThreat.medium > 0) {
    parts.push(`${byThreat.medium} medium.`);
  }
  if (byThreat.low > 0) {
    parts.push(`${byThreat.low} low.`);
  }

  return parts.join(" ");
}
