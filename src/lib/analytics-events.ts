/**
 * Analytics event tracking utility.
 *
 * Provides type-safe event creation, validation, batching,
 * and engagement scoring. No actual tracking SDK calls are made.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type EventCategory =
  | "Page"
  | "Auth"
  | "Dashboard"
  | "Lead"
  | "Service"
  | "Billing"
  | "Support"
  | "Marketing";

export type EventAction =
  | "page_view"
  | "page_exit"
  | "scroll_depth"
  | "login"
  | "logout"
  | "signup"
  | "magic_link_sent"
  | "widget_interaction"
  | "filter_change"
  | "date_range_change"
  | "export_clicked"
  | "lead_viewed"
  | "lead_contacted"
  | "lead_converted"
  | "lead_scored"
  | "service_activated"
  | "service_configured"
  | "service_paused"
  | "checkout_started"
  | "checkout_completed"
  | "plan_changed"
  | "payment_method_updated"
  | "help_article_viewed"
  | "support_ticket_created"
  | "chatbot_interaction"
  | "email_opened"
  | "email_clicked"
  | "campaign_viewed";

export interface EventProperties {
  readonly [key: string]: string | number | boolean | null;
}

export interface UserProperties {
  readonly userId: string;
  readonly email?: string;
  readonly plan?: string;
  readonly createdAt?: string;
  readonly role?: string;
  readonly [key: string]: string | undefined;
}

export interface AnalyticsEvent {
  readonly id: string;
  readonly category: EventCategory;
  readonly action: EventAction;
  readonly timestamp: string;
  readonly sessionId: string;
  readonly userId: string;
  readonly properties: EventProperties;
  readonly userProperties?: UserProperties;
}

/* ------------------------------------------------------------------ */
/*  Event Catalog                                                      */
/* ------------------------------------------------------------------ */

interface CatalogEntry {
  readonly action: EventAction;
  readonly description: string;
}

type EventCatalog = Readonly<Record<EventCategory, readonly CatalogEntry[]>>;

export const EVENT_CATALOG: EventCatalog = {
  Page: [
    { action: "page_view", description: "User viewed a page" },
    { action: "page_exit", description: "User exited a page" },
    { action: "scroll_depth", description: "User scrolled to a depth threshold" },
  ],
  Auth: [
    { action: "login", description: "User logged in" },
    { action: "logout", description: "User logged out" },
    { action: "signup", description: "User signed up" },
    { action: "magic_link_sent", description: "Magic link email was sent" },
  ],
  Dashboard: [
    { action: "widget_interaction", description: "User interacted with a dashboard widget" },
    { action: "filter_change", description: "User changed a dashboard filter" },
    { action: "date_range_change", description: "User changed the date range" },
    { action: "export_clicked", description: "User clicked an export button" },
  ],
  Lead: [
    { action: "lead_viewed", description: "User viewed a lead profile" },
    { action: "lead_contacted", description: "User contacted a lead" },
    { action: "lead_converted", description: "Lead was converted to a customer" },
    { action: "lead_scored", description: "Lead score was calculated" },
  ],
  Service: [
    { action: "service_activated", description: "User activated a service" },
    { action: "service_configured", description: "User configured a service" },
    { action: "service_paused", description: "User paused a service" },
  ],
  Billing: [
    { action: "checkout_started", description: "User started checkout" },
    { action: "checkout_completed", description: "User completed checkout" },
    { action: "plan_changed", description: "User changed their plan" },
    { action: "payment_method_updated", description: "User updated payment method" },
  ],
  Support: [
    { action: "help_article_viewed", description: "User viewed a help article" },
    { action: "support_ticket_created", description: "User created a support ticket" },
    { action: "chatbot_interaction", description: "User interacted with the chatbot" },
  ],
  Marketing: [
    { action: "email_opened", description: "User opened a marketing email" },
    { action: "email_clicked", description: "User clicked a link in an email" },
    { action: "campaign_viewed", description: "User viewed a campaign page" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}_${random}`;
}

function isValidAction(action: string): action is EventAction {
  return Object.values(EVENT_CATALOG).some((entries) =>
    entries.some((entry) => entry.action === action),
  );
}

function getCategoryForAction(action: EventAction): EventCategory | null {
  for (const [category, entries] of Object.entries(EVENT_CATALOG)) {
    if (entries.some((entry) => entry.action === action)) {
      return category as EventCategory;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Validation Result                                                  */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/* ------------------------------------------------------------------ */
/*  Event Batch                                                        */
/* ------------------------------------------------------------------ */

export interface EventBatch {
  readonly id: string;
  readonly events: readonly AnalyticsEvent[];
  readonly createdAt: string;
  readonly size: number;
}

/* ------------------------------------------------------------------ */
/*  Engagement Score                                                   */
/* ------------------------------------------------------------------ */

export interface EngagementScore {
  readonly score: number;
  readonly level: "low" | "medium" | "high";
  readonly breakdown: Readonly<Record<EventCategory, number>>;
  readonly totalEvents: number;
  readonly uniqueActions: number;
}

/* ------------------------------------------------------------------ */
/*  createEvent()                                                      */
/* ------------------------------------------------------------------ */

/**
 * Factory function that creates a fully formed AnalyticsEvent.
 *
 * @param action - The event action from the catalog.
 * @param userId - The ID of the user who triggered the event.
 * @param sessionId - The current session ID.
 * @param properties - Optional extra properties for the event.
 * @param userProperties - Optional user-level properties.
 * @returns A new immutable AnalyticsEvent.
 */
export function createEvent(
  action: EventAction,
  userId: string,
  sessionId: string,
  properties: EventProperties = {},
  userProperties?: UserProperties,
): AnalyticsEvent {
  const category = getCategoryForAction(action);
  if (category === null) {
    throw new Error(`Unknown event action: ${action}`);
  }

  return {
    id: generateId(),
    category,
    action,
    timestamp: new Date().toISOString(),
    sessionId,
    userId,
    properties,
    userProperties,
  };
}

/* ------------------------------------------------------------------ */
/*  validateEvent()                                                    */
/* ------------------------------------------------------------------ */

/**
 * Validates that an event has all required properties and correct values.
 *
 * @param event - The event object to validate.
 * @returns A ValidationResult with a list of errors (empty if valid).
 */
export function validateEvent(event: Partial<AnalyticsEvent>): ValidationResult {
  const errors: string[] = [];

  if (!event.id || typeof event.id !== "string") {
    errors.push("Event must have a non-empty string 'id'.");
  }
  if (!event.category || typeof event.category !== "string") {
    errors.push("Event must have a non-empty string 'category'.");
  }
  if (!event.action || typeof event.action !== "string") {
    errors.push("Event must have a non-empty string 'action'.");
  } else if (!isValidAction(event.action)) {
    errors.push(`Unknown event action: '${event.action}'.`);
  }
  if (!event.timestamp || typeof event.timestamp !== "string") {
    errors.push("Event must have a non-empty string 'timestamp'.");
  } else if (Number.isNaN(Date.parse(event.timestamp))) {
    errors.push("Event 'timestamp' must be a valid ISO 8601 date string.");
  }
  if (!event.sessionId || typeof event.sessionId !== "string") {
    errors.push("Event must have a non-empty string 'sessionId'.");
  }
  if (!event.userId || typeof event.userId !== "string") {
    errors.push("Event must have a non-empty string 'userId'.");
  }
  if (event.properties !== undefined && typeof event.properties !== "object") {
    errors.push("Event 'properties' must be an object when provided.");
  }

  return { valid: errors.length === 0, errors };
}

/* ------------------------------------------------------------------ */
/*  batchEvents()                                                      */
/* ------------------------------------------------------------------ */

/**
 * Groups an array of events into batches of a given size
 * for efficient batch submission.
 *
 * @param events - The events to batch.
 * @param maxBatchSize - Maximum events per batch (default 50).
 * @returns An array of EventBatch objects.
 */
export function batchEvents(
  events: readonly AnalyticsEvent[],
  maxBatchSize: number = 50,
): readonly EventBatch[] {
  if (maxBatchSize < 1) {
    throw new Error("maxBatchSize must be at least 1.");
  }

  const batches: EventBatch[] = [];

  for (let i = 0; i < events.length; i += maxBatchSize) {
    const slice = events.slice(i, i + maxBatchSize);
    batches.push({
      id: generateId(),
      events: slice,
      createdAt: new Date().toISOString(),
      size: slice.length,
    });
  }

  return batches;
}

/* ------------------------------------------------------------------ */
/*  calculateEngagementScore()                                         */
/* ------------------------------------------------------------------ */

/**
 * Engagement weight per category. Higher-value actions receive
 * more weight when computing the overall engagement score.
 */
const CATEGORY_WEIGHTS: Readonly<Record<EventCategory, number>> = {
  Page: 1,
  Auth: 2,
  Dashboard: 3,
  Lead: 5,
  Service: 5,
  Billing: 8,
  Support: 2,
  Marketing: 1,
};

/**
 * Calculates an engagement score (0-100) from a user's event history.
 *
 * Scoring factors:
 *  - Weighted sum of events by category.
 *  - Bonus for breadth of unique actions.
 *
 * @param events - The user's event history.
 * @returns An EngagementScore with a numeric score, level, and breakdown.
 */
export function calculateEngagementScore(
  events: readonly AnalyticsEvent[],
): EngagementScore {
  const breakdown: Record<EventCategory, number> = {
    Page: 0,
    Auth: 0,
    Dashboard: 0,
    Lead: 0,
    Service: 0,
    Billing: 0,
    Support: 0,
    Marketing: 0,
  };

  const uniqueActions = new Set<EventAction>();

  for (const event of events) {
    breakdown[event.category] += 1;
    uniqueActions.add(event.action);
  }

  let weightedSum = 0;
  for (const [category, count] of Object.entries(breakdown)) {
    weightedSum += count * CATEGORY_WEIGHTS[category as EventCategory];
  }

  const totalPossibleActions = Object.values(EVENT_CATALOG).reduce(
    (sum, entries) => sum + entries.length,
    0,
  );
  const breadthBonus = (uniqueActions.size / totalPossibleActions) * 20;

  const rawScore = Math.min(weightedSum + breadthBonus, 100);
  const score = Math.round(rawScore * 100) / 100;

  let level: "low" | "medium" | "high";
  if (score < 30) {
    level = "low";
  } else if (score < 70) {
    level = "medium";
  } else {
    level = "high";
  }

  return {
    score,
    level,
    breakdown,
    totalEvents: events.length,
    uniqueActions: uniqueActions.size,
  };
}

/* ------------------------------------------------------------------ */
/*  getEventsByTimeRange()                                             */
/* ------------------------------------------------------------------ */

/**
 * Filters events to those whose timestamp falls within the given
 * start and end dates (inclusive).
 *
 * @param events - The full list of events to filter.
 * @param start - Start of the range (inclusive).
 * @param end - End of the range (inclusive).
 * @returns A new array containing only events within the range.
 */
export function getEventsByTimeRange(
  events: readonly AnalyticsEvent[],
  start: Date,
  end: Date,
): readonly AnalyticsEvent[] {
  if (start > end) {
    throw new Error("'start' date must not be after 'end' date.");
  }

  const startMs = start.getTime();
  const endMs = end.getTime();

  return events.filter((event) => {
    const eventMs = new Date(event.timestamp).getTime();
    return eventMs >= startMs && eventMs <= endMs;
  });
}
