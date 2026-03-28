// ---------------------------------------------------------------------------
// Follow-up Sequence Definitions & Engagement-Triggered Acceleration Rules
// Derived from PLAYBOOKS.md specifications.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SequenceStep {
  day: number;
  channel: "email" | "sms" | "voice";
  template: string;
  condition:
    | "always"
    | "no_reply"
    | "email_not_opened"
    | "email_opened_no_reply"
    | "score_above_60_no_reply";
}

export interface SequenceDefinition {
  name: string;
  description: string;
  steps: SequenceStep[];
  maxAttempts: number;
  cooldownDays: number;
}

// ---------------------------------------------------------------------------
// Sequence Definitions
// ---------------------------------------------------------------------------

/**
 * 3 follow-up sequences:
 *
 * 1. "email_only"        — 4 steps, email-only, max 4 attempts, 90-day cooldown
 * 2. "email_sms"         — 6 steps with SMS on day 2 and 5, max 6 attempts, 90-day cooldown
 * 3. "full_multichannel" — 7 steps with voice on day 10 for score>60, max 7 attempts, 90-day cooldown
 */
export const SEQUENCES: Record<string, SequenceDefinition> = {
  email_only: {
    name: "Email Only",
    description:
      "Standard 4-touch email sequence for leads with email only. Opener, value bump, social proof, breakup.",
    steps: [
      {
        day: 0,
        channel: "email",
        template: "opener",
        condition: "always",
      },
      {
        day: 3,
        channel: "email",
        template: "value_bump",
        condition: "no_reply",
      },
      {
        day: 7,
        channel: "email",
        template: "social_proof",
        condition: "no_reply",
      },
      {
        day: 14,
        channel: "email",
        template: "breakup",
        condition: "email_opened_no_reply",
      },
    ],
    maxAttempts: 4,
    cooldownDays: 90,
  },

  email_sms: {
    name: "Email + SMS",
    description:
      "6-touch sequence blending email and SMS for leads with both channels. SMS on days 2 and 5 for higher engagement.",
    steps: [
      {
        day: 0,
        channel: "email",
        template: "opener",
        condition: "always",
      },
      {
        day: 2,
        channel: "sms",
        template: "first_contact",
        condition: "email_not_opened",
      },
      {
        day: 3,
        channel: "email",
        template: "value_bump",
        condition: "no_reply",
      },
      {
        day: 5,
        channel: "sms",
        template: "followup",
        condition: "email_opened_no_reply",
      },
      {
        day: 7,
        channel: "email",
        template: "social_proof",
        condition: "no_reply",
      },
      {
        day: 14,
        channel: "email",
        template: "breakup",
        condition: "no_reply",
      },
    ],
    maxAttempts: 6,
    cooldownDays: 90,
  },

  full_multichannel: {
    name: "Full Multichannel",
    description:
      "7-touch sequence across email, SMS, and voice. Voice call on day 10 only for leads scoring above 60. Maximum engagement cadence.",
    steps: [
      {
        day: 0,
        channel: "email",
        template: "opener",
        condition: "always",
      },
      {
        day: 2,
        channel: "sms",
        template: "first_contact",
        condition: "email_not_opened",
      },
      {
        day: 3,
        channel: "email",
        template: "value_bump",
        condition: "no_reply",
      },
      {
        day: 5,
        channel: "sms",
        template: "followup",
        condition: "email_opened_no_reply",
      },
      {
        day: 7,
        channel: "email",
        template: "social_proof",
        condition: "no_reply",
      },
      {
        day: 10,
        channel: "voice",
        template: "warm_call",
        condition: "score_above_60_no_reply",
      },
      {
        day: 14,
        channel: "email",
        template: "breakup",
        condition: "no_reply",
      },
    ],
    maxAttempts: 7,
    cooldownDays: 90,
  },
};

// ---------------------------------------------------------------------------
// Engagement-Triggered Acceleration
// ---------------------------------------------------------------------------

export type EngagementTrigger =
  | "opened_3x_no_reply"
  | "clicked_link"
  | "visited_website"
  | "replied_positive"
  | "replied_negative"
  | "replied_question"
  | "opted_out";

export interface TriggerAction {
  trigger: EngagementTrigger;
  action: string;
  reason: string;
  /** Whether the current sequence should be halted. */
  stopSequence: boolean;
  /** If set, immediately send via this channel outside the normal cadence. */
  sendImmediate?: "sms" | "email";
  /** Flag the contractor for manual follow-up. */
  alertContractor: boolean;
  /** Flag the Sovereign AI operator for review. */
  alertOperator: boolean;
  /** Suppress all future automated contact for this lead. */
  suppressContact: boolean;
  /** Permanently mark the lead as dead / do-not-contact. */
  markDead: boolean;
}

export const ENGAGEMENT_TRIGGERS: Record<EngagementTrigger, TriggerAction> = {
  opened_3x_no_reply: {
    trigger: "opened_3x_no_reply",
    action: "Accelerate next step and send SMS nudge",
    reason:
      "Lead has opened 3+ emails without replying, indicating interest but hesitation. An SMS nudge converts at 2-3x the rate of another email.",
    stopSequence: false,
    sendImmediate: "sms",
    alertContractor: false,
    alertOperator: false,
    suppressContact: false,
    markDead: false,
  },

  clicked_link: {
    trigger: "clicked_link",
    action: "Accelerate sequence and alert contractor",
    reason:
      "Link click signals strong buying intent. Contractor should follow up personally within 24 hours for highest conversion.",
    stopSequence: false,
    sendImmediate: "email",
    alertContractor: true,
    alertOperator: false,
    suppressContact: false,
    markDead: false,
  },

  visited_website: {
    trigger: "visited_website",
    action: "Accelerate sequence and send immediate SMS",
    reason:
      "Website visit from an outreach lead indicates active evaluation. Immediate SMS catches them while they are still researching.",
    stopSequence: false,
    sendImmediate: "sms",
    alertContractor: true,
    alertOperator: false,
    suppressContact: false,
    markDead: false,
  },

  replied_positive: {
    trigger: "replied_positive",
    action: "Stop sequence and alert contractor for personal follow-up",
    reason:
      "Positive reply means the lead is ready to talk. Automated messages should stop immediately to avoid seeming impersonal.",
    stopSequence: true,
    alertContractor: true,
    alertOperator: false,
    suppressContact: false,
    markDead: false,
  },

  replied_negative: {
    trigger: "replied_negative",
    action: "Stop sequence and suppress further contact",
    reason:
      "Negative reply indicates disinterest. Continuing outreach risks spam complaints and damages sender reputation.",
    stopSequence: true,
    alertContractor: false,
    alertOperator: true,
    suppressContact: true,
    markDead: false,
  },

  replied_question: {
    trigger: "replied_question",
    action: "Pause sequence and alert contractor to answer",
    reason:
      "Lead has a question that requires a human, thoughtful response. Automated cadence pauses until the question is resolved.",
    stopSequence: true,
    alertContractor: true,
    alertOperator: false,
    suppressContact: false,
    markDead: false,
  },

  opted_out: {
    trigger: "opted_out",
    action: "Immediately stop all contact and mark as dead",
    reason:
      "Opt-out must be honoured instantly per CAN-SPAM and TCPA. Lead is added to the suppression list and marked dead.",
    stopSequence: true,
    alertContractor: false,
    alertOperator: true,
    suppressContact: true,
    markDead: true,
  },
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Given an engagement event, determine what action to take.
 */
export function getTriggeredAction(trigger: EngagementTrigger): TriggerAction {
  const action = ENGAGEMENT_TRIGGERS[trigger];
  if (!action) {
    throw new Error(`Unknown engagement trigger: ${trigger}`);
  }
  return action;
}

/**
 * Check if a sequence step's condition is met given the lead's engagement state.
 *
 * @param condition - The step condition to evaluate.
 * @param engagement - Current engagement state for the lead.
 * @returns `true` if the step should fire.
 */
export function isStepConditionMet(
  condition: SequenceStep["condition"],
  engagement: { emailOpened: boolean; replied: boolean; score: number },
): boolean {
  switch (condition) {
    case "always":
      return true;

    case "no_reply":
      return !engagement.replied;

    case "email_not_opened":
      return !engagement.emailOpened && !engagement.replied;

    case "email_opened_no_reply":
      return engagement.emailOpened && !engagement.replied;

    case "score_above_60_no_reply":
      return engagement.score > 60 && !engagement.replied;

    default: {
      // Exhaustive check — TypeScript will error if a condition case is missed.
      const _exhaustive: never = condition;
      throw new Error(`Unknown step condition: ${_exhaustive}`);
    }
  }
}

/**
 * Get the recommended sequence for a lead based on available contact channels.
 *
 * Selection logic:
 *  - Email + phone + consent  -> "full_multichannel"
 *  - Email + phone (no consent for marketing SMS) -> "email_only"
 *  - Email only               -> "email_only"
 *  - Email + phone + consent but no voice consent -> "email_sms"
 *
 * @returns The key into {@link SEQUENCES}.
 */
export function getRecommendedSequence(
  hasEmail: boolean,
  hasPhone: boolean,
  hasConsent: boolean,
): string {
  if (!hasEmail) {
    // Without email we cannot run any of the defined sequences.
    // Return email_only as a safe default; the caller should gate on hasEmail.
    return "email_only";
  }

  if (hasPhone && hasConsent) {
    return "full_multichannel";
  }

  if (hasPhone && !hasConsent) {
    // Phone is available but no marketing consent — stick to email only.
    return "email_only";
  }

  // Email only — no phone number at all.
  return "email_only";
}
