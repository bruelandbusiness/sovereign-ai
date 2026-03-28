// ---------------------------------------------------------------------------
// SMS Templates — TCPA-compliant templates from PLAYBOOKS.md
// Every marketing message includes STOP opt-out language.
// ---------------------------------------------------------------------------

export type SmsTemplateKey =
  | "first_contact"
  | "followup"
  | "appointment_confirmation"
  | "review_request"
  | "review_followup";

export interface SmsContext {
  firstName: string;
  contractorName: string;
  city: string;
  neighborhood?: string;
  serviceType: string;
  phone: string;
  // Appointment-specific
  address?: string;
  date?: string;
  time?: string;
  // Review-specific
  googleReviewLink?: string;
}

export interface SmsMessage {
  body: string;
  templateKey: SmsTemplateKey;
  requiresConsent: boolean; // true for marketing, false for transactional
  charCount: number;
}

export interface SmsTemplateDefinition {
  key: SmsTemplateKey;
  /** Raw template string with {placeholder} tokens. */
  template: string;
  /** true = marketing (requires prior express written consent under TCPA). */
  requiresConsent: boolean;
  /** Human-readable description / send-timing note. */
  description: string;
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const SMS_TEMPLATES: Record<SmsTemplateKey, SmsTemplateDefinition> = {
  first_contact: {
    key: "first_contact",
    template:
      "Hi {first_name}, this is {contractor_name} in {city}. We're reaching out to homeowners in {neighborhood} about {service_type}. Would you like a free estimate? Reply YES or call us at {phone}. Reply STOP to opt out.",
    requiresConsent: true,
    description: "Initial outreach to a new lead.",
  },

  followup: {
    key: "followup",
    template:
      "Hi {first_name} — just following up from {contractor_name}. We have openings for {service_type} this week in {neighborhood}. Want us to save you a spot? Reply or call {phone}. STOP to opt out.",
    requiresConsent: true,
    description: "Follow-up message after initial contact with no response.",
  },

  appointment_confirmation: {
    key: "appointment_confirmation",
    template:
      "Confirmed! {contractor_name} will be at {address} on {date} at {time} for {service_type}. Questions? Call {phone}. Reply STOP to opt out.",
    requiresConsent: false,
    description: "Transactional confirmation of a scheduled appointment.",
  },

  review_request: {
    key: "review_request",
    template:
      "Thanks for choosing {contractor_name}! If you were happy with the work, a quick Google review helps us a lot: {google_review_link}. Thanks, {first_name}!",
    requiresConsent: true,
    description: "Sent 24 hours after job completion.",
  },

  review_followup: {
    key: "review_followup",
    template:
      "Hi {first_name} — hope everything's working great! If you have 30 seconds, a Google review really helps {contractor_name}: {google_review_link}. Thanks!",
    requiresConsent: true,
    description: "Sent 3 days post-job if no review has been left.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLACEHOLDER_MAP: Record<string, keyof SmsContext> = {
  "{first_name}": "firstName",
  "{contractor_name}": "contractorName",
  "{city}": "city",
  "{neighborhood}": "neighborhood",
  "{service_type}": "serviceType",
  "{phone}": "phone",
  "{address}": "address",
  "{date}": "date",
  "{time}": "time",
  "{google_review_link}": "googleReviewLink",
};

/**
 * Interpolate a template string, replacing `{placeholder}` tokens with values
 * from the supplied context. Missing optional values are replaced with an empty
 * string (the caller should ensure required fields are present).
 */
function interpolate(template: string, ctx: SmsContext): string {
  let result = template;
  for (const [token, ctxKey] of Object.entries(PLACEHOLDER_MAP)) {
    const value = ctx[ctxKey] ?? "";
    result = result.replaceAll(token, value);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a ready-to-send SMS message from a template key and context values.
 *
 * @throws {Error} if `templateKey` is not a recognised template.
 */
export function generateSms(
  templateKey: SmsTemplateKey,
  ctx: SmsContext,
): SmsMessage {
  const definition = SMS_TEMPLATES[templateKey];
  if (!definition) {
    throw new Error(`Unknown SMS template key: ${templateKey}`);
  }

  const body = interpolate(definition.template, ctx);

  return {
    body,
    templateKey,
    requiresConsent: definition.requiresConsent,
    charCount: body.length,
  };
}
