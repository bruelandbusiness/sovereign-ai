/**
 * Subscription status state machine.
 *
 * Validates that subscription status transitions follow the allowed
 * directed graph. Invalid transitions are caught before they reach
 * the database, preventing data-integrity issues such as a canceled
 * subscription silently flipping back to active without going through
 * the proper reactivation flow.
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "paused"
  | "expired";

/**
 * Directed graph of valid status transitions.
 *
 * active     -> past_due, canceled, paused, expired
 * past_due   -> active, canceled, expired
 * canceled   -> active  (reactivation only)
 * paused     -> active, canceled
 * expired    -> active  (reactivation only)
 */
const VALID_TRANSITIONS: Readonly<
  Record<SubscriptionStatus, readonly SubscriptionStatus[]>
> = {
  active: ["past_due", "canceled", "paused", "expired"],
  past_due: ["active", "canceled", "expired"],
  canceled: ["active"],
  paused: ["active", "canceled"],
  expired: ["active"],
} as const;

const ALL_STATUSES = new Set<string>(Object.keys(VALID_TRANSITIONS));

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return ALL_STATUSES.has(value);
}

/**
 * Returns true when transitioning from `currentStatus` to `newStatus`
 * is allowed by the state machine. A no-op transition (same status)
 * is always considered valid.
 */
export function canTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  if (currentStatus === newStatus) return true;

  if (!isSubscriptionStatus(currentStatus) || !isSubscriptionStatus(newStatus)) {
    return false;
  }

  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Throws an error when the requested transition is invalid.
 * Use this in code paths where an invalid transition must be
 * treated as a hard failure.
 */
export function validateTransition(
  currentStatus: string,
  newStatus: string,
): void {
  if (!canTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid subscription status transition: "${currentStatus}" -> "${newStatus}". ` +
        `Allowed transitions from "${currentStatus}": [${getValidNextStatuses(currentStatus).join(", ")}]`,
    );
  }
}

/**
 * Returns the list of statuses reachable from `currentStatus`.
 * Returns an empty array for unknown statuses.
 */
export function getValidNextStatuses(currentStatus: string): string[] {
  if (!isSubscriptionStatus(currentStatus)) return [];
  return [...VALID_TRANSITIONS[currentStatus]];
}

/**
 * Warns (via Sentry + logger) when a transition is invalid but
 * does NOT throw, so the Stripe webhook can continue processing.
 *
 * Returns `true` when the transition is valid, `false` otherwise.
 */
export function warnOnInvalidTransition(
  currentStatus: string,
  newStatus: string,
  context?: Record<string, unknown>,
): boolean {
  if (canTransition(currentStatus, newStatus)) return true;

  const message =
    `Invalid subscription status transition: "${currentStatus}" -> "${newStatus}". ` +
    `Allowed: [${getValidNextStatuses(currentStatus).join(", ")}]`;

  logger.warn(`[subscription-state] ${message}`, context);
  Sentry.captureMessage(
    `${message} | context: ${JSON.stringify({ currentStatus, newStatus, ...context })}`,
    "warning",
  );

  return false;
}
