/**
 * Customer journey mapping utility for tracking lifecycle stages.
 *
 * Pure logic for reconstructing customer journeys from event history,
 * identifying funnel positions, and recommending next actions.
 * No database calls.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type JourneyStageName =
  | "awareness"
  | "interest"
  | "consideration"
  | "intent"
  | "evaluation"
  | "purchase"
  | "retention"
  | "advocacy";

export interface JourneyStage {
  readonly name: JourneyStageName;
  readonly label: string;
  readonly order: number;
  readonly description: string;
}

export interface JourneyEvent {
  readonly customerId: string;
  readonly eventType: string;
  readonly timestamp: Date;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface Touchpoint {
  readonly eventType: string;
  readonly stage: JourneyStageName;
  readonly label: string;
  readonly weight: number;
}

export interface JourneyMap {
  readonly customerId: string;
  readonly events: readonly JourneyEvent[];
  readonly stages: readonly JourneyStageEntry[];
  readonly currentStage: JourneyStageName;
  readonly firstSeen: Date;
  readonly lastSeen: Date;
}

export interface JourneyStageEntry {
  readonly stage: JourneyStageName;
  readonly enteredAt: Date;
  readonly exitedAt: Date | null;
  readonly events: readonly JourneyEvent[];
}

export interface StageDuration {
  readonly stage: JourneyStageName;
  readonly durationMs: number;
  readonly durationDays: number;
}

export interface DropoffPoint {
  readonly stage: JourneyStageName;
  readonly nextStage: JourneyStageName;
  readonly dropoffRate: number;
  readonly customersEntered: number;
  readonly customersExited: number;
}

export interface NextActionRecommendation {
  readonly currentStage: JourneyStageName;
  readonly recommendedTouchpoint: string;
  readonly targetStage: JourneyStageName;
  readonly rationale: string;
}

export interface ConversionFunnel {
  readonly stages: readonly FunnelStageMetric[];
  readonly overallConversionRate: number;
  readonly totalCustomers: number;
}

export interface FunnelStageMetric {
  readonly stage: JourneyStageName;
  readonly customersAtStage: number;
  readonly conversionRateToNext: number | null;
  readonly cumulativeConversionRate: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const JOURNEY_STAGES: readonly JourneyStage[] = [
  {
    name: "awareness",
    label: "Awareness",
    order: 0,
    description: "Customer becomes aware of the brand or product.",
  },
  {
    name: "interest",
    label: "Interest",
    order: 1,
    description: "Customer shows interest by engaging with content.",
  },
  {
    name: "consideration",
    label: "Consideration",
    order: 2,
    description: "Customer actively researches and compares options.",
  },
  {
    name: "intent",
    label: "Intent",
    order: 3,
    description: "Customer signals purchase intent through actions.",
  },
  {
    name: "evaluation",
    label: "Evaluation",
    order: 4,
    description: "Customer evaluates the product via trials or demos.",
  },
  {
    name: "purchase",
    label: "Purchase",
    order: 5,
    description: "Customer completes a purchase transaction.",
  },
  {
    name: "retention",
    label: "Retention",
    order: 6,
    description: "Customer continues using the product post-purchase.",
  },
  {
    name: "advocacy",
    label: "Advocacy",
    order: 7,
    description: "Customer recommends the product to others.",
  },
] as const;

export const TOUCHPOINTS: readonly Touchpoint[] = [
  { eventType: "ad_click", stage: "awareness", label: "Ad Click", weight: 1 },
  {
    eventType: "social_impression",
    stage: "awareness",
    label: "Social Impression",
    weight: 0.5,
  },
  {
    eventType: "organic_search",
    stage: "awareness",
    label: "Organic Search",
    weight: 0.8,
  },
  {
    eventType: "blog_visit",
    stage: "interest",
    label: "Blog Visit",
    weight: 1,
  },
  {
    eventType: "email_open",
    stage: "interest",
    label: "Email Open",
    weight: 0.7,
  },
  {
    eventType: "webinar_register",
    stage: "interest",
    label: "Webinar Registration",
    weight: 1.2,
  },
  {
    eventType: "pricing_page_view",
    stage: "consideration",
    label: "Pricing Page View",
    weight: 1,
  },
  {
    eventType: "comparison_page_view",
    stage: "consideration",
    label: "Comparison Page View",
    weight: 1.1,
  },
  {
    eventType: "case_study_view",
    stage: "consideration",
    label: "Case Study View",
    weight: 0.9,
  },
  {
    eventType: "form_submit",
    stage: "intent",
    label: "Form Submit",
    weight: 1.5,
  },
  {
    eventType: "demo_request",
    stage: "intent",
    label: "Demo Request",
    weight: 1.8,
  },
  {
    eventType: "cart_add",
    stage: "intent",
    label: "Add to Cart",
    weight: 1.3,
  },
  {
    eventType: "free_trial_start",
    stage: "evaluation",
    label: "Free Trial Start",
    weight: 1.5,
  },
  {
    eventType: "product_demo",
    stage: "evaluation",
    label: "Product Demo",
    weight: 1.4,
  },
  {
    eventType: "feature_usage",
    stage: "evaluation",
    label: "Feature Usage",
    weight: 1,
  },
  {
    eventType: "purchase_complete",
    stage: "purchase",
    label: "Purchase Complete",
    weight: 2,
  },
  {
    eventType: "subscription_start",
    stage: "purchase",
    label: "Subscription Start",
    weight: 2,
  },
  {
    eventType: "repeat_purchase",
    stage: "retention",
    label: "Repeat Purchase",
    weight: 1.5,
  },
  {
    eventType: "support_ticket",
    stage: "retention",
    label: "Support Ticket",
    weight: 0.5,
  },
  {
    eventType: "feature_adoption",
    stage: "retention",
    label: "Feature Adoption",
    weight: 1.2,
  },
  {
    eventType: "referral_sent",
    stage: "advocacy",
    label: "Referral Sent",
    weight: 2,
  },
  {
    eventType: "review_submitted",
    stage: "advocacy",
    label: "Review Submitted",
    weight: 1.8,
  },
  {
    eventType: "social_share",
    stage: "advocacy",
    label: "Social Share",
    weight: 1,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

const STAGE_ORDER_MAP: ReadonlyMap<JourneyStageName, number> = new Map(
  JOURNEY_STAGES.map((s) => [s.name, s.order]),
);

const TOUCHPOINT_MAP: ReadonlyMap<string, Touchpoint> = new Map(
  TOUCHPOINTS.map((t) => [t.eventType, t]),
);

const STAGE_NAMES_ORDERED: readonly JourneyStageName[] = JOURNEY_STAGES.map(
  (s) => s.name,
);

function getStageOrder(stage: JourneyStageName): number {
  return STAGE_ORDER_MAP.get(stage) ?? -1;
}

function resolveStageForEvent(event: JourneyEvent): JourneyStageName | null {
  const touchpoint = TOUCHPOINT_MAP.get(event.eventType);
  return touchpoint?.stage ?? null;
}

function sortEventsByTimestamp(
  events: readonly JourneyEvent[],
): readonly JourneyEvent[] {
  return [...events].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
}

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Reconstruct a customer's journey from their event history.
 *
 * Groups events into stage entries ordered chronologically and
 * determines the overall journey map including current stage.
 */
export function mapJourneyFromEvents(
  customerId: string,
  events: readonly JourneyEvent[],
): JourneyMap | null {
  if (events.length === 0) {
    return null;
  }

  const sorted = sortEventsByTimestamp(events);
  const stageEntries: JourneyStageEntry[] = [];
  let currentStageName: JourneyStageName | null = null;
  let currentStageEvents: JourneyEvent[] = [];
  let currentStageEnteredAt: Date | null = null;

  for (const event of sorted) {
    const stage = resolveStageForEvent(event);
    if (stage === null) {
      continue;
    }

    if (stage !== currentStageName) {
      if (currentStageName !== null && currentStageEnteredAt !== null) {
        stageEntries.push({
          stage: currentStageName,
          enteredAt: currentStageEnteredAt,
          exitedAt: event.timestamp,
          events: [...currentStageEvents],
        });
      }
      currentStageName = stage;
      currentStageEnteredAt = event.timestamp;
      currentStageEvents = [event];
    } else {
      currentStageEvents.push(event);
    }
  }

  if (currentStageName !== null && currentStageEnteredAt !== null) {
    stageEntries.push({
      stage: currentStageName,
      enteredAt: currentStageEnteredAt,
      exitedAt: null,
      events: [...currentStageEvents],
    });
  }

  if (stageEntries.length === 0) {
    return null;
  }

  const firstSeen = sorted[0].timestamp;
  const lastSeen = sorted[sorted.length - 1].timestamp;

  return {
    customerId,
    events: sorted,
    stages: stageEntries,
    currentStage: stageEntries[stageEntries.length - 1].stage,
    firstSeen,
    lastSeen,
  };
}

/**
 * Determine the highest-order stage a customer has reached.
 *
 * Unlike `JourneyMap.currentStage` (which reflects the latest event),
 * this returns the furthest stage the customer has progressed to.
 */
export function identifyCurrentStage(
  events: readonly JourneyEvent[],
): JourneyStageName | null {
  let highestOrder = -1;
  let highestStage: JourneyStageName | null = null;

  for (const event of events) {
    const stage = resolveStageForEvent(event);
    if (stage === null) {
      continue;
    }
    const order = getStageOrder(stage);
    if (order > highestOrder) {
      highestOrder = order;
      highestStage = stage;
    }
  }

  return highestStage;
}

/**
 * Calculate the duration a customer spent in each journey stage.
 *
 * Uses a completed JourneyMap. Stages still in progress use the
 * current time as the end boundary.
 */
export function calculateStageDuration(
  journeyMap: JourneyMap,
): readonly StageDuration[] {
  const now = new Date();
  const MS_PER_DAY = 86_400_000;

  return journeyMap.stages.map((entry) => {
    const end = entry.exitedAt ?? now;
    const durationMs = end.getTime() - entry.enteredAt.getTime();
    return {
      stage: entry.stage,
      durationMs,
      durationDays: durationMs / MS_PER_DAY,
    };
  });
}

/**
 * Identify stages where customers are dropping out of the funnel.
 *
 * Accepts multiple journey maps (one per customer) and computes
 * the drop-off rate between consecutive stages.
 */
export function findDropoffPoints(
  journeyMaps: readonly JourneyMap[],
): readonly DropoffPoint[] {
  if (journeyMaps.length === 0) {
    return [];
  }

  const stageReachCounts = new Map<JourneyStageName, number>();
  for (const stage of STAGE_NAMES_ORDERED) {
    stageReachCounts.set(stage, 0);
  }

  for (const journey of journeyMaps) {
    const reachedStages = new Set<JourneyStageName>();
    for (const event of journey.events) {
      const stage = resolveStageForEvent(event);
      if (stage !== null) {
        reachedStages.add(stage);
        const order = getStageOrder(stage);
        for (const s of STAGE_NAMES_ORDERED) {
          if (getStageOrder(s) <= order) {
            reachedStages.add(s);
          }
        }
      }
    }
    for (const stage of reachedStages) {
      stageReachCounts.set(
        stage,
        (stageReachCounts.get(stage) ?? 0) + 1,
      );
    }
  }

  const dropoffs: DropoffPoint[] = [];
  for (let i = 0; i < STAGE_NAMES_ORDERED.length - 1; i++) {
    const current = STAGE_NAMES_ORDERED[i];
    const next = STAGE_NAMES_ORDERED[i + 1];
    const entered = stageReachCounts.get(current) ?? 0;
    const exited = stageReachCounts.get(next) ?? 0;

    const dropoffRate = entered > 0 ? 1 - exited / entered : 0;

    dropoffs.push({
      stage: current,
      nextStage: next,
      dropoffRate,
      customersEntered: entered,
      customersExited: exited,
    });
  }

  return dropoffs;
}

/**
 * Recommend the best next touchpoint to advance a customer.
 *
 * Based on the customer's current stage, suggests the highest-weight
 * touchpoint from the next stage to drive progression.
 */
export function suggestNextAction(
  currentStage: JourneyStageName,
): NextActionRecommendation | null {
  const currentOrder = getStageOrder(currentStage);
  const nextStageIndex = currentOrder + 1;

  if (nextStageIndex >= STAGE_NAMES_ORDERED.length) {
    return null;
  }

  const targetStage = STAGE_NAMES_ORDERED[nextStageIndex];
  const candidates = TOUCHPOINTS.filter((t) => t.stage === targetStage);

  if (candidates.length === 0) {
    return null;
  }

  const best = candidates.reduce((a, b) => (b.weight > a.weight ? b : a));

  const stageLabel =
    JOURNEY_STAGES.find((s) => s.name === targetStage)?.label ?? targetStage;

  return {
    currentStage,
    recommendedTouchpoint: best.eventType,
    targetStage,
    rationale:
      `Move customer from ${currentStage} to ${stageLabel} ` +
      `via "${best.label}" (weight: ${best.weight}).`,
  };
}

/**
 * Calculate conversion rates between each funnel stage.
 *
 * Accepts multiple journey maps and produces aggregate metrics
 * including per-stage counts, stage-to-stage conversion, and
 * overall funnel conversion rate.
 */
export function calculateFunnelMetrics(
  journeyMaps: readonly JourneyMap[],
): ConversionFunnel {
  const totalCustomers = journeyMaps.length;

  if (totalCustomers === 0) {
    return {
      stages: STAGE_NAMES_ORDERED.map((stage) => ({
        stage,
        customersAtStage: 0,
        conversionRateToNext: null,
        cumulativeConversionRate: 0,
      })),
      overallConversionRate: 0,
      totalCustomers: 0,
    };
  }

  const stageReachCounts = new Map<JourneyStageName, number>();
  for (const stage of STAGE_NAMES_ORDERED) {
    stageReachCounts.set(stage, 0);
  }

  for (const journey of journeyMaps) {
    const highestOrder = Math.max(
      ...journey.events
        .map((e) => resolveStageForEvent(e))
        .filter((s): s is JourneyStageName => s !== null)
        .map((s) => getStageOrder(s)),
    );

    for (const stage of STAGE_NAMES_ORDERED) {
      if (getStageOrder(stage) <= highestOrder) {
        stageReachCounts.set(
          stage,
          (stageReachCounts.get(stage) ?? 0) + 1,
        );
      }
    }
  }

  const stageMetrics: FunnelStageMetric[] = STAGE_NAMES_ORDERED.map(
    (stage, idx) => {
      const atStage = stageReachCounts.get(stage) ?? 0;
      const nextStage = STAGE_NAMES_ORDERED[idx + 1];
      const atNextStage = nextStage
        ? (stageReachCounts.get(nextStage) ?? 0)
        : null;

      const conversionRateToNext =
        atNextStage !== null && atStage > 0 ? atNextStage / atStage : null;

      const cumulativeConversionRate =
        totalCustomers > 0 ? atStage / totalCustomers : 0;

      return {
        stage,
        customersAtStage: atStage,
        conversionRateToNext,
        cumulativeConversionRate,
      };
    },
  );

  const firstStageCount = stageReachCounts.get("awareness") ?? 0;
  const lastStageCount = stageReachCounts.get("advocacy") ?? 0;
  const overallConversionRate =
    firstStageCount > 0 ? lastStageCount / firstStageCount : 0;

  return {
    stages: stageMetrics,
    overallConversionRate,
    totalCustomers,
  };
}
