/**
 * Review Response Template Utility
 *
 * Generates AI-assisted review responses using template-based rendering.
 * Templates are organized by rating range and tone, with {{variable}}
 * placeholders substituted from the ReviewContext.
 */

export interface ReviewContext {
  rating: number;          // 1-5
  reviewerName: string;
  reviewText: string;
  businessName: string;
  ownerName: string;
  serviceType?: string;
  vertical?: string;
}

export interface ReviewResponseTemplate {
  id: string;
  ratingRange: [number, number]; // [min, max] inclusive
  tone: "grateful" | "empathetic" | "professional" | "recovery";
  template: string;              // With {{variable}} placeholders
}

// -----------------------------------------------------------------------
// Templates for different rating ranges
// -----------------------------------------------------------------------

export const REVIEW_RESPONSE_TEMPLATES: ReviewResponseTemplate[] = [
  // --- 5-star responses (grateful, personalized) ---
  {
    id: "5star-grateful-1",
    ratingRange: [5, 5],
    tone: "grateful",
    template:
      "Thank you so much, {{reviewerName}}! We truly appreciate your kind words about {{businessName}}. " +
      "It means the world to our team to know that our {{serviceType}} service exceeded your expectations. " +
      "We look forward to serving you again! — {{ownerName}}",
  },
  {
    id: "5star-grateful-2",
    ratingRange: [5, 5],
    tone: "grateful",
    template:
      "Wow, {{reviewerName}} — thank you for the wonderful 5-star review! " +
      "Our crew at {{businessName}} takes pride in delivering top-quality {{serviceType}} work, " +
      "and hearing feedback like yours is what keeps us motivated. " +
      "We'd love to help you again anytime. — {{ownerName}}",
  },
  {
    id: "5star-professional-1",
    ratingRange: [5, 5],
    tone: "professional",
    template:
      "{{reviewerName}}, thank you for trusting {{businessName}} with your {{serviceType}} needs. " +
      "We're glad everything went smoothly and that you're happy with the results. " +
      "Please don't hesitate to reach out if you need anything in the future. — {{ownerName}}",
  },
  {
    id: "5star-grateful-3",
    ratingRange: [5, 5],
    tone: "grateful",
    template:
      "We're thrilled to hear this, {{reviewerName}}! Thank you for choosing {{businessName}}. " +
      "Providing reliable {{serviceType}} service is our top priority, and your review means a lot to our team. " +
      "We hope to see you again soon! — {{ownerName}}",
  },

  // --- 4-star responses (grateful with improvement nod) ---
  {
    id: "4star-grateful-1",
    ratingRange: [4, 4],
    tone: "grateful",
    template:
      "Thank you for the great review, {{reviewerName}}! We're happy to hear that your experience " +
      "with {{businessName}} was a positive one. We're always looking for ways to earn that fifth star, " +
      "so if there's anything we can improve, please let us know. — {{ownerName}}",
  },
  {
    id: "4star-professional-1",
    ratingRange: [4, 4],
    tone: "professional",
    template:
      "{{reviewerName}}, we appreciate you taking the time to share your feedback about our " +
      "{{serviceType}} service. We're glad you had a good experience with {{businessName}}. " +
      "Your input helps us continue to improve. If there's anything we could have done better, " +
      "we'd love to hear from you. — {{ownerName}}",
  },
  {
    id: "4star-grateful-2",
    ratingRange: [4, 4],
    tone: "grateful",
    template:
      "Thanks so much, {{reviewerName}}! We're pleased that our {{serviceType}} team met your expectations. " +
      "At {{businessName}}, we strive for excellence on every job, and we'd welcome the chance to " +
      "earn a perfect score next time. — {{ownerName}}",
  },
  {
    id: "4star-professional-2",
    ratingRange: [4, 4],
    tone: "professional",
    template:
      "We value your feedback, {{reviewerName}}. It's great to know that {{businessName}} delivered " +
      "quality {{serviceType}} work for you. We take every review to heart and are committed to " +
      "making each visit even better than the last. — {{ownerName}}",
  },

  // --- 3-star responses (professional, address concerns) ---
  {
    id: "3star-professional-1",
    ratingRange: [3, 3],
    tone: "professional",
    template:
      "{{reviewerName}}, thank you for your honest feedback. At {{businessName}}, we hold ourselves " +
      "to a high standard, and we're sorry we didn't fully meet your expectations. " +
      "We'd love the opportunity to learn more about your experience and make things right. " +
      "Please reach out to us directly. — {{ownerName}}",
  },
  {
    id: "3star-empathetic-1",
    ratingRange: [3, 3],
    tone: "empathetic",
    template:
      "Thank you for sharing your thoughts, {{reviewerName}}. We appreciate your business and understand " +
      "that there's room for improvement. Your feedback about our {{serviceType}} service is valuable, " +
      "and we'd like the chance to discuss how we can do better. Please don't hesitate to contact us. " +
      "— {{ownerName}}",
  },
  {
    id: "3star-professional-2",
    ratingRange: [3, 3],
    tone: "professional",
    template:
      "{{reviewerName}}, we appreciate you choosing {{businessName}} and taking the time to leave a review. " +
      "We're glad some things went well, but we can see we have work to do. " +
      "Your satisfaction is important to us, and we'd welcome the chance to discuss your experience further. " +
      "— {{ownerName}}",
  },
  {
    id: "3star-empathetic-2",
    ratingRange: [3, 3],
    tone: "empathetic",
    template:
      "Hi {{reviewerName}}, thank you for your candid review. We hear you — and we want to do better. " +
      "Our {{serviceType}} team at {{businessName}} is committed to continuous improvement, " +
      "and your feedback will help us get there. We'd appreciate the opportunity to follow up with you. " +
      "— {{ownerName}}",
  },

  // --- 2-star responses (empathetic, recovery focused) ---
  {
    id: "2star-empathetic-1",
    ratingRange: [2, 2],
    tone: "empathetic",
    template:
      "{{reviewerName}}, we're sorry to hear that your experience with {{businessName}} fell short. " +
      "This isn't the level of {{serviceType}} service we aim to provide, and we take your feedback seriously. " +
      "We'd like to make this right — please contact us so we can address your concerns directly. " +
      "— {{ownerName}}",
  },
  {
    id: "2star-recovery-1",
    ratingRange: [2, 2],
    tone: "recovery",
    template:
      "Hi {{reviewerName}}, thank you for letting us know about your experience. " +
      "We sincerely apologize that we didn't meet the standard you expected from {{businessName}}. " +
      "We'd like the opportunity to understand what went wrong and make it right. " +
      "Please reach out to us at your earliest convenience. — {{ownerName}}",
  },
  {
    id: "2star-empathetic-2",
    ratingRange: [2, 2],
    tone: "empathetic",
    template:
      "{{reviewerName}}, we appreciate your honesty and are disappointed that we let you down. " +
      "At {{businessName}}, every customer's experience matters, and we want to learn from this. " +
      "We'd be grateful for the chance to speak with you directly and resolve any outstanding concerns. " +
      "— {{ownerName}}",
  },
  {
    id: "2star-recovery-2",
    ratingRange: [2, 2],
    tone: "recovery",
    template:
      "Thank you for your feedback, {{reviewerName}}. We're truly sorry that our {{serviceType}} service " +
      "didn't live up to your expectations. Customer satisfaction is our priority at {{businessName}}, " +
      "and we'd like to work with you to make this right. Please contact us so we can discuss next steps. " +
      "— {{ownerName}}",
  },

  // --- 1-star responses (empathetic, take offline) ---
  {
    id: "1star-empathetic-1",
    ratingRange: [1, 1],
    tone: "empathetic",
    template:
      "{{reviewerName}}, we are deeply sorry about your experience. This is not the standard " +
      "{{businessName}} holds for our {{serviceType}} service, and we understand your frustration. " +
      "We want to resolve this for you — please contact us directly so we can discuss what happened " +
      "and find a solution. — {{ownerName}}",
  },
  {
    id: "1star-recovery-1",
    ratingRange: [1, 1],
    tone: "recovery",
    template:
      "Hi {{reviewerName}}, we're very sorry to read about your experience. We take every review seriously, " +
      "and your feedback is important to us. We'd like to investigate what went wrong and make this right. " +
      "Please reach out to {{businessName}} directly so we can resolve this promptly. — {{ownerName}}",
  },
  {
    id: "1star-empathetic-2",
    ratingRange: [1, 1],
    tone: "empathetic",
    template:
      "{{reviewerName}}, we sincerely apologize for the experience you had with {{businessName}}. " +
      "We understand this was unacceptable and want you to know that your concerns are being heard. " +
      "Please allow us the opportunity to speak with you directly — we are committed to making this right. " +
      "— {{ownerName}}",
  },
  {
    id: "1star-recovery-2",
    ratingRange: [1, 1],
    tone: "recovery",
    template:
      "Thank you for bringing this to our attention, {{reviewerName}}. We owe you an apology — " +
      "this is not the {{serviceType}} experience {{businessName}} is known for. " +
      "We'd like to connect with you personally to understand what happened and discuss how we can " +
      "resolve this situation. Please contact us at your earliest convenience. — {{ownerName}}",
  },
];

// -----------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------

function clampRating(rating: number): number {
  return Math.max(1, Math.min(5, Math.round(rating)));
}

function getTemplatesForRating(
  rating: number
): readonly ReviewResponseTemplate[] {
  const clamped = clampRating(rating);
  return REVIEW_RESPONSE_TEMPLATES.filter(
    (t) => clamped >= t.ratingRange[0] && clamped <= t.ratingRange[1]
  );
}

function renderTemplate(
  template: string,
  context: ReviewContext
): string {
  const serviceType = context.serviceType ?? "home service";

  return template
    .replace(/\{\{reviewerName\}\}/g, context.reviewerName)
    .replace(/\{\{businessName\}\}/g, context.businessName)
    .replace(/\{\{ownerName\}\}/g, context.ownerName)
    .replace(/\{\{serviceType\}\}/g, serviceType)
    .replace(/\{\{rating\}\}/g, String(clampRating(context.rating)));
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

/**
 * Select the best template for a given review and render it.
 *
 * Template selection is deterministic: it picks the first matching template
 * for the clamped rating. Use {@link getResponseOptions} for multiple
 * alternatives.
 */
export function generateReviewResponse(context: ReviewContext): string {
  const templates = getTemplatesForRating(context.rating);

  if (templates.length === 0) {
    return `Thank you for your review, ${context.reviewerName}. — ${context.ownerName}`;
  }

  return renderTemplate(templates[0].template, context);
}

/**
 * Get multiple response options for a review, one per unique tone
 * available at the given rating.
 */
export function getResponseOptions(
  context: ReviewContext
): { tone: string; response: string }[] {
  const templates = getTemplatesForRating(context.rating);
  const seenTones = new Set<string>();
  const options: { tone: string; response: string }[] = [];

  for (const tmpl of templates) {
    if (!seenTones.has(tmpl.tone)) {
      seenTones.add(tmpl.tone);
      options.push({
        tone: tmpl.tone,
        response: renderTemplate(tmpl.template, context),
      });
    }
  }

  return options;
}
