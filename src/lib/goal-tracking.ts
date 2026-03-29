/**
 * Goal tracking and OKR utility for client dashboards.
 *
 * Pure logic for creating, tracking, and reporting on business goals.
 * Supports revenue, leads, reviews, SEO, bookings, and engagement
 * categories with milestone tracking and trend projections.
 * No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "on_track"
  | "at_risk"
  | "behind"
  | "completed"
  | "abandoned";

export type GoalCategory =
  | "revenue"
  | "leads"
  | "reviews"
  | "seo"
  | "bookings"
  | "engagement";

export interface Milestone {
  readonly id: string;
  readonly label: string;
  readonly targetValue: number;
  readonly targetDate: Date;
  readonly completedAt: Date | null;
  readonly isCompleted: boolean;
}

export interface GoalProgress {
  readonly currentValue: number;
  readonly targetValue: number;
  readonly percentage: number;
  readonly trend: "improving" | "stable" | "declining";
  readonly dailyRate: number;
  readonly projectedCompletionDate: Date | null;
  readonly isOnTrack: boolean;
  readonly daysRemaining: number;
  readonly daysElapsed: number;
}

export interface Goal {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: GoalCategory;
  readonly status: GoalStatus;
  readonly startDate: Date;
  readonly deadline: Date;
  readonly targetValue: number;
  readonly currentValue: number;
  readonly unit: string;
  readonly milestones: readonly Milestone[];
  readonly dataPoints: readonly DataPoint[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DataPoint {
  readonly date: Date;
  readonly value: number;
}

export interface GoalTemplate {
  readonly title: string;
  readonly description: string;
  readonly category: GoalCategory;
  readonly unit: string;
  readonly defaultTarget: number;
  readonly defaultDurationDays: number;
  readonly suggestedMilestoneCount: number;
}

export interface GoalReport {
  readonly totalGoals: number;
  readonly completed: number;
  readonly onTrack: number;
  readonly atRisk: number;
  readonly behind: number;
  readonly notStarted: number;
  readonly overallHealthScore: number;
  readonly goalSummaries: readonly GoalSummary[];
  readonly recommendations: readonly string[];
}

export interface GoalSummary {
  readonly goalId: string;
  readonly title: string;
  readonly category: GoalCategory;
  readonly status: GoalStatus;
  readonly progressPercentage: number;
  readonly daysRemaining: number;
  readonly recommendation: string;
}

export interface GoalSuggestion {
  readonly template: GoalTemplate;
  readonly reason: string;
  readonly priority: "high" | "medium" | "low";
  readonly suggestedTarget: number;
}

export interface IndustryBenchmarks {
  readonly averageMrr?: number;
  readonly averageLeadsPerMonth?: number;
  readonly averageConversionRate?: number;
  readonly averageReviewRating?: number;
  readonly averageBookingsPerWeek?: number;
  readonly averageEmailOpenRate?: number;
  readonly averageOrganicTraffic?: number;
}

export interface CurrentPerformance {
  readonly mrr?: number;
  readonly monthlyLeads?: number;
  readonly conversionRate?: number;
  readonly averageRating?: number;
  readonly monthlyReviews?: number;
  readonly weeklyBookings?: number;
  readonly noShowRate?: number;
  readonly emailOpenRate?: number;
  readonly socialFollowing?: number;
  readonly organicTraffic?: number;
  readonly keywordRankings?: number;
}

/* ------------------------------------------------------------------ */
/*  Goal Templates                                                     */
/* ------------------------------------------------------------------ */

export const GOAL_TEMPLATES: Record<string, GoalTemplate> = {
  // Revenue
  revenue_mrr: {
    title: "Reach $X MRR",
    description:
      "Grow monthly recurring revenue to the target amount.",
    category: "revenue",
    unit: "dollars",
    defaultTarget: 10000,
    defaultDurationDays: 180,
    suggestedMilestoneCount: 4,
  },
  revenue_growth: {
    title: "Grow revenue by X%",
    description:
      "Increase total revenue by a target percentage over the period.",
    category: "revenue",
    unit: "percent",
    defaultTarget: 25,
    defaultDurationDays: 90,
    suggestedMilestoneCount: 3,
  },

  // Leads
  leads_monthly: {
    title: "Generate X leads per month",
    description:
      "Reach a consistent volume of new leads each month.",
    category: "leads",
    unit: "leads",
    defaultTarget: 100,
    defaultDurationDays: 90,
    suggestedMilestoneCount: 3,
  },
  leads_conversion: {
    title: "Improve conversion rate to X%",
    description:
      "Increase the lead-to-customer conversion rate to the target.",
    category: "leads",
    unit: "percent",
    defaultTarget: 5,
    defaultDurationDays: 120,
    suggestedMilestoneCount: 3,
  },

  // Reviews
  reviews_rating: {
    title: "Reach X average rating",
    description:
      "Improve average review rating across all platforms.",
    category: "reviews",
    unit: "stars",
    defaultTarget: 4.5,
    defaultDurationDays: 180,
    suggestedMilestoneCount: 3,
  },
  reviews_volume: {
    title: "Get X new reviews per month",
    description:
      "Increase the monthly volume of new customer reviews.",
    category: "reviews",
    unit: "reviews",
    defaultTarget: 20,
    defaultDurationDays: 90,
    suggestedMilestoneCount: 3,
  },

  // SEO
  seo_rankings: {
    title: "Rank #1 for X keywords",
    description:
      "Achieve top search ranking for the target number of keywords.",
    category: "seo",
    unit: "keywords",
    defaultTarget: 5,
    defaultDurationDays: 180,
    suggestedMilestoneCount: 4,
  },
  seo_traffic: {
    title: "Increase organic traffic by X%",
    description:
      "Grow organic search traffic by the target percentage.",
    category: "seo",
    unit: "percent",
    defaultTarget: 50,
    defaultDurationDays: 180,
    suggestedMilestoneCount: 4,
  },

  // Bookings
  bookings_weekly: {
    title: "Book X jobs per week",
    description:
      "Reach a consistent volume of weekly job bookings.",
    category: "bookings",
    unit: "bookings",
    defaultTarget: 15,
    defaultDurationDays: 90,
    suggestedMilestoneCount: 3,
  },
  bookings_noshow: {
    title: "Reduce no-show rate to X%",
    description:
      "Lower the appointment no-show rate to the target percentage.",
    category: "bookings",
    unit: "percent",
    defaultTarget: 5,
    defaultDurationDays: 90,
    suggestedMilestoneCount: 3,
  },

  // Engagement
  engagement_email: {
    title: "Achieve X% email open rate",
    description:
      "Improve email campaign open rates to the target percentage.",
    category: "engagement",
    unit: "percent",
    defaultTarget: 30,
    defaultDurationDays: 90,
    suggestedMilestoneCount: 3,
  },
  engagement_social: {
    title: "Grow social following by X%",
    description:
      "Increase social media follower count by the target percentage.",
    category: "engagement",
    unit: "percent",
    defaultTarget: 25,
    defaultDurationDays: 120,
    suggestedMilestoneCount: 3,
  },
} as const satisfies Record<string, GoalTemplate>;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

const MS_PER_DAY = 86_400_000;

function generateId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    (b.getTime() - a.getTime()) / MS_PER_DAY,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute a linear trend direction from a series of data points.
 * Returns "improving", "stable", or "declining" based on the
 * slope of recent values.
 */
function computeTrend(
  dataPoints: readonly DataPoint[],
): "improving" | "stable" | "declining" {
  if (dataPoints.length < 2) {
    return "stable";
  }

  const recent = dataPoints.slice(-5);
  const firstValue = recent[0].value;
  const lastValue = recent[recent.length - 1].value;

  if (firstValue === 0) {
    return lastValue > 0 ? "improving" : "stable";
  }

  const changePercent =
    ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

  if (changePercent > 2) {
    return "improving";
  }
  if (changePercent < -2) {
    return "declining";
  }
  return "stable";
}

/**
 * Build evenly-spaced milestones between the start value
 * and the target value across the goal duration.
 */
function buildMilestones(
  startValue: number,
  targetValue: number,
  startDate: Date,
  deadline: Date,
  count: number,
): readonly Milestone[] {
  if (count <= 0) {
    return [];
  }

  const totalDays = daysBetween(startDate, deadline);
  const valueStep = (targetValue - startValue) / (count + 1);
  const dayStep = totalDays / (count + 1);

  const milestones: Milestone[] = [];

  for (let i = 1; i <= count; i++) {
    const milestoneDate = new Date(
      startDate.getTime() + dayStep * i * MS_PER_DAY,
    );
    milestones.push({
      id: `ms_${i}_${Math.random().toString(36).slice(2, 7)}`,
      label: `Milestone ${i}`,
      targetValue: startValue + valueStep * i,
      targetDate: milestoneDate,
      completedAt: null,
      isCompleted: false,
    });
  }

  return milestones;
}

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Factory function to create a new Goal with target, deadline,
 * and auto-generated milestones.
 */
export function createGoal(params: {
  readonly title: string;
  readonly description?: string;
  readonly category: GoalCategory;
  readonly targetValue: number;
  readonly currentValue?: number;
  readonly unit?: string;
  readonly startDate?: Date;
  readonly deadline: Date;
  readonly milestoneCount?: number;
}): Goal {
  const now = new Date();
  const startDate = params.startDate ?? now;
  const currentValue = params.currentValue ?? 0;
  const milestoneCount = params.milestoneCount ?? 3;
  const unit = params.unit ?? "units";

  const milestones = buildMilestones(
    currentValue,
    params.targetValue,
    startDate,
    params.deadline,
    milestoneCount,
  );

  return {
    id: generateId(),
    title: params.title,
    description: params.description ?? "",
    category: params.category,
    status: "not_started",
    startDate,
    deadline: params.deadline,
    targetValue: params.targetValue,
    currentValue,
    unit,
    milestones,
    dataPoints: currentValue > 0
      ? [{ date: now, value: currentValue }]
      : [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate progress toward a goal including percentage,
 * trend, daily rate, and projected completion.
 */
export function calculateGoalProgress(goal: Goal): GoalProgress {
  const now = new Date();
  const daysElapsed = Math.max(1, daysBetween(goal.startDate, now));
  const daysRemaining = Math.max(0, daysBetween(now, goal.deadline));
  const totalDuration = daysBetween(goal.startDate, goal.deadline);

  const valueProgress = goal.currentValue - (goal.dataPoints.length > 0
    ? goal.dataPoints[0].value
    : 0);

  const dailyRate = daysElapsed > 0 ? valueProgress / daysElapsed : 0;

  const percentage = goal.targetValue !== 0
    ? clamp((goal.currentValue / goal.targetValue) * 100, 0, 100)
    : 0;

  const trend = computeTrend(goal.dataPoints);

  const remaining = goal.targetValue - goal.currentValue;
  let projectedCompletionDate: Date | null = null;

  if (dailyRate > 0 && remaining > 0) {
    const daysToComplete = remaining / dailyRate;
    projectedCompletionDate = new Date(
      now.getTime() + daysToComplete * MS_PER_DAY,
    );
  } else if (remaining <= 0) {
    projectedCompletionDate = now;
  }

  const expectedProgress = totalDuration > 0
    ? (daysElapsed / totalDuration) * 100
    : 100;
  const onTrack = percentage >= expectedProgress * 0.85;

  return {
    currentValue: goal.currentValue,
    targetValue: goal.targetValue,
    percentage: Math.round(percentage * 100) / 100,
    trend,
    dailyRate: Math.round(dailyRate * 1000) / 1000,
    projectedCompletionDate,
    isOnTrack: onTrack,
    daysRemaining,
    daysElapsed,
  };
}

/**
 * Determine if the current pace will meet the deadline.
 * Returns true if the projected completion date is on or
 * before the goal deadline.
 */
export function isOnTrack(goal: Goal): boolean {
  if (goal.status === "completed") {
    return true;
  }
  if (goal.status === "abandoned") {
    return false;
  }

  const progress = calculateGoalProgress(goal);

  if (progress.projectedCompletionDate === null) {
    return progress.percentage >= 100;
  }

  return progress.projectedCompletionDate.getTime() <= goal.deadline.getTime();
}

/**
 * Estimate when the goal will be reached at the current pace.
 * Returns null if no progress has been made or the rate is zero.
 */
export function projectCompletionDate(goal: Goal): Date | null {
  if (goal.currentValue >= goal.targetValue) {
    return new Date();
  }

  const progress = calculateGoalProgress(goal);
  return progress.projectedCompletionDate;
}

/* ------------------------------------------------------------------ */
/*  Reporting                                                          */
/* ------------------------------------------------------------------ */

/**
 * Derive a display-ready GoalStatus from current progress data.
 */
function deriveStatus(goal: Goal): GoalStatus {
  if (goal.status === "completed" || goal.status === "abandoned") {
    return goal.status;
  }

  const progress = calculateGoalProgress(goal);

  if (progress.percentage >= 100) {
    return "completed";
  }
  if (progress.daysRemaining <= 0) {
    return "behind";
  }
  if (progress.percentage === 0 && progress.daysElapsed <= 1) {
    return "not_started";
  }
  if (progress.isOnTrack) {
    return "on_track";
  }
  if (progress.percentage > 0 && progress.trend === "declining") {
    return "behind";
  }
  if (progress.percentage > 0) {
    return "at_risk";
  }
  return "in_progress";
}

/**
 * Generate a recommendation string for a single goal
 * based on its current progress.
 */
function recommendationForGoal(
  goal: Goal,
  progress: GoalProgress,
): string {
  const status = deriveStatus(goal);

  switch (status) {
    case "completed":
      return `"${goal.title}" is complete. Consider setting a stretch goal.`;
    case "behind":
      return (
        `"${goal.title}" is behind schedule. ` +
        `At the current rate of ${progress.dailyRate.toFixed(2)} ${goal.unit}/day, ` +
        `the deadline will be missed. Increase effort or adjust the target.`
      );
    case "at_risk":
      return (
        `"${goal.title}" is at risk. Progress is ${progress.percentage.toFixed(1)}% ` +
        `with ${progress.daysRemaining} days remaining. Review strategy.`
      );
    case "on_track":
      return `"${goal.title}" is on track at ${progress.percentage.toFixed(1)}% complete.`;
    case "not_started":
      return `"${goal.title}" has not started yet. Begin tracking progress.`;
    case "abandoned":
      return `"${goal.title}" was abandoned. Consider whether to revisit or replace.`;
    default:
      return `"${goal.title}" is in progress at ${progress.percentage.toFixed(1)}%.`;
  }
}

/**
 * Generate a comprehensive report across all goals with
 * status breakdowns, a health score, and recommendations.
 */
export function generateGoalReport(
  goals: readonly Goal[],
): GoalReport {
  if (goals.length === 0) {
    return {
      totalGoals: 0,
      completed: 0,
      onTrack: 0,
      atRisk: 0,
      behind: 0,
      notStarted: 0,
      overallHealthScore: 0,
      goalSummaries: [],
      recommendations: [
        "No goals have been set. Start by creating goals aligned with your business priorities.",
      ],
    };
  }

  let completed = 0;
  let onTrack = 0;
  let atRisk = 0;
  let behind = 0;
  let notStarted = 0;

  const goalSummaries: GoalSummary[] = [];
  const recommendations: string[] = [];

  for (const goal of goals) {
    const progress = calculateGoalProgress(goal);
    const status = deriveStatus(goal);
    const rec = recommendationForGoal(goal, progress);

    switch (status) {
      case "completed":
        completed++;
        break;
      case "on_track":
        onTrack++;
        break;
      case "at_risk":
        atRisk++;
        break;
      case "behind":
        behind++;
        break;
      case "not_started":
        notStarted++;
        break;
    }

    goalSummaries.push({
      goalId: goal.id,
      title: goal.title,
      category: goal.category,
      status,
      progressPercentage: progress.percentage,
      daysRemaining: progress.daysRemaining,
      recommendation: rec,
    });

    if (status === "behind" || status === "at_risk") {
      recommendations.push(rec);
    }
  }

  const activeGoals = goals.length - notStarted;
  const healthyGoals = completed + onTrack;
  const overallHealthScore = activeGoals > 0
    ? Math.round((healthyGoals / activeGoals) * 100)
    : 0;

  if (behind > 0) {
    recommendations.push(
      `${behind} goal(s) are behind schedule. Prioritize these or adjust deadlines.`,
    );
  }
  if (notStarted > goals.length * 0.5) {
    recommendations.push(
      "More than half of your goals have not started. Focus on activation.",
    );
  }
  if (completed === goals.length) {
    recommendations.push(
      "All goals are complete. Set new, more ambitious targets.",
    );
  }

  return {
    totalGoals: goals.length,
    completed,
    onTrack,
    atRisk,
    behind,
    notStarted,
    overallHealthScore,
    goalSummaries,
    recommendations,
  };
}

/* ------------------------------------------------------------------ */
/*  Goal Suggestions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Recommend goals based on current performance metrics
 * and optional industry benchmarks.
 */
export function suggestGoals(
  performance: CurrentPerformance,
  benchmarks?: IndustryBenchmarks,
): readonly GoalSuggestion[] {
  const suggestions: GoalSuggestion[] = [];

  // Revenue suggestions
  if (performance.mrr !== undefined) {
    const benchmarkMrr = benchmarks?.averageMrr ?? performance.mrr * 1.5;
    if (performance.mrr < benchmarkMrr) {
      suggestions.push({
        template: GOAL_TEMPLATES.revenue_mrr,
        reason:
          `Current MRR ($${performance.mrr}) is below the benchmark ($${benchmarkMrr}). ` +
          "Growing recurring revenue should be a top priority.",
        priority: "high",
        suggestedTarget: Math.round(benchmarkMrr),
      });
    }
    suggestions.push({
      template: GOAL_TEMPLATES.revenue_growth,
      reason: "Consistent revenue growth is essential for sustainability.",
      priority: performance.mrr < 5000 ? "high" : "medium",
      suggestedTarget: 25,
    });
  }

  // Lead suggestions
  if (performance.monthlyLeads !== undefined) {
    const benchmarkLeads =
      benchmarks?.averageLeadsPerMonth ?? performance.monthlyLeads * 1.5;
    if (performance.monthlyLeads < benchmarkLeads) {
      suggestions.push({
        template: GOAL_TEMPLATES.leads_monthly,
        reason:
          `Current lead volume (${performance.monthlyLeads}/month) ` +
          `is below benchmark (${benchmarkLeads}/month).`,
        priority: "high",
        suggestedTarget: Math.round(benchmarkLeads),
      });
    }
  }

  if (performance.conversionRate !== undefined) {
    const benchmarkRate =
      benchmarks?.averageConversionRate ?? 5;
    if (performance.conversionRate < benchmarkRate) {
      suggestions.push({
        template: GOAL_TEMPLATES.leads_conversion,
        reason:
          `Conversion rate (${performance.conversionRate}%) is below ` +
          `industry benchmark (${benchmarkRate}%).`,
        priority: "high",
        suggestedTarget: benchmarkRate,
      });
    }
  }

  // Review suggestions
  if (performance.averageRating !== undefined) {
    const benchmarkRating = benchmarks?.averageReviewRating ?? 4.5;
    if (performance.averageRating < benchmarkRating) {
      suggestions.push({
        template: GOAL_TEMPLATES.reviews_rating,
        reason:
          `Average rating (${performance.averageRating}) is below ` +
          `the target of ${benchmarkRating} stars.`,
        priority: performance.averageRating < 4.0 ? "high" : "medium",
        suggestedTarget: benchmarkRating,
      });
    }
  }

  if (performance.monthlyReviews !== undefined && performance.monthlyReviews < 20) {
    suggestions.push({
      template: GOAL_TEMPLATES.reviews_volume,
      reason:
        `Only ${performance.monthlyReviews} reviews per month. ` +
        "More reviews build trust and improve local SEO.",
      priority: "medium",
      suggestedTarget: 20,
    });
  }

  // SEO suggestions
  if (performance.keywordRankings !== undefined && performance.keywordRankings < 5) {
    suggestions.push({
      template: GOAL_TEMPLATES.seo_rankings,
      reason:
        `Only ${performance.keywordRankings} keywords ranking #1. ` +
        "Improving keyword rankings drives sustainable organic traffic.",
      priority: "medium",
      suggestedTarget: Math.max(5, performance.keywordRankings * 2),
    });
  }

  if (performance.organicTraffic !== undefined) {
    const benchmarkTraffic =
      benchmarks?.averageOrganicTraffic ?? performance.organicTraffic * 1.5;
    if (performance.organicTraffic < benchmarkTraffic) {
      suggestions.push({
        template: GOAL_TEMPLATES.seo_traffic,
        reason:
          "Organic traffic growth compounds over time and reduces " +
          "dependency on paid channels.",
        priority: "medium",
        suggestedTarget: 50,
      });
    }
  }

  // Booking suggestions
  if (performance.weeklyBookings !== undefined) {
    const benchmarkBookings =
      benchmarks?.averageBookingsPerWeek ?? 15;
    if (performance.weeklyBookings < benchmarkBookings) {
      suggestions.push({
        template: GOAL_TEMPLATES.bookings_weekly,
        reason:
          `Current bookings (${performance.weeklyBookings}/week) are below ` +
          `benchmark (${benchmarkBookings}/week).`,
        priority: "high",
        suggestedTarget: benchmarkBookings,
      });
    }
  }

  if (performance.noShowRate !== undefined && performance.noShowRate > 5) {
    suggestions.push({
      template: GOAL_TEMPLATES.bookings_noshow,
      reason:
        `No-show rate of ${performance.noShowRate}% is above the ` +
        "acceptable threshold of 5%. Reducing no-shows directly increases revenue.",
      priority: performance.noShowRate > 15 ? "high" : "medium",
      suggestedTarget: 5,
    });
  }

  // Engagement suggestions
  if (performance.emailOpenRate !== undefined) {
    const benchmarkOpenRate =
      benchmarks?.averageEmailOpenRate ?? 25;
    if (performance.emailOpenRate < benchmarkOpenRate) {
      suggestions.push({
        template: GOAL_TEMPLATES.engagement_email,
        reason:
          `Email open rate (${performance.emailOpenRate}%) is below ` +
          `benchmark (${benchmarkOpenRate}%). Better subject lines and ` +
          "segmentation can improve engagement.",
        priority: "medium",
        suggestedTarget: benchmarkOpenRate,
      });
    }
  }

  if (performance.socialFollowing !== undefined && performance.socialFollowing < 1000) {
    suggestions.push({
      template: GOAL_TEMPLATES.engagement_social,
      reason:
        `Social following (${performance.socialFollowing}) is still small. ` +
        "Growing your audience amplifies every other marketing effort.",
      priority: "low",
      suggestedTarget: 25,
    });
  }

  // Sort by priority: high > medium > low
  const priorityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...suggestions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
}
