/**
 * Unified notification email sender.
 *
 * Takes a template name and typed data, renders the React Email template
 * via the email renderer, and sends through the existing SendGrid
 * transport in `@/lib/email`.
 *
 * @example
 * ```ts
 * import { sendNotification } from "@/lib/email/send-notification";
 *
 * await sendNotification("review-alert", "owner@example.com", {
 *   name: "Jane",
 *   businessName: "Acme Plumbing",
 *   reviewerName: "John",
 *   rating: 5,
 *   reviewContent: "Great work!",
 *   reviewSource: "Google",
 *   reviewDate: "March 28, 2026",
 *   respondUrl: "https://...",
 * });
 * ```
 */

import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";
import {
  renderLeadNotification,
  renderWeeklyReport,
  renderReviewAlert,
  renderInvoice,
  renderSubscriptionRenewalReminder,
  renderOnboardingComplete,
  renderMonthlyRoiReport,
} from "@/lib/email-renderer";

import type { LeadNotificationEmailProps } from "@/emails/LeadNotificationEmail";
import type { WeeklyReportEmailProps } from "@/emails/WeeklyReportEmail";
import type { ReviewAlertEmailProps } from "@/emails/ReviewAlertEmail";
import type { InvoiceEmailProps } from "@/emails/InvoiceEmail";
import type { SubscriptionRenewalReminderEmailProps } from "@/emails/SubscriptionRenewalReminderEmail";
import type { OnboardingCompleteEmailProps } from "@/emails/OnboardingCompleteEmail";
import type { MonthlyRoiReportEmailProps } from "@/emails/MonthlyRoiReportEmail";

// ── Template Map ────────────────────────────────────────────────────

/**
 * Maps each notification template name to its props type.
 */
export interface NotificationTemplateMap {
  "new-lead-alert": LeadNotificationEmailProps;
  "weekly-performance-summary": WeeklyReportEmailProps;
  "review-alert": ReviewAlertEmailProps;
  "invoice-paid": InvoiceEmailProps;
  "subscription-renewal-reminder": SubscriptionRenewalReminderEmailProps;
  "onboarding-complete": OnboardingCompleteEmailProps;
  "monthly-roi-report": MonthlyRoiReportEmailProps;
}

export type NotificationTemplateName = keyof NotificationTemplateMap;

// ── Renderer Registry ───────────────────────────────────────────────

type RenderResult = { subject: string; html: string; text: string };

const renderers: Record<
  NotificationTemplateName,
  (data: never) => Promise<RenderResult>
> = {
  "new-lead-alert": renderLeadNotification as (data: never) => Promise<RenderResult>,
  "weekly-performance-summary": renderWeeklyReport as (data: never) => Promise<RenderResult>,
  "review-alert": renderReviewAlert as (data: never) => Promise<RenderResult>,
  "invoice-paid": renderInvoice as (data: never) => Promise<RenderResult>,
  "subscription-renewal-reminder": renderSubscriptionRenewalReminder as (data: never) => Promise<RenderResult>,
  "onboarding-complete": renderOnboardingComplete as (data: never) => Promise<RenderResult>,
  "monthly-roi-report": renderMonthlyRoiReport as (data: never) => Promise<RenderResult>,
};

// ── Public API ──────────────────────────────────────────────────────

/**
 * Render a notification email template and send it via SendGrid.
 *
 * @param template - The notification template name (e.g. "review-alert")
 * @param to       - Recipient email address
 * @param data     - Props for the chosen template (fully typed)
 */
export async function sendNotification<T extends NotificationTemplateName>(
  template: T,
  to: string,
  data: NotificationTemplateMap[T],
): Promise<void> {
  const renderFn = renderers[template];

  if (!renderFn) {
    logger.error(`[send-notification] Unknown template: ${template}`);
    throw new Error(`Unknown notification template: ${template}`);
  }

  logger.info(`[send-notification] Rendering template "${template}" for ${to}`);

  const { subject, html, text } = await renderFn(data as never);

  await sendEmail(to, subject, html, text);

  logger.info(
    `[send-notification] Sent "${template}" to ${to} — subject: "${subject}"`,
  );
}
