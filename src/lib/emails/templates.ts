/**
 * Transactional email templates for Sovereign AI.
 *
 * All templates use a shared base layout with branded header, footer, and
 * inline styles for maximum email-client compatibility (Outlook, Gmail, Apple
 * Mail, Yahoo, etc.). Layout uses table-based structure throughout.
 *
 * Usage:
 *   import { sendTemplatedEmail, EmailTemplate } from "@/lib/emails/templates";
 *   await sendTemplatedEmail("welcome", "user@example.com", { name: "Mike", ... });
 *
 * Individual templates have been split into separate files under
 * src/lib/emails/templates/ for maintainability. This file re-exports
 * everything so that existing imports continue to work.
 */

import { sendEmail, sendEmailQueued } from "@/lib/email";
import { injectTracking } from "@/lib/email-tracking";

// ─── Re-export shared layout & components ───────────────────────────────────

export {
  BRAND,
  baseLayout,
  ctaButton,
  paragraph,
  heading,
  statCard,
  infoCard,
  accentCard,
  divider,
  stepList,
  brandedHeader,
  brandedFooter,
  formatCurrency,
} from "./templates/shared";

// ─── Re-export template interfaces ─────────────────────────────────────────

export type { WelcomeVars } from "./templates/welcome";
export type { TrialEndingVars } from "./templates/trial-ending";
export type { InvoiceVars } from "./templates/invoice";
export type { WeeklyReportVars } from "./templates/weekly-report";
export type { LeadAlertVars } from "./templates/lead-alert";
export type { ReviewRequestVars } from "./templates/review-request";
export type { MagicLinkVars } from "./templates/magic-link";
export type { SubscriptionCancelledVars } from "./templates/subscription-cancelled";
export type { ServiceActivatedVars } from "./templates/service-activated";

// ─── Import builders (private — used only by the registry below) ────────────

import { buildWelcome } from "./templates/welcome";
import { buildTrialEnding } from "./templates/trial-ending";
import { buildInvoice } from "./templates/invoice";
import { buildWeeklyReport } from "./templates/weekly-report";
import { buildLeadAlert } from "./templates/lead-alert";
import { buildReviewRequest } from "./templates/review-request";
import { buildMagicLink } from "./templates/magic-link";
import { buildSubscriptionCancelled } from "./templates/subscription-cancelled";
import { buildServiceActivated } from "./templates/service-activated";

// Import types for the registry
import type { WelcomeVars } from "./templates/welcome";
import type { TrialEndingVars } from "./templates/trial-ending";
import type { InvoiceVars } from "./templates/invoice";
import type { WeeklyReportVars } from "./templates/weekly-report";
import type { LeadAlertVars } from "./templates/lead-alert";
import type { ReviewRequestVars } from "./templates/review-request";
import type { MagicLinkVars } from "./templates/magic-link";
import type { SubscriptionCancelledVars } from "./templates/subscription-cancelled";
import type { ServiceActivatedVars } from "./templates/service-activated";

// ─── Template Registry ──────────────────────────────────────────────────────

export type EmailTemplate =
  | "welcome"
  | "trial-ending"
  | "invoice"
  | "weekly-report"
  | "lead-alert"
  | "review-request"
  | "magic-link"
  | "subscription-cancelled"
  | "service-activated";

type TemplateVarsMap = {
  welcome: WelcomeVars;
  "trial-ending": TrialEndingVars;
  invoice: InvoiceVars;
  "weekly-report": WeeklyReportVars;
  "lead-alert": LeadAlertVars;
  "review-request": ReviewRequestVars;
  "magic-link": MagicLinkVars;
  "subscription-cancelled": SubscriptionCancelledVars;
  "service-activated": ServiceActivatedVars;
};

type TemplateBuilder<T extends EmailTemplate> = (
  vars: TemplateVarsMap[T]
) => { subject: string; html: string };

const TEMPLATE_BUILDERS: { [T in EmailTemplate]: TemplateBuilder<T> } = {
  welcome: buildWelcome,
  "trial-ending": buildTrialEnding,
  invoice: buildInvoice,
  "weekly-report": buildWeeklyReport,
  "lead-alert": buildLeadAlert,
  "review-request": buildReviewRequest,
  "magic-link": buildMagicLink,
  "subscription-cancelled": buildSubscriptionCancelled,
  "service-activated": buildServiceActivated,
};

/**
 * Whether a template should be queued (non-urgent) rather than sent immediately.
 * Transactional emails (magic link, lead alert) send immediately; marketing-style
 * ones (weekly report, subscription cancelled) go through the queue.
 */
const QUEUE_TEMPLATES = new Set<EmailTemplate>([
  "weekly-report",
  "subscription-cancelled",
  "review-request",
]);

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render an email template with the given variables and send it via SendGrid.
 *
 * @param template - The template name (e.g., "welcome", "magic-link").
 * @param to       - Recipient email address.
 * @param variables - Template-specific variables.
 * @param opts     - Optional overrides.
 * @returns The rendered subject and HTML (useful for testing/previewing).
 *
 * @example
 * ```ts
 * await sendTemplatedEmail("welcome", "mike@example.com", {
 *   name: "Mike",
 *   businessName: "Mike's Plumbing",
 *   dashboardUrl: "https://trysovereignai.com/dashboard",
 * });
 * ```
 */
export async function sendTemplatedEmail<T extends EmailTemplate>(
  template: T,
  to: string,
  variables: TemplateVarsMap[T],
  opts?: {
    /** Override the subject line */
    subjectOverride?: string;
    /** Tracking message ID for open/click tracking */
    messageId?: string;
    /** Force immediate send even for queued templates */
    immediate?: boolean;
  }
): Promise<{ subject: string; html: string }> {
  const builder = TEMPLATE_BUILDERS[template] as TemplateBuilder<T>;
  const { subject: defaultSubject, html: rawHtml } = builder(variables);

  const subject = opts?.subjectOverride ?? defaultSubject;

  // Inject tracking pixel and link wrapping if a messageId is provided
  const html = opts?.messageId
    ? injectTracking(rawHtml, opts.messageId)
    : rawHtml;

  // Route through queue or send immediately based on template type
  const shouldQueue = QUEUE_TEMPLATES.has(template) && !opts?.immediate;

  if (shouldQueue) {
    await sendEmailQueued(to, subject, html);
  } else {
    await sendEmail(to, subject, html);
  }

  return { subject, html };
}

/**
 * Render a template without sending — useful for previews and tests.
 */
export function renderTemplate<T extends EmailTemplate>(
  template: T,
  variables: TemplateVarsMap[T]
): { subject: string; html: string } {
  const builder = TEMPLATE_BUILDERS[template] as TemplateBuilder<T>;
  return builder(variables);
}
