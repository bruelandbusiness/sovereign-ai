/**
 * Centralized onboarding progress tracking.
 *
 * Defines the canonical lifecycle milestones a client passes through,
 * from account creation to full platform adoption.  Consumed by both
 * the dashboard checklist UI and the server-side checklist API.
 */

export const ONBOARDING_STEPS = [
  { id: "account_created", label: "Account Created", order: 1 },
  { id: "subscription_active", label: "Subscription Active", order: 2 },
  { id: "services_selected", label: "Services Selected", order: 3 },
  { id: "gbp_connected", label: "Google Business Profile Connected", order: 4 },
  { id: "first_lead_received", label: "First Lead Received", order: 5 },
  { id: "dashboard_visited", label: "Dashboard Visited", order: 6 },
  { id: "team_invited", label: "Team Members Invited", order: 7 },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

/**
 * Return the completion percentage (0-100) given a list of completed
 * step ids.  Unknown ids are silently ignored so stale client data
 * does not inflate the number.
 */
export function getCompletionPercentage(completedSteps: string[]): number {
  const validIds = new Set<string>(ONBOARDING_STEPS.map((s) => s.id));
  const validCompleted = completedSteps.filter((id) => validIds.has(id));
  return Math.round((validCompleted.length / ONBOARDING_STEPS.length) * 100);
}

/**
 * Return the next incomplete step in order, or `null` when every step
 * has been completed.
 */
export function getNextStep(
  completedSteps: string[],
): (typeof ONBOARDING_STEPS)[number] | null {
  const done = new Set(completedSteps);
  return ONBOARDING_STEPS.find((s) => !done.has(s.id)) ?? null;
}

/**
 * Return all steps that have not yet been completed, in order.
 */
export function getRemainingSteps(
  completedSteps: string[],
): (typeof ONBOARDING_STEPS)[number][] {
  const done = new Set(completedSteps);
  return ONBOARDING_STEPS.filter((s) => !done.has(s.id));
}

/**
 * Check whether every onboarding step has been completed.
 */
export function isOnboardingComplete(completedSteps: string[]): boolean {
  const done = new Set(completedSteps);
  return ONBOARDING_STEPS.every((s) => done.has(s.id));
}
