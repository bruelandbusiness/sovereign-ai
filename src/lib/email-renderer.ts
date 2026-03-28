/**
 * Email renderer — converts React Email components to HTML strings for
 * SendGrid (or any other email transport).
 *
 * Uses @react-email/components' built-in `render` function which produces
 * fully inlined, email-client-compatible HTML.
 *
 * @example
 * ```ts
 * import { renderEmail, renderMagicLink } from "@/lib/email-renderer";
 * import { MagicLinkEmail } from "@/emails/MagicLinkEmail";
 *
 * // Option 1: Generic helper
 * const html = await renderEmail(MagicLinkEmail, { email, magicLinkUrl });
 *
 * // Option 2: Pre-built convenience function
 * const { subject, html } = await renderMagicLink({ email, magicLinkUrl });
 * ```
 */

import * as React from "react";
import { render } from "@react-email/components";

import {
  MagicLinkEmail,
  type MagicLinkEmailProps,
} from "@/emails/MagicLinkEmail";
import {
  WelcomeEmail,
  type WelcomeEmailProps,
} from "@/emails/WelcomeEmail";
import {
  InvoiceEmail,
  type InvoiceEmailProps,
} from "@/emails/InvoiceEmail";
import {
  LeadNotificationEmail,
  type LeadNotificationEmailProps,
} from "@/emails/LeadNotificationEmail";
import {
  WeeklyReportEmail,
  type WeeklyReportEmailProps,
} from "@/emails/WeeklyReportEmail";
import {
  BookingConfirmationEmail,
  type BookingConfirmationEmailProps,
} from "@/emails/BookingConfirmationEmail";
import {
  ReviewRequestEmail,
  type ReviewRequestEmailProps,
} from "@/emails/ReviewRequestEmail";
import {
  BookingReminderEmail,
  type BookingReminderEmailProps,
} from "@/emails/BookingReminderEmail";
import {
  ReviewAlertEmail,
  type ReviewAlertEmailProps,
} from "@/emails/ReviewAlertEmail";
import {
  SubscriptionRenewalReminderEmail,
  type SubscriptionRenewalReminderEmailProps,
} from "@/emails/SubscriptionRenewalReminderEmail";
import {
  OnboardingCompleteEmail,
  type OnboardingCompleteEmailProps,
} from "@/emails/OnboardingCompleteEmail";
import {
  MonthlyRoiReportEmail,
  type MonthlyRoiReportEmailProps,
} from "@/emails/MonthlyRoiReportEmail";

// ── Generic Renderer ────────────────────────────────────────────────

/**
 * Render any React Email component to an HTML string.
 *
 * @param Component - The React Email component function
 * @param props - Props to pass to the component
 * @returns The rendered HTML string (doctype included)
 */
export async function renderEmail<P extends object>(
  Component: React.FC<P>,
  props: P,
): Promise<string> {
  const element = React.createElement(Component, props);
  return render(element);
}

/**
 * Render a React Email component to plain text (for the text/plain
 * MIME part). Useful for accessibility and low-bandwidth clients.
 */
export async function renderEmailPlainText<P extends object>(
  Component: React.FC<P>,
  props: P,
): Promise<string> {
  const element = React.createElement(Component, props);
  return render(element, { plainText: true });
}

// ── Convenience Renderers ───────────────────────────────────────────

/** Render the magic link email and return subject + HTML. */
export async function renderMagicLink(
  props: MagicLinkEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const _expires = props.expiresInMinutes ?? 15;
  const [html, text] = await Promise.all([
    renderEmail(MagicLinkEmail, props),
    renderEmailPlainText(MagicLinkEmail, props),
  ]);
  return {
    subject: "Sign in to Sovereign AI",
    html,
    text,
  };
}

/** Render the welcome email and return subject + HTML. */
export async function renderWelcome(
  props: WelcomeEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(WelcomeEmail, props),
    renderEmailPlainText(WelcomeEmail, props),
  ]);
  return {
    subject: `Welcome to Sovereign AI, ${props.name}!`,
    html,
    text,
  };
}

/** Render the invoice email and return subject + HTML. */
export async function renderInvoice(
  props: InvoiceEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const isPaid = Boolean(props.paidAt);
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(props.total);

  const [html, text] = await Promise.all([
    renderEmail(InvoiceEmail, props),
    renderEmailPlainText(InvoiceEmail, props),
  ]);

  return {
    subject: isPaid
      ? `Payment receipt for ${props.businessName} \u2014 ${total}`
      : `Invoice #${props.invoiceNumber} for ${props.businessName}`,
    html,
    text,
  };
}

/** Render the lead notification email and return subject + HTML. */
export async function renderLeadNotification(
  props: LeadNotificationEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(LeadNotificationEmail, props),
    renderEmailPlainText(LeadNotificationEmail, props),
  ]);
  return {
    subject: `New lead: ${props.leadName} \u2014 ${props.businessName}`,
    html,
    text,
  };
}

/** Render the weekly report email and return subject + HTML. */
export async function renderWeeklyReport(
  props: WeeklyReportEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(WeeklyReportEmail, props),
    renderEmailPlainText(WeeklyReportEmail, props),
  ]);
  return {
    subject: `Weekly Report: ${props.leads} leads, ${props.callsAnswered} calls \u2014 ${props.businessName}`,
    html,
    text,
  };
}

/** Render the booking confirmation email and return subject + HTML. */
export async function renderBookingConfirmation(
  props: BookingConfirmationEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(BookingConfirmationEmail, props),
    renderEmailPlainText(BookingConfirmationEmail, props),
  ]);
  return {
    subject: `Booking confirmed with ${props.businessName} on ${props.appointmentDate}`,
    html,
    text,
  };
}

/** Render the review request email and return subject + HTML. */
export async function renderReviewRequest(
  props: ReviewRequestEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(ReviewRequestEmail, props),
    renderEmailPlainText(ReviewRequestEmail, props),
  ]);
  return {
    subject: `How was your experience with ${props.businessName}?`,
    html,
    text,
  };
}

/** Render the booking reminder email and return subject + HTML. */
export async function renderBookingReminder(
  props: BookingReminderEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(BookingReminderEmail, props),
    renderEmailPlainText(BookingReminderEmail, props),
  ]);
  return {
    subject: `Reminder: Your appointment with ${props.businessName} tomorrow`,
    html,
    text,
  };
}

/** Render the review alert email and return subject + HTML. */
export async function renderReviewAlert(
  props: ReviewAlertEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(ReviewAlertEmail, props),
    renderEmailPlainText(ReviewAlertEmail, props),
  ]);
  return {
    subject: `New ${props.rating}-star review from ${props.reviewerName} \u2014 ${props.businessName}`,
    html,
    text,
  };
}

/** Render the subscription renewal reminder email and return subject + HTML. */
export async function renderSubscriptionRenewalReminder(
  props: SubscriptionRenewalReminderEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const plural = props.daysUntilRenewal !== 1 ? "s" : "";
  const [html, text] = await Promise.all([
    renderEmail(SubscriptionRenewalReminderEmail, props),
    renderEmailPlainText(SubscriptionRenewalReminderEmail, props),
  ]);
  return {
    subject: `Your ${props.planName} renews in ${props.daysUntilRenewal} day${plural}`,
    html,
    text,
  };
}

/** Render the onboarding complete email and return subject + HTML. */
export async function renderOnboardingComplete(
  props: OnboardingCompleteEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(OnboardingCompleteEmail, props),
    renderEmailPlainText(OnboardingCompleteEmail, props),
  ]);
  return {
    subject: `Your AI services are now live \u2014 ${props.businessName}`,
    html,
    text,
  };
}

/** Render the monthly ROI report email and return subject + HTML. */
export async function renderMonthlyRoiReport(
  props: MonthlyRoiReportEmailProps,
): Promise<{ subject: string; html: string; text: string }> {
  const [html, text] = await Promise.all([
    renderEmail(MonthlyRoiReportEmail, props),
    renderEmailPlainText(MonthlyRoiReportEmail, props),
  ]);
  return {
    subject: `${props.month} ROI Report: ${props.roi}% return \u2014 ${props.businessName}`,
    html,
    text,
  };
}
