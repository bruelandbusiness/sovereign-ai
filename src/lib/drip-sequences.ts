/**
 * Email drip sequence engine utility.
 *
 * Pure-logic module for managing automated email drip sequences.
 * Determines which emails to send, when to send them, and tracks
 * progress through multi-step sequences. No database calls -- all
 * functions accept data as arguments and return computed results.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DripTrigger =
  | "signup"
  | "trial_start"
  | "inactivity"
  | "purchase"
  | "onboarding_start"
  | "plan_upgrade"
  | "milestone_reached";

export type DripStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export interface DripStep {
  /** Zero-based position within the sequence. */
  readonly index: number;
  /** Internal identifier for the step (e.g. "welcome-1"). */
  readonly stepId: string;
  /** Email subject line. */
  readonly subject: string;
  /** Brief description of the email content / purpose. */
  readonly description: string;
  /** Delay in days from enrollment date before this step fires. */
  readonly delayDays: number;
}

export interface DripSequence {
  /** Unique slug for the sequence. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** What triggers enrollment into this sequence. */
  readonly trigger: DripTrigger;
  /** Ordered list of emails in the sequence. */
  readonly steps: readonly DripStep[];
  /** Total span of the sequence in days. */
  readonly durationDays: number;
}

export interface EnrollmentRecord {
  /** Which sequence the client is enrolled in. */
  readonly sequenceId: string;
  /** ISO-8601 date string when the client was enrolled. */
  readonly enrolledAt: string;
  /** Index of the last step that was sent (or -1 if none sent). */
  readonly lastCompletedStepIndex: number;
  /** Current status of the enrollment. */
  readonly status: DripStatus;
}

export interface ClientProfile {
  /** Unique client identifier. */
  readonly clientId: string;
  /** Whether the client is on a trial plan. */
  readonly isTrial: boolean;
  /** Whether the client has an active paid subscription. */
  readonly isPaid: boolean;
  /** Days since last platform activity. */
  readonly daysSinceLastActive: number;
  /** ISO-8601 date string when the client signed up. */
  readonly signupDate: string;
  /** Number of services the client currently subscribes to. */
  readonly serviceCount: number;
  /** Whether onboarding setup is complete. */
  readonly onboardingComplete: boolean;
  /** Sequence IDs the client is already enrolled in. */
  readonly currentEnrollments: readonly string[];
}

// ---------------------------------------------------------------------------
// Constants -- Pre-built sequences
// ---------------------------------------------------------------------------

const welcomeSteps: readonly DripStep[] = [
  {
    index: 0,
    stepId: "welcome-1",
    subject: "Welcome to Sovereign AI!",
    description:
      "Introduction email with platform overview and quick-start link.",
    delayDays: 0,
  },
  {
    index: 1,
    stepId: "welcome-2",
    subject: "3 ways to get the most from your dashboard",
    description:
      "Highlights key dashboard features and links to tutorial videos.",
    delayDays: 2,
  },
  {
    index: 2,
    stepId: "welcome-3",
    subject: "Meet your AI marketing assistant",
    description:
      "Introduces AI-powered tools and suggests a first campaign.",
    delayDays: 5,
  },
  {
    index: 3,
    stepId: "welcome-4",
    subject: "How other home-service pros grew 40% in 90 days",
    description: "Case study showcasing successful client outcomes.",
    delayDays: 9,
  },
  {
    index: 4,
    stepId: "welcome-5",
    subject: "Your 14-day check-in: how can we help?",
    description:
      "Personal check-in asking for feedback and offering a strategy call.",
    delayDays: 14,
  },
] as const;

const trialToPaidSteps: readonly DripStep[] = [
  {
    index: 0,
    stepId: "trial-1",
    subject: "Your trial is underway -- here's what to try first",
    description:
      "Guides trial users to the highest-value features.",
    delayDays: 0,
  },
  {
    index: 1,
    stepId: "trial-2",
    subject: "Did you know? Your competitors are already using this",
    description:
      "Social proof email with industry adoption statistics.",
    delayDays: 2,
  },
  {
    index: 2,
    stepId: "trial-3",
    subject: "Your trial ends soon -- lock in your results",
    description:
      "Urgency email with summary of value delivered during trial.",
    delayDays: 5,
  },
  {
    index: 3,
    stepId: "trial-4",
    subject: "Last chance: exclusive offer inside",
    description:
      "Final conversion email with a limited-time discount or bonus.",
    delayDays: 7,
  },
] as const;

const reEngagementSteps: readonly DripStep[] = [
  {
    index: 0,
    stepId: "reengage-1",
    subject: "We miss you -- here's what's new",
    description:
      "Highlights new features and improvements since last login.",
    delayDays: 0,
  },
  {
    index: 1,
    stepId: "reengage-2",
    subject: "Your leads are waiting",
    description:
      "Shows pending leads or opportunities the client is missing.",
    delayDays: 4,
  },
  {
    index: 2,
    stepId: "reengage-3",
    subject: "Can we help? Free strategy session inside",
    description:
      "Offers a complimentary strategy call to re-activate the account.",
    delayDays: 10,
  },
] as const;

const upsellSteps: readonly DripStep[] = [
  {
    index: 0,
    stepId: "upsell-1",
    subject: "Unlock your next level of growth",
    description:
      "Overview of additional services that complement current plan.",
    delayDays: 0,
  },
  {
    index: 1,
    stepId: "upsell-2",
    subject: "How [Service X] doubled bookings for a client like you",
    description:
      "Case study focused on the recommended upsell service.",
    delayDays: 7,
  },
  {
    index: 2,
    stepId: "upsell-3",
    subject: "Bundle & save: add a service at 20% off",
    description:
      "Promotional offer for adding a complementary service.",
    delayDays: 14,
  },
  {
    index: 3,
    stepId: "upsell-4",
    subject: "Final reminder: your exclusive bundle offer expires soon",
    description:
      "Urgency follow-up for the bundle promotion.",
    delayDays: 21,
  },
] as const;

const onboardingSteps: readonly DripStep[] = [
  {
    index: 0,
    stepId: "onboard-1",
    subject: "Let's get you set up -- Step 1: Connect your calendar",
    description:
      "Guides client through calendar integration setup.",
    delayDays: 0,
  },
  {
    index: 1,
    stepId: "onboard-2",
    subject: "Step 2: Import your contacts",
    description:
      "Walks through CRM import and contact list upload.",
    delayDays: 3,
  },
  {
    index: 2,
    stepId: "onboard-3",
    subject: "Step 3: Customize your booking page",
    description:
      "Instructions for branding and configuring the booking page.",
    delayDays: 7,
  },
  {
    index: 3,
    stepId: "onboard-4",
    subject: "Step 4: Set up automated follow-ups",
    description:
      "Teaches the client to configure automated lead responses.",
    delayDays: 14,
  },
  {
    index: 4,
    stepId: "onboard-5",
    subject: "Step 5: Launch your first campaign",
    description:
      "Guided walkthrough for creating and sending a marketing campaign.",
    delayDays: 21,
  },
  {
    index: 5,
    stepId: "onboard-6",
    subject: "Setup complete! Here's your 30-day growth plan",
    description:
      "Congratulations email with a personalized 30-day action plan.",
    delayDays: 30,
  },
] as const;

export const SEQUENCES: readonly DripSequence[] = [
  {
    id: "welcome",
    name: "Welcome Series",
    trigger: "signup",
    steps: welcomeSteps,
    durationDays: 14,
  },
  {
    id: "trial-to-paid",
    name: "Trial-to-Paid Conversion",
    trigger: "trial_start",
    steps: trialToPaidSteps,
    durationDays: 7,
  },
  {
    id: "re-engagement",
    name: "Re-engagement Campaign",
    trigger: "inactivity",
    steps: reEngagementSteps,
    durationDays: 10,
  },
  {
    id: "upsell",
    name: "Upsell Series",
    trigger: "purchase",
    steps: upsellSteps,
    durationDays: 21,
  },
  {
    id: "onboarding",
    name: "Onboarding Milestones",
    trigger: "onboarding_start",
    steps: onboardingSteps,
    durationDays: 30,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(earlier: Date, later: Date): number {
  return Math.floor(
    (later.getTime() - earlier.getTime()) / MS_PER_DAY,
  );
}

function findSequenceById(
  sequenceId: string,
): DripSequence | undefined {
  return SEQUENCES.find((s) => s.id === sequenceId);
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Determine the next step to send in a sequence.
 *
 * Returns the next unsent step, or `null` if the sequence is fully
 * complete, paused, or cancelled.
 */
export function getNextStep(
  enrollment: EnrollmentRecord,
): DripStep | null {
  if (
    enrollment.status === "completed" ||
    enrollment.status === "cancelled" ||
    enrollment.status === "paused"
  ) {
    return null;
  }

  const sequence = findSequenceById(enrollment.sequenceId);
  if (!sequence) {
    return null;
  }

  const nextIndex = enrollment.lastCompletedStepIndex + 1;
  if (nextIndex >= sequence.steps.length) {
    return null;
  }

  return sequence.steps[nextIndex] ?? null;
}

/**
 * Check whether a specific step should be sent today.
 *
 * Compares the number of elapsed days since enrollment against the
 * step's configured delay. A step is due when the elapsed days are
 * greater than or equal to the step's `delayDays`.
 *
 * @param enrolledAt  ISO-8601 date string of enrollment.
 * @param step        The drip step to evaluate.
 * @param today       Optional override for "today" (defaults to now).
 */
export function shouldSendToday(
  enrolledAt: string,
  step: DripStep,
  today: Date = new Date(),
): boolean {
  const enrollDate = new Date(enrolledAt);
  if (isNaN(enrollDate.getTime())) {
    return false;
  }

  const elapsed = daysBetween(enrollDate, today);
  return elapsed >= step.delayDays;
}

/**
 * Calculate percentage progress through a sequence.
 *
 * Returns a value between 0 and 100, inclusive. A sequence with no
 * steps sent is 0 %; a fully completed sequence is 100 %.
 */
export function calculateSequenceProgress(
  enrollment: EnrollmentRecord,
): number {
  const sequence = findSequenceById(enrollment.sequenceId);
  if (!sequence || sequence.steps.length === 0) {
    return 0;
  }

  if (enrollment.status === "completed") {
    return 100;
  }

  const completedCount = enrollment.lastCompletedStepIndex + 1;
  const totalSteps = sequence.steps.length;

  const raw = (completedCount / totalSteps) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * Determine which sequences a client should be enrolled in based on
 * their current profile. Excludes sequences the client is already
 * enrolled in.
 */
export function getActiveSequences(
  client: ClientProfile,
): readonly DripSequence[] {
  const eligible: DripSequence[] = [];

  for (const sequence of SEQUENCES) {
    // Skip if already enrolled.
    if (client.currentEnrollments.includes(sequence.id)) {
      continue;
    }

    if (matchesTrigger(sequence, client)) {
      eligible.push(sequence);
    }
  }

  return eligible;
}

// ---------------------------------------------------------------------------
// Trigger matching
// ---------------------------------------------------------------------------

const INACTIVITY_THRESHOLD_DAYS = 14;
const UPSELL_MIN_SERVICES = 1;
const UPSELL_MAX_SERVICES = 3;

function matchesTrigger(
  sequence: DripSequence,
  client: ClientProfile,
): boolean {
  switch (sequence.trigger) {
    case "signup":
      return isRecentSignup(client);

    case "trial_start":
      return client.isTrial && !client.isPaid;

    case "inactivity":
      return (
        client.daysSinceLastActive >= INACTIVITY_THRESHOLD_DAYS
      );

    case "purchase":
      return (
        client.isPaid &&
        client.serviceCount >= UPSELL_MIN_SERVICES &&
        client.serviceCount <= UPSELL_MAX_SERVICES
      );

    case "onboarding_start":
      return !client.onboardingComplete;

    case "plan_upgrade":
    case "milestone_reached":
      return false;

    default: {
      const _exhaustive: never = sequence.trigger;
      return _exhaustive;
    }
  }
}

function isRecentSignup(client: ClientProfile): boolean {
  const signupDate = new Date(client.signupDate);
  if (isNaN(signupDate.getTime())) {
    return false;
  }
  const elapsed = daysBetween(signupDate, new Date());
  return elapsed <= 14;
}
