/**
 * Workflow automation engine utility.
 * Pure logic module — no side effects, no database calls, no execution.
 */

/* ------------------------------------------------------------------ */
/*  Type Definitions                                                   */
/* ------------------------------------------------------------------ */

export type TriggerType =
  | "event"
  | "schedule"
  | "threshold"
  | "time_based";

export type ActionType =
  | "send_sms"
  | "send_email"
  | "send_notification"
  | "generate_report"
  | "update_record"
  | "create_task"
  | "webhook";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty";

export type DelayUnit =
  | "minutes"
  | "hours"
  | "days"
  | "weeks";

export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived";

export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkflowTrigger {
  readonly id: string;
  readonly type: TriggerType;
  readonly event?: string;
  readonly schedule?: string;
  readonly description: string;
  readonly config: Readonly<Record<string, unknown>>;
}

export interface WorkflowCondition {
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value: unknown;
}

export interface WorkflowAction {
  readonly id: string;
  readonly type: ActionType;
  readonly label: string;
  readonly config: Readonly<Record<string, unknown>>;
}

export interface DelaySpec {
  readonly amount: number;
  readonly unit: DelayUnit;
}

export interface WorkflowStep {
  readonly id: string;
  readonly order: number;
  readonly label: string;
  readonly action: WorkflowAction;
  readonly conditions: readonly WorkflowCondition[];
  readonly delay?: DelaySpec;
  readonly nextStepId?: string;
  readonly onFailureStepId?: string;
}

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: WorkflowStatus;
  readonly trigger: WorkflowTrigger;
  readonly steps: readonly WorkflowStep[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly tags: readonly string[];
  readonly estimatedImpact?: WorkflowImpact;
}

export interface WorkflowExecution {
  readonly id: string;
  readonly workflowId: string;
  readonly status: ExecutionStatus;
  readonly currentStepId: string | null;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly error: string | null;
  readonly context: Readonly<Record<string, unknown>>;
  readonly stepResults: readonly StepResult[];
}

export interface StepResult {
  readonly stepId: string;
  readonly status: ExecutionStatus;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly output: Readonly<Record<string, unknown>>;
  readonly error: string | null;
}

export interface WorkflowImpact {
  readonly estimatedTimeSavedMinutes: number;
  readonly estimatedRevenueImpact: number;
  readonly estimatedEngagementLift: number;
  readonly category: "efficiency" | "revenue" | "retention" | "engagement";
  readonly confidence: "low" | "medium" | "high";
  readonly description: string;
}

export interface WorkflowValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/* ------------------------------------------------------------------ */
/*  Workflow Templates                                                 */
/* ------------------------------------------------------------------ */

export const WORKFLOW_TEMPLATES: readonly Workflow[] = [
  {
    id: "tpl_new_lead_auto_response",
    name: "New Lead Auto-Response",
    description:
      "Automatically send an SMS and email when a new lead is created.",
    status: "draft",
    trigger: {
      id: "trg_lead_created",
      type: "event",
      event: "lead.created",
      description: "Fires when a new lead is created in the system.",
      config: {},
    },
    steps: [
      {
        id: "step_send_sms",
        order: 1,
        label: "Send welcome SMS",
        action: {
          id: "act_sms_welcome",
          type: "send_sms",
          label: "Send Welcome SMS",
          config: {
            template: "new_lead_welcome_sms",
            includeBusinessName: true,
          },
        },
        conditions: [],
      },
      {
        id: "step_send_email",
        order: 2,
        label: "Send welcome email",
        action: {
          id: "act_email_welcome",
          type: "send_email",
          label: "Send Welcome Email",
          config: {
            template: "new_lead_welcome_email",
            subject: "Thanks for reaching out!",
          },
        },
        conditions: [],
        nextStepId: undefined,
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["leads", "engagement", "auto-response"],
  },
  {
    id: "tpl_review_request_after_job",
    name: "Review Request After Job Completion",
    description:
      "Wait 2 hours after a job is completed, then send a review request.",
    status: "draft",
    trigger: {
      id: "trg_job_completed",
      type: "event",
      event: "job.completed",
      description: "Fires when a job is marked as completed.",
      config: {},
    },
    steps: [
      {
        id: "step_wait",
        order: 1,
        label: "Wait 2 hours",
        action: {
          id: "act_noop_wait",
          type: "send_notification",
          label: "Delay placeholder",
          config: { internal: true },
        },
        conditions: [],
        delay: { amount: 2, unit: "hours" },
        nextStepId: "step_send_review_request",
      },
      {
        id: "step_send_review_request",
        order: 2,
        label: "Send review request email",
        action: {
          id: "act_email_review",
          type: "send_email",
          label: "Send Review Request",
          config: {
            template: "review_request",
            subject: "How did we do? Leave a review!",
            includeReviewLink: true,
          },
        },
        conditions: [],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["reviews", "reputation", "post-job"],
  },
  {
    id: "tpl_payment_failed_followup",
    name: "Payment Failed Follow-Up",
    description:
      "Send an alert to admin and a retry notification to the client on payment failure.",
    status: "draft",
    trigger: {
      id: "trg_payment_failed",
      type: "event",
      event: "payment.failed",
      description: "Fires when a payment attempt fails.",
      config: {},
    },
    steps: [
      {
        id: "step_admin_alert",
        order: 1,
        label: "Alert admin of failed payment",
        action: {
          id: "act_notify_admin_payment",
          type: "send_notification",
          label: "Admin Payment Alert",
          config: {
            channel: "admin",
            priority: "high",
            template: "payment_failed_admin",
          },
        },
        conditions: [],
        nextStepId: "step_client_retry",
      },
      {
        id: "step_client_retry",
        order: 2,
        label: "Notify client to retry payment",
        action: {
          id: "act_email_retry",
          type: "send_email",
          label: "Payment Retry Notification",
          config: {
            template: "payment_retry",
            subject: "Action required: update your payment method",
            includePaymentLink: true,
          },
        },
        conditions: [],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["billing", "payments", "alerts"],
  },
  {
    id: "tpl_inactive_client_reengagement",
    name: "Inactive Client Re-Engagement",
    description:
      "Send a re-engagement email when a client has not logged in for 14 days.",
    status: "draft",
    trigger: {
      id: "trg_inactive_14_days",
      type: "time_based",
      event: "client.inactive",
      description: "Fires when a client has not logged in for 14 days.",
      config: { inactiveDays: 14 },
    },
    steps: [
      {
        id: "step_reengagement_email",
        order: 1,
        label: "Send re-engagement email",
        action: {
          id: "act_email_reengage",
          type: "send_email",
          label: "Re-Engagement Email",
          config: {
            template: "client_reengagement",
            subject: "We miss you! Here's what's new",
            includeSpecialOffer: true,
          },
        },
        conditions: [
          {
            field: "client.daysSinceLastLogin",
            operator: "greater_than_or_equal",
            value: 14,
          },
        ],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["retention", "engagement", "email"],
  },
  {
    id: "tpl_lead_scoring_notification",
    name: "Lead Scoring Notification",
    description:
      "Notify the sales team when a lead score exceeds 80.",
    status: "draft",
    trigger: {
      id: "trg_lead_score_high",
      type: "threshold",
      event: "lead.score_updated",
      description: "Fires when a lead score is updated.",
      config: { field: "lead.score", threshold: 80 },
    },
    steps: [
      {
        id: "step_notify_sales",
        order: 1,
        label: "Notify sales team of hot lead",
        action: {
          id: "act_notify_sales",
          type: "send_notification",
          label: "Hot Lead Alert",
          config: {
            channel: "sales",
            priority: "high",
            template: "hot_lead_alert",
            includeLeadDetails: true,
          },
        },
        conditions: [
          {
            field: "lead.score",
            operator: "greater_than",
            value: 80,
          },
        ],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["leads", "sales", "scoring"],
  },
  {
    id: "tpl_monthly_report_generation",
    name: "Monthly Report Generation",
    description:
      "Generate and send a monthly business report on the 1st of each month.",
    status: "draft",
    trigger: {
      id: "trg_first_of_month",
      type: "schedule",
      schedule: "0 8 1 * *",
      description: "Fires at 8 AM on the 1st of every month.",
      config: { timezone: "America/New_York" },
    },
    steps: [
      {
        id: "step_generate_report",
        order: 1,
        label: "Generate monthly report",
        action: {
          id: "act_generate_report",
          type: "generate_report",
          label: "Generate Monthly Report",
          config: {
            reportType: "monthly_summary",
            includeSections: [
              "revenue",
              "leads",
              "jobs",
              "reviews",
              "growth",
            ],
          },
        },
        conditions: [],
        nextStepId: "step_send_report",
      },
      {
        id: "step_send_report",
        order: 2,
        label: "Email report to stakeholders",
        action: {
          id: "act_email_report",
          type: "send_email",
          label: "Send Monthly Report",
          config: {
            template: "monthly_report",
            subject: "Your Monthly Business Report",
            recipientGroup: "stakeholders",
            attachReport: true,
          },
        },
        conditions: [],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["reports", "analytics", "scheduled"],
  },
  {
    id: "tpl_service_health_alert",
    name: "Service Health Alert",
    description:
      "Alert administrators when a service health score drops below 50.",
    status: "draft",
    trigger: {
      id: "trg_health_low",
      type: "threshold",
      event: "service.health_updated",
      description: "Fires when service health score is updated.",
      config: { field: "service.healthScore", threshold: 50 },
    },
    steps: [
      {
        id: "step_admin_health_alert",
        order: 1,
        label: "Send admin health alert",
        action: {
          id: "act_notify_admin_health",
          type: "send_notification",
          label: "Service Health Alert",
          config: {
            channel: "admin",
            priority: "critical",
            template: "service_health_alert",
            includeHealthMetrics: true,
          },
        },
        conditions: [
          {
            field: "service.healthScore",
            operator: "less_than",
            value: 50,
          },
        ],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["monitoring", "alerts", "health"],
  },
  {
    id: "tpl_upsell_opportunity",
    name: "Upsell Opportunity",
    description:
      "Suggest an upgrade when a client reaches 90 days and uses only a single service.",
    status: "draft",
    trigger: {
      id: "trg_client_90_days",
      type: "time_based",
      event: "client.milestone",
      description: "Fires when a client reaches 90 days.",
      config: { milestoneDays: 90 },
    },
    steps: [
      {
        id: "step_upsell_email",
        order: 1,
        label: "Send upsell suggestion email",
        action: {
          id: "act_email_upsell",
          type: "send_email",
          label: "Upsell Suggestion Email",
          config: {
            template: "upsell_opportunity",
            subject: "Unlock more value — upgrade your plan",
            includeUpgradeOptions: true,
          },
        },
        conditions: [
          {
            field: "client.accountAgeDays",
            operator: "greater_than_or_equal",
            value: 90,
          },
          {
            field: "client.activeServiceCount",
            operator: "equals",
            value: 1,
          },
        ],
      },
    ],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    tags: ["upsell", "revenue", "retention"],
  },
];

/* ------------------------------------------------------------------ */
/*  Core Functions                                                     */
/* ------------------------------------------------------------------ */

/**
 * Evaluate whether a single workflow condition is met against
 * a provided context object.
 *
 * @param condition - The condition to evaluate.
 * @param context   - A flat key-value map of current data values.
 * @returns true if the condition is satisfied, false otherwise.
 */
export function evaluateCondition(
  condition: WorkflowCondition,
  context: Readonly<Record<string, unknown>>,
): boolean {
  const actual = resolveField(condition.field, context);
  const expected = condition.value;

  switch (condition.operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "greater_than":
      return toNumber(actual) > toNumber(expected);
    case "less_than":
      return toNumber(actual) < toNumber(expected);
    case "greater_than_or_equal":
      return toNumber(actual) >= toNumber(expected);
    case "less_than_or_equal":
      return toNumber(actual) <= toNumber(expected);
    case "contains":
      return toString(actual).includes(toString(expected));
    case "not_contains":
      return !toString(actual).includes(toString(expected));
    case "is_empty":
      return actual === null || actual === undefined || actual === "";
    case "is_not_empty":
      return actual !== null && actual !== undefined && actual !== "";
    default:
      return false;
  }
}

/**
 * Determine the next step in a workflow given the current step and
 * execution context.
 *
 * Returns null when the workflow is complete (no further steps).
 *
 * @param workflow    - The full workflow definition.
 * @param currentStep - The step that just completed (or null to start).
 * @param context     - Current execution data for condition evaluation.
 * @param stepFailed  - Whether the current step failed.
 */
export function getNextStep(
  workflow: Workflow,
  currentStep: WorkflowStep | null,
  context: Readonly<Record<string, unknown>>,
  stepFailed: boolean = false,
): WorkflowStep | null {
  if (currentStep === null) {
    const sorted = sortStepsByOrder(workflow.steps);
    return sorted.length > 0 ? sorted[0] : null;
  }

  if (stepFailed && currentStep.onFailureStepId) {
    const failureStep = workflow.steps.find(
      (s) => s.id === currentStep.onFailureStepId,
    );
    return failureStep ?? null;
  }

  if (currentStep.nextStepId) {
    const explicit = workflow.steps.find(
      (s) => s.id === currentStep.nextStepId,
    );
    if (explicit) {
      const conditionsMet = explicit.conditions.every((c) =>
        evaluateCondition(c, context),
      );
      return conditionsMet ? explicit : null;
    }
    return null;
  }

  const sorted = sortStepsByOrder(workflow.steps);
  const currentIndex = sorted.findIndex((s) => s.id === currentStep.id);
  if (currentIndex === -1 || currentIndex >= sorted.length - 1) {
    return null;
  }

  const candidate = sorted[currentIndex + 1];
  const conditionsMet = candidate.conditions.every((c) =>
    evaluateCondition(c, context),
  );
  return conditionsMet ? candidate : null;
}

/**
 * Convert a delay specification to milliseconds.
 *
 * @param delay - The delay spec with amount and unit.
 * @returns Delay duration in milliseconds.
 */
export function calculateDelayMs(delay: DelaySpec): number {
  const multipliers: Readonly<Record<DelayUnit, number>> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  return delay.amount * multipliers[delay.unit];
}

/**
 * Validate that a workflow definition is structurally sound.
 *
 * Checks performed:
 * - Workflow has at least one step.
 * - All step IDs are unique.
 * - All nextStepId / onFailureStepId references point to existing steps.
 * - No circular step references.
 * - Trigger is present and has a type.
 * - Steps are ordered contiguously starting at 1.
 *
 * @param workflow - The workflow to validate.
 */
export function validateWorkflow(
  workflow: Workflow,
): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must have a name
  if (!workflow.name || workflow.name.trim().length === 0) {
    errors.push("Workflow must have a name.");
  }

  // Trigger validation
  if (!workflow.trigger) {
    errors.push("Workflow must have a trigger.");
  } else if (!workflow.trigger.type) {
    errors.push("Workflow trigger must have a type.");
  }

  // Must have at least one step
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push("Workflow must have at least one step.");
    return { valid: false, errors, warnings };
  }

  // Unique step IDs
  const stepIds = new Set<string>();
  for (const step of workflow.steps) {
    if (stepIds.has(step.id)) {
      errors.push(`Duplicate step ID: "${step.id}".`);
    }
    stepIds.add(step.id);
  }

  // Valid step references
  for (const step of workflow.steps) {
    if (step.nextStepId && !stepIds.has(step.nextStepId)) {
      errors.push(
        `Step "${step.id}" references unknown nextStepId "${step.nextStepId}".`,
      );
    }
    if (step.onFailureStepId && !stepIds.has(step.onFailureStepId)) {
      errors.push(
        `Step "${step.id}" references unknown onFailureStepId "${step.onFailureStepId}".`,
      );
    }
  }

  // Circular reference detection
  const circularError = detectCircularSteps(workflow.steps);
  if (circularError) {
    errors.push(circularError);
  }

  // Order contiguity check (warning, not error)
  const orders = workflow.steps.map((s) => s.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      warnings.push(
        "Step order values are not contiguous starting at 1. " +
          `Expected ${i + 1}, found ${orders[i]}.`,
      );
      break;
    }
  }

  // Delay validation
  for (const step of workflow.steps) {
    if (step.delay && step.delay.amount <= 0) {
      errors.push(
        `Step "${step.id}" has a non-positive delay amount.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Estimate the business impact of enabling a workflow.
 *
 * Uses heuristic scoring based on trigger type, number of steps,
 * action types, and workflow tags.
 *
 * @param workflow - The workflow to assess.
 * @returns Predicted impact assessment.
 */
export function estimateWorkflowImpact(workflow: Workflow): WorkflowImpact {
  const actionTypes = new Set(workflow.steps.map((s) => s.action.type));
  const tags = new Set(workflow.tags);

  // Base time saved: each step automates ~5 min of manual work
  const baseTimeSaved = workflow.steps.length * 5;

  // Bonus time for delayed steps (would require manual follow-up)
  const delayBonus = workflow.steps.filter((s) => s.delay).length * 10;

  const estimatedTimeSavedMinutes = baseTimeSaved + delayBonus;

  // Revenue impact heuristics
  let revenueMultiplier = 0;
  if (tags.has("upsell") || tags.has("revenue")) revenueMultiplier += 0.15;
  if (tags.has("leads") || tags.has("sales")) revenueMultiplier += 0.10;
  if (tags.has("retention")) revenueMultiplier += 0.08;
  if (tags.has("billing") || tags.has("payments")) revenueMultiplier += 0.05;

  // Engagement lift heuristics
  let engagementLift = 0;
  if (actionTypes.has("send_email")) engagementLift += 5;
  if (actionTypes.has("send_sms")) engagementLift += 8;
  if (actionTypes.has("send_notification")) engagementLift += 3;
  if (tags.has("engagement") || tags.has("retention")) engagementLift += 5;
  if (tags.has("reviews") || tags.has("reputation")) engagementLift += 7;

  // Determine primary category
  const category = categorizeWorkflow(tags, actionTypes);

  // Confidence based on specificity of conditions
  const totalConditions = workflow.steps.reduce(
    (sum, s) => sum + s.conditions.length,
    0,
  );
  const confidence: WorkflowImpact["confidence"] =
    totalConditions >= 2 ? "high" : totalConditions === 1 ? "medium" : "low";

  const description = buildImpactDescription(
    category,
    estimatedTimeSavedMinutes,
    engagementLift,
    revenueMultiplier,
  );

  return {
    estimatedTimeSavedMinutes,
    estimatedRevenueImpact: Math.round(revenueMultiplier * 100),
    estimatedEngagementLift: engagementLift,
    category,
    confidence,
    description,
  };
}

/* ------------------------------------------------------------------ */
/*  Internal Helpers                                                   */
/* ------------------------------------------------------------------ */

function resolveField(
  field: string,
  context: Readonly<Record<string, unknown>>,
): unknown {
  // Support dotted paths like "client.daysSinceLastLogin"
  if (field in context) {
    return context[field];
  }

  const parts = field.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function sortStepsByOrder(
  steps: readonly WorkflowStep[],
): readonly WorkflowStep[] {
  return [...steps].sort((a, b) => a.order - b.order);
}

/**
 * Detect circular references in step chains using visited-set traversal.
 * Returns an error message string if a cycle is found, or null otherwise.
 */
function detectCircularSteps(
  steps: readonly WorkflowStep[],
): string | null {
  const stepMap = new Map<string, WorkflowStep>();
  for (const step of steps) {
    stepMap.set(step.id, step);
  }

  for (const step of steps) {
    const visited = new Set<string>();
    let currentId: string | undefined = step.nextStepId;

    while (currentId) {
      if (visited.has(currentId)) {
        return (
          `Circular reference detected: step "${step.id}" ` +
          `eventually loops back through "${currentId}".`
        );
      }
      visited.add(currentId);
      const next = stepMap.get(currentId);
      currentId = next?.nextStepId;
    }
  }

  return null;
}

function categorizeWorkflow(
  tags: ReadonlySet<string>,
  actionTypes: ReadonlySet<ActionType>,
): WorkflowImpact["category"] {
  if (tags.has("upsell") || tags.has("revenue") || tags.has("billing")) {
    return "revenue";
  }
  if (tags.has("retention") || tags.has("engagement")) {
    return "retention";
  }
  if (
    tags.has("reviews") ||
    tags.has("reputation") ||
    actionTypes.has("send_sms") ||
    actionTypes.has("send_email")
  ) {
    return "engagement";
  }
  return "efficiency";
}

function buildImpactDescription(
  category: WorkflowImpact["category"],
  timeSaved: number,
  engagementLift: number,
  revenueMultiplier: number,
): string {
  const parts: string[] = [];

  parts.push(
    `Saves approximately ${timeSaved} minutes of manual work per trigger.`,
  );

  switch (category) {
    case "revenue":
      parts.push(
        `Estimated ${Math.round(revenueMultiplier * 100)}% revenue impact potential.`,
      );
      break;
    case "retention":
      parts.push(
        `Expected to improve client retention through proactive outreach.`,
      );
      break;
    case "engagement":
      parts.push(
        `Projected ${engagementLift}% engagement lift from automated touchpoints.`,
      );
      break;
    case "efficiency":
      parts.push(
        `Reduces operational overhead by automating repetitive tasks.`,
      );
      break;
  }

  return parts.join(" ");
}
