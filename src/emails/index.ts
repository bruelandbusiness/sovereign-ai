/**
 * React Email templates barrel export.
 *
 * Each template exports a React component (named + default) and its props
 * interface. Use {@link @/lib/email-renderer} to convert these to HTML
 * strings for SendGrid.
 */

export { MagicLinkEmail } from "./MagicLinkEmail";
export type { MagicLinkEmailProps } from "./MagicLinkEmail";

export { WelcomeEmail } from "./WelcomeEmail";
export type { WelcomeEmailProps } from "./WelcomeEmail";

export { InvoiceEmail } from "./InvoiceEmail";
export type { InvoiceEmailProps, InvoiceLineItem } from "./InvoiceEmail";

export { LeadNotificationEmail } from "./LeadNotificationEmail";
export type { LeadNotificationEmailProps } from "./LeadNotificationEmail";

export { WeeklyReportEmail } from "./WeeklyReportEmail";
export type { WeeklyReportEmailProps } from "./WeeklyReportEmail";

export { BookingConfirmationEmail } from "./BookingConfirmationEmail";
export type { BookingConfirmationEmailProps } from "./BookingConfirmationEmail";

export { ReviewRequestEmail } from "./ReviewRequestEmail";
export type { ReviewRequestEmailProps } from "./ReviewRequestEmail";

export { BookingReminderEmail } from "./BookingReminderEmail";
export type { BookingReminderEmailProps } from "./BookingReminderEmail";

export { ReviewAlertEmail } from "./ReviewAlertEmail";
export type { ReviewAlertEmailProps } from "./ReviewAlertEmail";

export { SubscriptionRenewalReminderEmail } from "./SubscriptionRenewalReminderEmail";
export type { SubscriptionRenewalReminderEmailProps } from "./SubscriptionRenewalReminderEmail";

export { OnboardingCompleteEmail } from "./OnboardingCompleteEmail";
export type { OnboardingCompleteEmailProps } from "./OnboardingCompleteEmail";

export { MonthlyRoiReportEmail } from "./MonthlyRoiReportEmail";
export type { MonthlyRoiReportEmailProps } from "./MonthlyRoiReportEmail";
