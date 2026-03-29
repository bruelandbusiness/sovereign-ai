/**
 * Service-specific onboarding checklist system.
 *
 * Provides per-service onboarding steps, progress tracking, and
 * completion utilities. Pure functions with no database calls —
 * state is passed in and results are returned immutably.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepStatus = "not_started" | "in_progress" | "completed" | "skipped";

export interface OnboardingStep {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly order: number;
  /** Estimated time to complete this step, in minutes. */
  readonly estimatedMinutes: number;
  /** Whether this step can be skipped without blocking completion. */
  readonly optional: boolean;
}

export interface OnboardingChecklist {
  readonly serviceId: string;
  readonly serviceName: string;
  readonly steps: readonly OnboardingStep[];
}

export interface OnboardingProgress {
  readonly serviceId: string;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly skippedSteps: number;
  readonly percentComplete: number;
  readonly isComplete: boolean;
  readonly estimatedMinutesRemaining: number;
}

// ---------------------------------------------------------------------------
// Service checklists
// ---------------------------------------------------------------------------

export const SERVICE_CHECKLISTS: readonly OnboardingChecklist[] = [
  {
    serviceId: "chatbot",
    serviceName: "AI Chat Assistant",
    steps: [
      {
        id: "chatbot_business_info",
        label: "Provide Business Info",
        description:
          "Enter your business name, services, pricing, and service area so the chatbot can answer questions accurately.",
        order: 1,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "chatbot_configure_faqs",
        label: "Configure FAQs",
        description:
          "Add frequently asked questions and approved answers the chatbot should use.",
        order: 2,
        estimatedMinutes: 20,
        optional: false,
      },
      {
        id: "chatbot_set_tone",
        label: "Set Conversation Tone",
        description:
          "Choose the chatbot personality and tone of voice that matches your brand.",
        order: 3,
        estimatedMinutes: 5,
        optional: false,
      },
      {
        id: "chatbot_test_widget",
        label: "Test Chat Widget",
        description:
          "Preview the chatbot on a test page and verify it answers correctly.",
        order: 4,
        estimatedMinutes: 10,
        optional: false,
      },
      {
        id: "chatbot_deploy",
        label: "Deploy to Website",
        description:
          "Install the chat widget snippet on your live website.",
        order: 5,
        estimatedMinutes: 10,
        optional: false,
      },
    ],
  },
  {
    serviceId: "reviews",
    serviceName: "AI Review Management",
    steps: [
      {
        id: "reviews_connect_google",
        label: "Connect Google Business Profile",
        description:
          "Link your Google Business Profile so reviews can be monitored and responded to automatically.",
        order: 1,
        estimatedMinutes: 10,
        optional: false,
      },
      {
        id: "reviews_auto_response_rules",
        label: "Set Auto-Response Rules",
        description:
          "Configure rules for automatically responding to positive, neutral, and negative reviews.",
        order: 2,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "reviews_request_triggers",
        label: "Configure Review Request Triggers",
        description:
          "Set up automated review request messages sent after service completion.",
        order: 3,
        estimatedMinutes: 10,
        optional: false,
      },
    ],
  },
  {
    serviceId: "content",
    serviceName: "AI Content Engine",
    steps: [
      {
        id: "content_brand_voice",
        label: "Define Brand Voice",
        description:
          "Describe your brand tone, style preferences, and any words or phrases to use or avoid.",
        order: 1,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "content_select_topics",
        label: "Select Topics",
        description:
          "Choose content topics and categories relevant to your business and audience.",
        order: 2,
        estimatedMinutes: 10,
        optional: false,
      },
      {
        id: "content_approve_first_batch",
        label: "Approve First Batch",
        description:
          "Review and approve the first set of AI-generated content before it goes live.",
        order: 3,
        estimatedMinutes: 20,
        optional: false,
      },
      {
        id: "content_publishing_schedule",
        label: "Set Publishing Schedule",
        description:
          "Configure how often and when content should be published.",
        order: 4,
        estimatedMinutes: 5,
        optional: false,
      },
    ],
  },
  {
    serviceId: "email",
    serviceName: "AI Email Marketing",
    steps: [
      {
        id: "email_import_contacts",
        label: "Import Contacts",
        description:
          "Upload your contact list or connect your CRM to import existing contacts.",
        order: 1,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "email_design_template",
        label: "Design Email Template",
        description:
          "Customize your email template with brand colors, logo, and layout preferences.",
        order: 2,
        estimatedMinutes: 20,
        optional: false,
      },
      {
        id: "email_first_campaign",
        label: "Create First Campaign",
        description:
          "Draft and send your first email campaign to a selected audience segment.",
        order: 3,
        estimatedMinutes: 25,
        optional: false,
      },
      {
        id: "email_configure_automations",
        label: "Configure Automations",
        description:
          "Set up automated email sequences for welcome series, follow-ups, and re-engagement.",
        order: 4,
        estimatedMinutes: 15,
        optional: false,
      },
    ],
  },
  {
    serviceId: "ads",
    serviceName: "AI Ad Management",
    steps: [
      {
        id: "ads_connect_accounts",
        label: "Connect Google & Meta Accounts",
        description:
          "Link your Google Ads and Meta (Facebook/Instagram) advertising accounts.",
        order: 1,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "ads_set_budget",
        label: "Set Advertising Budget",
        description:
          "Define your monthly ad spend budget and how it should be allocated across platforms.",
        order: 2,
        estimatedMinutes: 10,
        optional: false,
      },
      {
        id: "ads_define_audience",
        label: "Define Target Audience",
        description:
          "Specify your ideal customer demographics, interests, and geographic targeting.",
        order: 3,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "ads_first_campaign",
        label: "Create First Campaign",
        description:
          "Launch your first ad campaign with AI-optimized copy and targeting.",
        order: 4,
        estimatedMinutes: 20,
        optional: false,
      },
    ],
  },
  {
    serviceId: "seo",
    serviceName: "AI SEO Domination",
    steps: [
      {
        id: "seo_audit_site",
        label: "Audit Current Site",
        description:
          "Run a comprehensive SEO audit to identify technical issues and content gaps.",
        order: 1,
        estimatedMinutes: 10,
        optional: false,
      },
      {
        id: "seo_keyword_research",
        label: "Keyword Research",
        description:
          "Identify high-intent keywords for your market, services, and service area.",
        order: 2,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "seo_optimize_pages",
        label: "Optimize Pages",
        description:
          "Apply on-page SEO improvements to titles, meta descriptions, and content.",
        order: 3,
        estimatedMinutes: 20,
        optional: false,
      },
      {
        id: "seo_setup_tracking",
        label: "Set Up Tracking",
        description:
          "Connect Google Search Console and analytics to monitor rankings and traffic.",
        order: 4,
        estimatedMinutes: 10,
        optional: false,
      },
    ],
  },
  {
    serviceId: "voice-agent",
    serviceName: "AI Voice Agents",
    steps: [
      {
        id: "voice_record_greeting",
        label: "Record Greeting",
        description:
          "Record or configure the greeting message callers hear when the AI answers.",
        order: 1,
        estimatedMinutes: 10,
        optional: false,
      },
      {
        id: "voice_call_routing",
        label: "Configure Call Routing",
        description:
          "Set up routing rules for transferring calls to team members or departments.",
        order: 2,
        estimatedMinutes: 15,
        optional: false,
      },
      {
        id: "voice_business_hours",
        label: "Set Business Hours",
        description:
          "Define your business hours and after-hours handling preferences.",
        order: 3,
        estimatedMinutes: 5,
        optional: false,
      },
      {
        id: "voice_test_calls",
        label: "Test Calls",
        description:
          "Place test calls to verify the voice agent handles scenarios correctly.",
        order: 4,
        estimatedMinutes: 10,
        optional: false,
      },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Return the onboarding checklist for a given service ID,
 * or `null` if no checklist exists for that service.
 */
export function getChecklistForService(
  serviceId: string,
): OnboardingChecklist | null {
  return (
    SERVICE_CHECKLISTS.find((c) => c.serviceId === serviceId) ?? null
  );
}

// ---------------------------------------------------------------------------
// Progress calculations
// ---------------------------------------------------------------------------

/**
 * Calculate the onboarding progress for a service given a map of step
 * statuses. Steps not present in the map are treated as `"not_started"`.
 *
 * Only required (non-optional) steps count toward completion percentage.
 * Unknown step IDs in `stepStatuses` are silently ignored.
 */
export function calculateOnboardingProgress(
  serviceId: string,
  stepStatuses: Readonly<Record<string, StepStatus>>,
): OnboardingProgress | null {
  const checklist = getChecklistForService(serviceId);
  if (checklist === null) {
    return null;
  }

  const requiredSteps = checklist.steps.filter((s) => !s.optional);
  const totalSteps = requiredSteps.length;

  let completedSteps = 0;
  let skippedSteps = 0;

  for (const step of checklist.steps) {
    const status = stepStatuses[step.id];
    if (status === "completed") {
      if (!step.optional) {
        completedSteps += 1;
      }
    } else if (status === "skipped") {
      skippedSteps += 1;
    }
  }

  const percentComplete =
    totalSteps === 0 ? 100 : Math.round((completedSteps / totalSteps) * 100);

  const minutesRemaining = estimateTimeRemaining(serviceId, stepStatuses);

  return {
    serviceId,
    totalSteps,
    completedSteps,
    skippedSteps,
    percentComplete,
    isComplete: completedSteps >= totalSteps,
    estimatedMinutesRemaining: minutesRemaining ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

/**
 * Return the next incomplete, non-skipped step in the checklist, or
 * `null` when every required step is completed.
 */
export function getNextIncompleteStep(
  serviceId: string,
  stepStatuses: Readonly<Record<string, StepStatus>>,
): OnboardingStep | null {
  const checklist = getChecklistForService(serviceId);
  if (checklist === null) {
    return null;
  }

  const sorted = [...checklist.steps].sort((a, b) => a.order - b.order);

  for (const step of sorted) {
    const status = stepStatuses[step.id];
    if (status !== "completed" && status !== "skipped") {
      return step;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Time estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the total minutes remaining based on the estimated time
 * of each incomplete, non-skipped step.
 *
 * Returns `null` if the service ID has no checklist.
 */
export function estimateTimeRemaining(
  serviceId: string,
  stepStatuses: Readonly<Record<string, StepStatus>>,
): number | null {
  const checklist = getChecklistForService(serviceId);
  if (checklist === null) {
    return null;
  }

  let minutes = 0;
  for (const step of checklist.steps) {
    const status = stepStatuses[step.id];
    if (status === "completed" || status === "skipped") {
      continue;
    }
    // Count half time for in-progress steps.
    if (status === "in_progress") {
      minutes += Math.ceil(step.estimatedMinutes / 2);
    } else {
      minutes += step.estimatedMinutes;
    }
  }

  return minutes;
}

// ---------------------------------------------------------------------------
// Completion check
// ---------------------------------------------------------------------------

/**
 * Check whether all required (non-optional) steps for a service are
 * completed. Returns `false` if the service ID has no checklist.
 */
export function isOnboardingComplete(
  serviceId: string,
  stepStatuses: Readonly<Record<string, StepStatus>>,
): boolean {
  const checklist = getChecklistForService(serviceId);
  if (checklist === null) {
    return false;
  }

  return checklist.steps
    .filter((s) => !s.optional)
    .every((s) => stepStatuses[s.id] === "completed");
}
