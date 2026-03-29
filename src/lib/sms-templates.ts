// SMS Template System for Home Service Businesses
// Provides pre-built templates, variable rendering, and SMS utility functions.
// No external dependencies (no Twilio calls).

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type SMSCategory =
  | "appointment"
  | "lead"
  | "review"
  | "payment"
  | "service"
  | "marketing";

/** Variables that can be interpolated into an SMS template body. */
export interface SMSVariables {
  readonly businessName?: string;
  readonly customerName?: string;
  readonly appointmentDate?: string;
  readonly appointmentTime?: string;
  readonly technicianName?: string;
  readonly serviceType?: string;
  readonly amount?: string;
  readonly invoiceNumber?: string;
  readonly reviewLink?: string;
  readonly promoCode?: string;
  readonly discountPercent?: string;
  readonly referralCode?: string;
  readonly estimateAmount?: string;
  readonly surveyLink?: string;
  readonly paymentLink?: string;
  readonly phoneNumber?: string;
  readonly [key: string]: string | undefined;
}

export interface SMSTemplate {
  readonly id: string;
  readonly category: SMSCategory;
  readonly name: string;
  /** Template body with {{variable}} placeholders. */
  readonly body: string;
  /** Variables required by this template. */
  readonly requiredVariables: readonly string[];
}

export interface SMSPreview {
  readonly templateId: string;
  readonly renderedBody: string;
  readonly characterCount: number;
  readonly segmentCount: number;
  readonly estimatedCost: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SMS_SEGMENT_LIMIT = 160;
const COST_PER_SEGMENT = 0.01;

export const SMS_TEMPLATES: readonly SMSTemplate[] = [
  // ── Appointment ──────────────────────────────────────────────────────
  {
    id: "appt-confirm",
    category: "appointment",
    name: "Booking Confirmation",
    body: "{{businessName}}: Your {{serviceType}} appt is confirmed for {{appointmentDate}} at {{appointmentTime}}. Reply STOP to opt out.",
    requiredVariables: [
      "businessName",
      "serviceType",
      "appointmentDate",
      "appointmentTime",
    ],
  },
  {
    id: "appt-reminder-24h",
    category: "appointment",
    name: "Reminder (24 Hours)",
    body: "Reminder from {{businessName}}: Your {{serviceType}} appt is tomorrow, {{appointmentDate}} at {{appointmentTime}}. Reply C to confirm.",
    requiredVariables: [
      "businessName",
      "serviceType",
      "appointmentDate",
      "appointmentTime",
    ],
  },
  {
    id: "appt-reminder-1h",
    category: "appointment",
    name: "Reminder (1 Hour)",
    body: "{{businessName}}: Your {{serviceType}} appt starts in 1 hour at {{appointmentTime}}. See you soon!",
    requiredVariables: [
      "businessName",
      "serviceType",
      "appointmentTime",
    ],
  },
  {
    id: "appt-reschedule",
    category: "appointment",
    name: "Reschedule Request",
    body: "{{businessName}}: Your {{serviceType}} appt has been rescheduled to {{appointmentDate}} at {{appointmentTime}}. Reply Y to confirm.",
    requiredVariables: [
      "businessName",
      "serviceType",
      "appointmentDate",
      "appointmentTime",
    ],
  },
  {
    id: "appt-cancel",
    category: "appointment",
    name: "Cancellation",
    body: "{{businessName}}: Your {{serviceType}} appt on {{appointmentDate}} has been cancelled. Call us to rebook. Reply STOP to opt out.",
    requiredVariables: [
      "businessName",
      "serviceType",
      "appointmentDate",
    ],
  },

  // ── Lead ─────────────────────────────────────────────────────────────
  {
    id: "lead-inquiry",
    category: "lead",
    name: "New Inquiry Response",
    body: "Hi {{customerName}}, thanks for contacting {{businessName}}! We'd love to help with your {{serviceType}} needs. We'll be in touch shortly.",
    requiredVariables: [
      "customerName",
      "businessName",
      "serviceType",
    ],
  },
  {
    id: "lead-followup",
    category: "lead",
    name: "Follow-Up",
    body: "Hi {{customerName}}, just following up from {{businessName}}. Still interested in {{serviceType}} services? Reply YES and we'll get you scheduled.",
    requiredVariables: [
      "customerName",
      "businessName",
      "serviceType",
    ],
  },
  {
    id: "lead-quote-ready",
    category: "lead",
    name: "Quote Ready",
    body: "{{customerName}}, your {{serviceType}} quote from {{businessName}} is ready: {{estimateAmount}}. Reply YES to book or call us for details.",
    requiredVariables: [
      "customerName",
      "serviceType",
      "businessName",
      "estimateAmount",
    ],
  },
  {
    id: "lead-estimate-scheduled",
    category: "lead",
    name: "Estimate Scheduled",
    body: "{{businessName}}: Your free estimate for {{serviceType}} is scheduled for {{appointmentDate}} at {{appointmentTime}}. See you then!",
    requiredVariables: [
      "businessName",
      "serviceType",
      "appointmentDate",
      "appointmentTime",
    ],
  },

  // ── Review ───────────────────────────────────────────────────────────
  {
    id: "review-request",
    category: "review",
    name: "Review Request",
    body: "Hi {{customerName}}, thanks for choosing {{businessName}}! We'd appreciate a quick review: {{reviewLink}} - it helps us a lot!",
    requiredVariables: [
      "customerName",
      "businessName",
      "reviewLink",
    ],
  },
  {
    id: "review-thankyou",
    category: "review",
    name: "Thank You for Review",
    body: "{{customerName}}, thank you for your review of {{businessName}}! Your feedback means the world to us. We look forward to serving you again.",
    requiredVariables: ["customerName", "businessName"],
  },
  {
    id: "review-response-alert",
    category: "review",
    name: "Review Response Alert",
    body: "{{businessName}}: A new review has been posted. Check your dashboard to respond promptly. Timely responses boost your reputation!",
    requiredVariables: ["businessName"],
  },

  // ── Payment ──────────────────────────────────────────────────────────
  {
    id: "payment-invoice",
    category: "payment",
    name: "Invoice Sent",
    body: "{{businessName}}: Invoice #{{invoiceNumber}} for {{amount}} has been sent. Pay online: {{paymentLink}}. Reply STOP to opt out.",
    requiredVariables: [
      "businessName",
      "invoiceNumber",
      "amount",
      "paymentLink",
    ],
  },
  {
    id: "payment-received",
    category: "payment",
    name: "Payment Received",
    body: "{{businessName}}: Payment of {{amount}} received for invoice #{{invoiceNumber}}. Thank you, {{customerName}}!",
    requiredVariables: [
      "businessName",
      "amount",
      "invoiceNumber",
      "customerName",
    ],
  },
  {
    id: "payment-reminder",
    category: "payment",
    name: "Payment Reminder",
    body: "{{businessName}}: Friendly reminder that invoice #{{invoiceNumber}} for {{amount}} is due soon. Pay here: {{paymentLink}}",
    requiredVariables: [
      "businessName",
      "invoiceNumber",
      "amount",
      "paymentLink",
    ],
  },
  {
    id: "payment-overdue",
    category: "payment",
    name: "Payment Overdue",
    body: "{{businessName}}: Invoice #{{invoiceNumber}} for {{amount}} is overdue. Please pay now: {{paymentLink}} or call us to discuss options.",
    requiredVariables: [
      "businessName",
      "invoiceNumber",
      "amount",
      "paymentLink",
    ],
  },

  // ── Service ──────────────────────────────────────────────────────────
  {
    id: "service-en-route",
    category: "service",
    name: "Technician En Route",
    body: "{{businessName}}: {{technicianName}} is on the way for your {{serviceType}} appointment. Estimated arrival: {{appointmentTime}}.",
    requiredVariables: [
      "businessName",
      "technicianName",
      "serviceType",
      "appointmentTime",
    ],
  },
  {
    id: "service-complete",
    category: "service",
    name: "Job Complete",
    body: "{{businessName}}: Your {{serviceType}} job is complete! If you have questions, call us anytime. Thank you for your business!",
    requiredVariables: ["businessName", "serviceType"],
  },
  {
    id: "service-survey",
    category: "service",
    name: "Follow-Up Survey",
    body: "Hi {{customerName}}, how was your {{serviceType}} experience with {{businessName}}? Take our quick survey: {{surveyLink}}",
    requiredVariables: [
      "customerName",
      "serviceType",
      "businessName",
      "surveyLink",
    ],
  },

  // ── Marketing ────────────────────────────────────────────────────────
  {
    id: "marketing-seasonal",
    category: "marketing",
    name: "Seasonal Promotion",
    body: "{{businessName}}: {{discountPercent}}% off {{serviceType}} this season! Use code {{promoCode}} when you book. Reply STOP to opt out.",
    requiredVariables: [
      "businessName",
      "discountPercent",
      "serviceType",
      "promoCode",
    ],
  },
  {
    id: "marketing-referral",
    category: "marketing",
    name: "Referral Reward",
    body: "{{customerName}}, refer a friend to {{businessName}} and you both save! Share code {{referralCode}} for {{discountPercent}}% off. Reply STOP to opt out.",
    requiredVariables: [
      "customerName",
      "businessName",
      "referralCode",
      "discountPercent",
    ],
  },
  {
    id: "marketing-loyalty",
    category: "marketing",
    name: "Loyalty Discount",
    body: "Thanks for being a loyal {{businessName}} customer, {{customerName}}! Enjoy {{discountPercent}}% off your next {{serviceType}}. Code: {{promoCode}}",
    requiredVariables: [
      "customerName",
      "businessName",
      "discountPercent",
      "serviceType",
      "promoCode",
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Replace all {{variable}} placeholders in a template body.
 * Returns the rendered string truncated to 160 characters.
 *
 * @throws Error when a required variable is missing from `variables`.
 */
export function renderSMS(
  template: SMSTemplate,
  variables: SMSVariables,
): string {
  const missing = template.requiredVariables.filter(
    (v) => variables[v] === undefined || variables[v] === "",
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required SMS variables: ${missing.join(", ")}`,
    );
  }

  const rendered = template.body.replace(
    /\{\{(\w+)\}\}/g,
    (_match, key: string) => {
      const value = variables[key];
      return value ?? "";
    },
  );

  return rendered.slice(0, SMS_SEGMENT_LIMIT);
}

/**
 * Split a message that exceeds 160 characters into multiple
 * SMS-sized segments.  Each segment is at most 160 characters.
 * Splitting happens on the nearest preceding space when possible
 * to avoid breaking words.
 */
export function splitLongMessage(message: string): readonly string[] {
  if (message.length <= SMS_SEGMENT_LIMIT) {
    return [message];
  }

  const segments: string[] = [];
  let remaining = message;

  while (remaining.length > 0) {
    if (remaining.length <= SMS_SEGMENT_LIMIT) {
      segments.push(remaining);
      break;
    }

    // Find the last space within the segment limit.
    let splitIndex = remaining.lastIndexOf(
      " ",
      SMS_SEGMENT_LIMIT,
    );

    // No space found — hard-split at the limit.
    if (splitIndex <= 0) {
      splitIndex = SMS_SEGMENT_LIMIT;
    }

    segments.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trimStart();
  }

  return segments;
}

/**
 * Calculate how many SMS segments are required for a given
 * message body.
 */
export function calculateSMSSegments(message: string): number {
  if (message.length === 0) {
    return 0;
  }
  return Math.ceil(message.length / SMS_SEGMENT_LIMIT);
}

/**
 * Return all templates belonging to a given category.
 */
export function getTemplatesForCategory(
  category: SMSCategory,
): readonly SMSTemplate[] {
  return SMS_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Validate that a phone number conforms to E.164 format.
 * E.164: a leading `+`, followed by 1-15 digits (no spaces,
 * dashes, or other characters).
 *
 * @returns `true` when the phone number is valid E.164.
 */
export function validatePhoneNumber(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Estimate the cost to send an SMS based on segment count.
 * Uses a flat rate of $0.01 per segment.
 *
 * @param message  - The full message text.
 * @returns Estimated cost in dollars, rounded to two decimal
 *          places.
 */
export function estimateSMSCost(message: string): number {
  const segments = calculateSMSSegments(message);
  return Math.round(segments * COST_PER_SEGMENT * 100) / 100;
}

/**
 * Build a full preview of a rendered template including
 * character count, segment count, and estimated cost.
 *
 * @throws Error when required variables are missing.
 */
export function previewSMS(
  template: SMSTemplate,
  variables: SMSVariables,
): SMSPreview {
  const renderedBody = renderSMS(template, variables);
  const characterCount = renderedBody.length;
  const segmentCount = calculateSMSSegments(renderedBody);
  const estimatedCost = estimateSMSCost(renderedBody);

  return {
    templateId: template.id,
    renderedBody,
    characterCount,
    segmentCount,
    estimatedCost,
  };
}
