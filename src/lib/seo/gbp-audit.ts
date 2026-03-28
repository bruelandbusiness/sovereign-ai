/**
 * Google Business Profile Audit — Checklist, state management, and Google Posts.
 *
 * Provides a structured GBP audit checklist with progress tracking,
 * prioritized recommendations, and weekly Google Post generation.
 *
 * No external dependencies.
 */

// ─── Audit Types ─────────────────────────────────────────────

export type AuditCategory = "basics" | "content" | "media" | "engagement";

export interface GBPAuditItem {
  id: string;
  category: AuditCategory;
  check: string;
  critical: boolean;
  automated: boolean;
}

export interface GBPAuditItemState {
  itemId: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface GBPAuditState {
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  items: GBPAuditItemState[];
}

export interface AuditProgress {
  total: number;
  completed: number;
  percentage: number;
  criticalRemaining: number;
}

export interface AuditRecommendation {
  itemId: string;
  check: string;
  category: AuditCategory;
  critical: boolean;
  priority: number;
}

// ─── Google Posts Types ──────────────────────────────────────

export type GooglePostType =
  | "service_highlight"
  | "seasonal_tip"
  | "review_spotlight"
  | "offer_cta";

export interface GooglePostTemplate {
  type: GooglePostType;
  /** Week of the month (1-4). */
  weekOfMonth: number;
  template: string;
  rules: string[];
}

export interface GooglePostContext {
  serviceName?: string;
  phone: string;
  website?: string;
  customerFirstName?: string;
  neighborhood?: string;
  serviceArea?: string;
  offerDescription?: string;
  offerPrice?: string;
}

// ─── Audit Checklist ─────────────────────────────────────────

/**
 * The complete GBP audit checklist covering basics, content, media, and engagement.
 */
export const GBP_AUDIT_CHECKLIST: GBPAuditItem[] = [
  // Basics
  {
    id: "name_match",
    category: "basics",
    check: "Business name matches legal name exactly (no keyword stuffing)",
    critical: true,
    automated: false,
  },
  {
    id: "primary_category",
    category: "basics",
    check: "Primary category correct",
    critical: true,
    automated: false,
  },
  {
    id: "secondary_categories",
    category: "basics",
    check: "Secondary categories added",
    critical: false,
    automated: false,
  },
  {
    id: "address_verified",
    category: "basics",
    check: "Address verified and accurate",
    critical: true,
    automated: false,
  },
  {
    id: "phone_matches",
    category: "basics",
    check: "Phone number matches website",
    critical: true,
    automated: true,
  },
  {
    id: "website_url",
    category: "basics",
    check: "Website URL correct and working",
    critical: true,
    automated: true,
  },
  {
    id: "business_hours",
    category: "basics",
    check: "Business hours current (including holidays)",
    critical: true,
    automated: false,
  },
  {
    id: "service_area",
    category: "basics",
    check: "Service area defined (zip codes or radius)",
    critical: true,
    automated: false,
  },

  // Content
  {
    id: "description",
    category: "content",
    check: "Business description written (750 chars, services + area + differentiator)",
    critical: true,
    automated: false,
  },
  {
    id: "services_listed",
    category: "content",
    check: "All services listed with descriptions",
    critical: true,
    automated: false,
  },
  {
    id: "products_section",
    category: "content",
    check: "Products/services section populated",
    critical: false,
    automated: false,
  },
  {
    id: "attributes",
    category: "content",
    check: "Attributes filled out (women-owned, veteran-owned, languages, etc.)",
    critical: false,
    automated: false,
  },
  {
    id: "opening_date",
    category: "content",
    check: "Opening date set",
    critical: false,
    automated: false,
  },

  // Media
  {
    id: "logo",
    category: "media",
    check: "Logo uploaded (square, clean, recognizable)",
    critical: true,
    automated: false,
  },
  {
    id: "cover_photo",
    category: "media",
    check: "Cover photo uploaded (team, truck, or completed work — NOT stock)",
    critical: true,
    automated: false,
  },
  {
    id: "work_photos",
    category: "media",
    check: "10+ photos of real work (before/after, team, trucks)",
    critical: false,
    automated: false,
  },
  {
    id: "geotagged",
    category: "media",
    check: "Photos geotagged to service area",
    critical: false,
    automated: false,
  },
  {
    id: "monthly_photos",
    category: "media",
    check: "New photos added monthly",
    critical: false,
    automated: false,
  },

  // Engagement
  {
    id: "review_responses",
    category: "engagement",
    check: "Owner responds to ALL reviews within 24 hours",
    critical: true,
    automated: true,
  },
  {
    id: "weekly_posts",
    category: "engagement",
    check: "Google Posts published weekly",
    critical: false,
    automated: true,
  },
  {
    id: "qa_monitored",
    category: "engagement",
    check: "Q&A section monitored and answered",
    critical: false,
    automated: false,
  },
  {
    id: "messaging",
    category: "engagement",
    check: "Messaging enabled (if client can handle it)",
    critical: false,
    automated: false,
  },
];

// ─── Google Post Templates ───────────────────────────────────

/** Post rules that apply to all Google Posts. */
const GOOGLE_POST_RULES: string[] = [
  "Posts expire after 7 days — publish weekly.",
  "Include a CTA button (call, book, learn more).",
  "Include a real photo — never use stock photos.",
  "Keep under 300 words.",
];

/**
 * Weekly Google Post templates:
 * - Week 1: Service highlight
 * - Week 2: Seasonal tip
 * - Week 3: Review spotlight
 * - Week 4: Offer/CTA
 */
export const GOOGLE_POST_TEMPLATES: GooglePostTemplate[] = [
  {
    type: "service_highlight",
    weekOfMonth: 1,
    template:
      "Looking for professional {serviceName} in {serviceArea}? " +
      "We deliver quality work with transparent pricing and reliable scheduling. " +
      "Call us today at {phone} to get a free estimate!",
    rules: [
      ...GOOGLE_POST_RULES,
      "Highlight a specific service the business offers.",
      "Mention the service area to reinforce local relevance.",
    ],
  },
  {
    type: "seasonal_tip",
    weekOfMonth: 2,
    template:
      "Seasonal tip for homeowners in {serviceArea}: " +
      "Now is a great time to schedule your {serviceName} maintenance before the rush. " +
      "Preventive care saves you money and avoids emergencies. " +
      "Questions? Call us at {phone}.",
    rules: [
      ...GOOGLE_POST_RULES,
      "Provide a genuinely useful seasonal tip related to the service.",
      "Position the business as a helpful expert.",
    ],
  },
  {
    type: "review_spotlight",
    weekOfMonth: 3,
    template:
      "We love hearing from happy customers! {customerFirstName} in {neighborhood} said " +
      "our {serviceName} service exceeded their expectations. " +
      "Thank you for trusting us with your home! " +
      "Ready to see the difference? Call {phone}.",
    rules: [
      ...GOOGLE_POST_RULES,
      "Spotlight a real customer review (get permission first).",
      "Use the customer's first name only — never the full name.",
      "Mention the neighborhood for local relevance.",
    ],
  },
  {
    type: "offer_cta",
    weekOfMonth: 4,
    template:
      "{offerDescription} — {offerPrice}! " +
      "Limited time offer for {serviceArea} homeowners. " +
      "Call {phone} or visit {website} to book today.",
    rules: [
      ...GOOGLE_POST_RULES,
      "Include a clear, specific offer with pricing.",
      "Create urgency without being pushy.",
      "Always include the booking CTA.",
    ],
  },
];

// ─── Audit Functions ─────────────────────────────────────────

/**
 * Create a fresh GBP audit state for a client.
 * Initializes all checklist items as incomplete.
 *
 * @param clientId - The client identifier.
 * @returns A new GBPAuditState with all items pending.
 */
export function createGBPAuditState(clientId: string): GBPAuditState {
  const now = new Date();
  return {
    clientId,
    createdAt: now,
    updatedAt: now,
    items: GBP_AUDIT_CHECKLIST.map((item) => ({
      itemId: item.id,
      completed: false,
    })),
  };
}

/**
 * Mark an audit item as completed, optionally with notes.
 *
 * @param state - The current audit state (mutated in place and returned).
 * @param itemId - The ID of the checklist item to complete.
 * @param notes - Optional notes about the completion.
 * @returns The updated audit state.
 * @throws Error if the item ID is not found.
 */
export function completeAuditItem(
  state: GBPAuditState,
  itemId: string,
  notes?: string
): GBPAuditState {
  const item = state.items.find((i) => i.itemId === itemId);
  if (!item) {
    throw new Error(`Audit item not found: ${itemId}`);
  }

  item.completed = true;
  item.completedAt = new Date();
  if (notes) {
    item.notes = notes;
  }
  state.updatedAt = new Date();

  return state;
}

/**
 * Get the current progress of a GBP audit.
 *
 * @param state - The current audit state.
 * @returns Progress stats including total, completed, percentage, and critical items remaining.
 */
export function getAuditProgress(state: GBPAuditState): AuditProgress {
  const total = state.items.length;
  const completed = state.items.filter((i) => i.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completedIds = new Set(
    state.items.filter((i) => i.completed).map((i) => i.itemId)
  );
  const criticalRemaining = GBP_AUDIT_CHECKLIST.filter(
    (item) => item.critical && !completedIds.has(item.id)
  ).length;

  return { total, completed, percentage, criticalRemaining };
}

/**
 * Get prioritized recommendations for incomplete audit items.
 * Critical items are listed first, then ordered by category importance
 * (basics > content > media > engagement).
 *
 * @param state - The current audit state.
 * @returns Sorted array of recommendations.
 */
export function getAuditRecommendations(
  state: GBPAuditState
): AuditRecommendation[] {
  const completedIds = new Set(
    state.items.filter((i) => i.completed).map((i) => i.itemId)
  );

  const categoryPriority: Record<AuditCategory, number> = {
    basics: 1,
    content: 2,
    media: 3,
    engagement: 4,
  };

  const incomplete = GBP_AUDIT_CHECKLIST.filter(
    (item) => !completedIds.has(item.id)
  );

  const recommendations: AuditRecommendation[] = incomplete.map((item) => {
    // Critical items get priority 0-4 (by category), non-critical get 10-14
    const priority =
      (item.critical ? 0 : 10) + categoryPriority[item.category];

    return {
      itemId: item.id,
      check: item.check,
      category: item.category,
      critical: item.critical,
      priority,
    };
  });

  recommendations.sort((a, b) => a.priority - b.priority);

  return recommendations;
}

/**
 * Format the audit state as a Telegram-friendly message.
 *
 * @param state - The current audit state.
 * @returns Formatted string for Telegram (Markdown).
 */
export function formatAuditForTelegram(state: GBPAuditState): string {
  const progress = getAuditProgress(state);
  const recommendations = getAuditRecommendations(state);

  const lines: string[] = [
    `*GBP Audit Progress*`,
    `${progress.completed}/${progress.total} complete (${progress.percentage}%)`,
    `Critical remaining: ${progress.criticalRemaining}`,
    "",
  ];

  if (recommendations.length > 0) {
    lines.push("*Next Steps:*");
    const topItems = recommendations.slice(0, 5);
    for (const rec of topItems) {
      const icon = rec.critical ? "\uD83D\uDD34" : "\uD83D\uDFE1";
      lines.push(`${icon} ${rec.check}`);
    }

    if (recommendations.length > 5) {
      lines.push(`...and ${recommendations.length - 5} more items`);
    }
  } else {
    lines.push("\u2705 *All audit items complete!*");
  }

  return lines.join("\n");
}

// ─── Google Post Functions ───────────────────────────────────

/**
 * Generate a Google Post from a template, substituting context values.
 *
 * @param type - The post type (determines which template to use).
 * @param context - Dynamic values to substitute into the template.
 * @returns Object with the generated text and CTA type.
 */
export function generateGooglePost(
  type: GooglePostType,
  context: GooglePostContext
): { text: string; ctaType: "call" | "book" | "learn_more" } {
  const template = GOOGLE_POST_TEMPLATES.find((t) => t.type === type);
  if (!template) {
    throw new Error(`Unknown Google Post type: ${type}`);
  }

  let text = template.template;

  // Substitute all placeholders
  const replacements: Record<string, string | undefined> = {
    "{serviceName}": context.serviceName,
    "{phone}": context.phone,
    "{website}": context.website,
    "{customerFirstName}": context.customerFirstName,
    "{neighborhood}": context.neighborhood,
    "{serviceArea}": context.serviceArea,
    "{offerDescription}": context.offerDescription,
    "{offerPrice}": context.offerPrice,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    if (value !== undefined) {
      text = text.split(placeholder).join(value);
    } else {
      // Remove unfilled placeholders gracefully
      text = text.split(placeholder).join("");
    }
  }

  // Clean up any double spaces from removed placeholders
  text = text.replace(/\s{2,}/g, " ").trim();

  // Determine CTA type based on post type
  let ctaType: "call" | "book" | "learn_more";
  switch (type) {
    case "service_highlight":
      ctaType = "call";
      break;
    case "seasonal_tip":
      ctaType = "learn_more";
      break;
    case "review_spotlight":
      ctaType = "call";
      break;
    case "offer_cta":
      ctaType = "book";
      break;
    default:
      ctaType = "call";
  }

  return { text, ctaType };
}
