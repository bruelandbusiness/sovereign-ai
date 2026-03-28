import { env } from "@/lib/env";

import { logger } from "@/lib/logger";
import { getCircuitBreaker } from "@/lib/circuit-breaker";
import {
  renderMagicLink,
  renderWelcome,
  renderBookingConfirmation,
  renderReviewRequest,
  renderBookingReminder,
  renderReviewAlert,
  renderSubscriptionRenewalReminder,
  renderOnboardingComplete,
  renderMonthlyRoiReport,
} from "@/lib/email-renderer";

import type { ReviewAlertEmailProps } from "@/emails/ReviewAlertEmail";
import type { SubscriptionRenewalReminderEmailProps } from "@/emails/SubscriptionRenewalReminderEmail";
import type { OnboardingCompleteEmailProps } from "@/emails/OnboardingCompleteEmail";
import type { MonthlyRoiReportEmailProps } from "@/emails/MonthlyRoiReportEmail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@trysovereignai.com";

/** SendGrid circuit breaker — opens after 5 consecutive failures, resets after 60s. */
const sendgridBreaker = getCircuitBreaker("sendgrid", {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  isFailure: (error) => {
    // Only count transient errors — permanent 4xx errors should not trip the breaker
    if (error instanceof SendGridError) return error.retryable;
    return true;
  },
});

/** Timeout for SendGrid API calls (15 seconds). */
const SENDGRID_TIMEOUT_MS = 15_000;

// ─── Security Helpers ─────────────────────────────────────────

/**
 * Escape special HTML characters in a string to prevent HTML injection / XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Basic email validation.
 */
function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // Simple but effective check: one @, no spaces, dot in domain part
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (/\s/.test(email)) return false;
  if (!domain.includes(".")) return false;
  return true;
}

/**
 * Return the URL unchanged if it uses http/https, otherwise return "#".
 * Prevents javascript:, data:, vbscript: and other dangerous protocols in href attributes.
 */
function safeHttpUrl(url: string): string {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  return "#";
}

// ─── Plain-Text Conversion ────────────────────────────────────

/**
 * Convert HTML email content to a reasonable plain-text fallback.
 * Strips tags, converts links to "text (url)" format, normalises
 * whitespace, and decodes the most common HTML entities.
 */
function htmlToPlainText(html: string): string {
  let text = html;
  // Replace <br> / <br/> with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  // Replace </p>, </div>, </tr>, </li> with double newline for paragraph breaks
  text = text.replace(/<\/(?:p|div|tr|h[1-6])>/gi, "\n\n");
  // Replace </li> with newline
  text = text.replace(/<\/li>/gi, "\n");
  // Convert <a href="url">text</a> to "text (url)"
  text = text.replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)");
  // Replace <hr> with separator
  text = text.replace(/<hr[^>]*>/gi, "\n---\n");
  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&ensp;/g, " ")
    .replace(/&emsp;/g, "  ")
    .replace(/&nbsp;/g, " ")
    .replace(/&zwnj;/g, "")
    .replace(/&#x2713;/g, "\u2713")
    .replace(/&#x2022;/g, "\u2022")
    .replace(/&#x2B50;/g, "\u2B50")
    .replace(/&#x2705;/g, "\u2705")
    .replace(/&#x25B2;/g, "\u25B2")
    .replace(/&#x25BC;/g, "\u25BC")
    .replace(/&#x1F514;/g, "\uD83D\uDD14");
  // Collapse multiple newlines to max two
  text = text.replace(/\n{3,}/g, "\n\n");
  // Collapse multiple spaces to single space
  text = text.replace(/[^\S\n]+/g, " ");
  // Trim each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
  // Trim overall
  return text.trim();
}

// ─── Email Layout Helpers ─────────────────────────────────────

/**
 * Standard email footer with optional unsubscribe link.
 */
function emailFooter(unsubscribeUrl?: string): string {
  return `
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center;">
      Sovereign AI, Inc.<br />
      ${escapeHtml(env.COMPANY_ADDRESS)}
      ${unsubscribeUrl ? `<br /><a href="${safeHttpUrl(unsubscribeUrl)}" style="color:#999;text-decoration:underline;">Unsubscribe</a>` : ""}
    </p>
  `;
}

/**
 * Wrap email body in a standard layout with preheader text and footer.
 */
function emailLayout(opts: {
  preheader?: string;
  body: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
}): string {
  const preheaderHtml = opts.preheader
    ? `<span style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  ${preheaderHtml}
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#0a0a0f;font-size:24px;margin:0;">Sovereign AI</h1>
    </div>
    ${opts.body}
    ${emailFooter(opts.isTransactional ? undefined : opts.unsubscribeUrl)}
  </div>
</body></html>`;
}

/**
 * Render a styled CTA button for emails.
 */
function emailButton(
  text: string,
  url: string,
  variant?: "primary" | "danger"
): string {
  const bg = variant === "danger"
    ? "#ef4444"
    : "linear-gradient(135deg, #4c85ff, #22d3a1)";
  const bgFallback = variant === "danger" ? "#ef4444" : "#4c85ff";

  return `
    <div style="text-align:center;margin:32px 0;">
      <a href="${safeHttpUrl(url)}" style="display:inline-block;background:${bg};background-color:${bgFallback};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        ${escapeHtml(text)}
      </a>
    </div>
  `;
}

// ─── Core Send Functions ──────────────────────────────────────

/**
 * Custom error class for SendGrid failures. Carries the HTTP status so
 * callers (e.g. the email queue) can distinguish retryable from permanent
 * errors without parsing the message string.
 */
export class SendGridError extends Error {
  readonly statusCode: number;
  readonly retryable: boolean;

  constructor(statusCode: number, body: string) {
    super(`SendGrid returned ${statusCode}: ${body}`);
    this.name = "SendGridError";
    this.statusCode = statusCode;
    // 429 (rate-limited) and 5xx are transient — worth retrying.
    // 4xx (except 429) are permanent client errors (bad request, auth, etc.).
    this.retryable = statusCode === 429 || statusCode >= 500;
  }
}

async function sendEmail(to: string, subject: string, html: string, text?: string) {
  // Validate recipient before attempting send
  if (!isValidEmail(to)) {
    logger.error("[email] Invalid recipient email address — skipping send", {
      to,
      subject,
    });
    throw new Error("Invalid recipient email address");
  }

  if (!SENDGRID_API_KEY) {
    logger.info("[DEV EMAIL] Skipping send — no SendGrid API key", {
      to,
      subject,
    });
    return;
  }

  // Defense-in-depth: strip newline characters from subject to prevent
  // email header injection.
  const safeSubject = subject.replace(/[\r\n]/g, " ").trim();

  // Use the caller-supplied plain text when available (e.g. from React Email's
  // built-in plainText renderer), otherwise fall back to stripping HTML.
  const plainText = text ?? htmlToPlainText(html);

  // Use circuit breaker to avoid hammering SendGrid when it is down
  await sendgridBreaker.execute(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SENDGRID_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM_EMAIL, name: "Sovereign AI" },
          reply_to: { email: process.env.REPLY_TO_EMAIL || "hello@trysovereignai.com", name: "Sovereign AI" },
          subject: safeSubject,
          content: [
            { type: "text/plain", value: plainText },
            { type: "text/html", value: html },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown");
        const sgError = new SendGridError(response.status, errorBody);

        logger.error(`[email] SendGrid error: ${response.status} ${response.statusText}`, {
          to,
          subject: safeSubject,
          error: errorBody,
          retryable: sgError.retryable,
        });
        throw sgError;
      }
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(`SendGrid request timed out after ${SENDGRID_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  });
}

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string) {
  const { subject, html, text } = await renderMagicLink({
    email,
    magicLinkUrl,
  });

  await sendEmail(email, subject, html, text);
}

export async function sendWelcomeEmail(
  email: string,
  ownerName: string,
  businessName: string,
  magicLinkUrl: string
) {
  const { subject, html, text } = await renderWelcome({
    name: ownerName,
    businessName,
    dashboardUrl: magicLinkUrl,
  });

  await sendEmail(email, subject, html, text);
}

export async function sendReviewRequestEmail(
  email: string,
  customerName: string,
  businessName: string,
  reviewUrl: string,
  unsubscribeUrl?: string
) {
  const { subject, html, text } = await renderReviewRequest({
    customerName,
    businessName,
    reviewUrl,
    unsubscribeUrl,
  });

  await sendEmail(email, subject, html, text);
}

/**
 * Send a campaign email.
 *
 * Wraps the body in the standard layout with an unsubscribe link for
 * CAN-SPAM compliance. The `body` parameter is treated as pre-rendered
 * HTML — callers MUST escape user-supplied variables before interpolation.
 */
export async function sendCampaignEmail(
  to: string,
  subject: string,
  body: string,
  unsubscribeUrl?: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

  const html = emailLayout({
    body,
    unsubscribeUrl: unsubscribeUrl || `${appUrl}/unsubscribe`,
  });

  await sendEmail(to, subject, html);
}

export async function sendBookingReminderEmail(
  email: string,
  customerName: string,
  businessName: string,
  appointmentDate: string,
  appointmentTime: string
) {
  const { subject, html, text } = await renderBookingReminder({
    customerName,
    businessName,
    appointmentDate,
    appointmentTime,
  });

  await sendEmail(email, subject, html, text);
}

export async function sendBookingConfirmationEmail(
  email: string,
  customerName: string,
  businessName: string,
  serviceType: string,
  appointmentDate: string,
  appointmentTime: string,
  manageUrl?: string
) {
  const { subject, html, text } = await renderBookingConfirmation({
    customerName,
    businessName,
    serviceType,
    appointmentDate,
    appointmentTime,
    manageUrl,
  });

  await sendEmail(email, subject, html, text);
}

/**
 * Send a drip email.
 *
 * **Important:** The `body` parameter is treated as pre-rendered HTML (the
 * caller is responsible for escaping user-supplied values). This function
 * wraps it in the standard layout but does NOT escape `body` itself, because
 * templates legitimately contain HTML tags. Callers MUST use `escapeHtml` on
 * any user-supplied variables before interpolating them into `body`.
 *
 * An `unsubscribeUrl` should be supplied for CAN-SPAM compliance on marketing
 * drip emails.
 */
export async function sendDripEmail(
  to: string,
  subject: string,
  body: string,
  businessName: string,
  unsubscribeUrl?: string
) {
  const html = emailLayout({
    body,
    unsubscribeUrl: unsubscribeUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com"}/unsubscribe`,
  });

  await sendEmail(to, subject, html);
}

export async function sendReviewAlertEmail(
  email: string,
  props: ReviewAlertEmailProps,
) {
  const { subject, html, text } = await renderReviewAlert(props);
  await sendEmail(email, subject, html, text);
}

export async function sendSubscriptionRenewalReminderEmail(
  email: string,
  props: SubscriptionRenewalReminderEmailProps,
) {
  const { subject, html, text } = await renderSubscriptionRenewalReminder(props);
  await sendEmail(email, subject, html, text);
}

export async function sendOnboardingCompleteEmail(
  email: string,
  props: OnboardingCompleteEmailProps,
) {
  const { subject, html, text } = await renderOnboardingComplete(props);
  await sendEmail(email, subject, html, text);
}

export async function sendMonthlyRoiReportEmail(
  email: string,
  props: MonthlyRoiReportEmailProps,
) {
  const { subject, html, text } = await renderMonthlyRoiReport(props);
  await sendEmail(email, subject, html, text);
}

/**
 * Queue an email via the email queue system (for non-urgent sends).
 * Falls back to direct send if the queue module cannot be loaded.
 */
async function sendEmailQueued(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> {
  try {
    const { queueEmail } = await import("@/lib/email-queue");
    await queueEmail(to, subject, html);
  } catch {
    // Fallback to direct send if queue is unavailable
    await sendEmail(to, subject, html, text);
  }
}

export {
  escapeHtml,
  isValidEmail,
  safeHttpUrl,
  htmlToPlainText,
  emailFooter,
  emailLayout,
  emailButton,
  sendEmail,
  sendEmailQueued,
};
