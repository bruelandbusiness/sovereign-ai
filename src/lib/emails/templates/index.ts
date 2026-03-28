/**
 * Barrel file for email templates.
 *
 * Re-exports all template builders, interfaces, and shared components so that
 * consumers can import from "@/lib/emails/templates" (the directory index) or
 * from individual template files.
 */

// Shared layout & components
export {
  APP_URL,
  FROM_NAME,
  BRAND,
  COMPANY_ADDRESS,
  brandedHeader,
  brandedFooter,
  baseLayout,
  ctaButton,
  paragraph,
  heading,
  statCard,
  infoCard,
  accentCard,
  divider,
  stepList,
  formatCurrency,
} from "./shared";

// Individual templates — interfaces & builders
export { type WelcomeVars, buildWelcome } from "./welcome";
export { type TrialEndingVars, buildTrialEnding } from "./trial-ending";
export { type InvoiceVars, buildInvoice } from "./invoice";
export { type WeeklyReportVars, buildWeeklyReport } from "./weekly-report";
export { type LeadAlertVars, buildLeadAlert } from "./lead-alert";
export { type ReviewRequestVars, buildReviewRequest } from "./review-request";
export { type MagicLinkVars, buildMagicLink } from "./magic-link";
export { type SubscriptionCancelledVars, buildSubscriptionCancelled } from "./subscription-cancelled";
export { type ServiceActivatedVars, buildServiceActivated } from "./service-activated";
