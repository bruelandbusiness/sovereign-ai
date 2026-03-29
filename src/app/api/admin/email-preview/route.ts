import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import {
  renderTemplate,
  type EmailTemplate,
} from "@/lib/emails/templates";
import { buildAbandonedCartEmail } from "@/lib/emails/abandoned-cart";
import { buildBookingNoshowEmail } from "@/lib/emails/booking-noshow";
import { buildNPSEmail } from "@/lib/emails/nps";
import { buildReEngagementEmail } from "@/lib/emails/re-engagement";
import { buildReactivationEmail } from "@/lib/emails/reactivation";
import {
  buildServiceActivatedEmail,
} from "@/lib/emails/service-activated";
import { buildWelcomeSeriesEmail } from "@/lib/emails/welcome-series";
import {
  buildWeeklyReportEmail,
} from "@/lib/emails/weekly-report";
import type { WelcomeVars } from "@/lib/emails/templates/welcome";
import type { TrialEndingVars } from "@/lib/emails/templates/trial-ending";
import type { InvoiceVars } from "@/lib/emails/templates/invoice";
import type { WeeklyReportVars } from "@/lib/emails/templates/weekly-report";
import type { LeadAlertVars } from "@/lib/emails/templates/lead-alert";
import type { ReviewRequestVars } from "@/lib/emails/templates/review-request";
import type { MagicLinkVars } from "@/lib/emails/templates/magic-link";
import type {
  SubscriptionCancelledVars,
} from "@/lib/emails/templates/subscription-cancelled";
import type {
  ServiceActivatedVars,
} from "@/lib/emails/templates/service-activated";

export const dynamic = "force-dynamic";

const APP_URL = "https://www.trysovereignai.com";

/**
 * Sample data for templates registered in the central template registry
 * (src/lib/emails/templates.ts). Each key matches an EmailTemplate value.
 *
 * Uses a mapped type so that each entry is correctly typed for its template,
 * while still allowing iteration by string key at runtime.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY_SAMPLE_DATA: Record<EmailTemplate, any> = {
  welcome: {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    dashboardUrl: `${APP_URL}/dashboard`,
    trialDays: 14,
  } satisfies WelcomeVars,

  "trial-ending": {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    daysRemaining: 3,
    upgradeUrl: `${APP_URL}/billing/upgrade`,
    stats: { leads: 47, calls: 23, reviews: 12 },
  } satisfies TrialEndingVars,

  invoice: {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    invoiceNumber: "INV-2026-0042",
    invoiceDate: "March 1, 2026",
    dueDate: "March 15, 2026",
    lineItems: [
      {
        description: "Sovereign AI Pro Plan (Monthly)",
        quantity: 1,
        unitPrice: 29900,
        amount: 29900,
      },
      {
        description: "AI Lead Generation Add-on",
        quantity: 1,
        unitPrice: 9900,
        amount: 9900,
      },
    ],
    subtotal: 39800,
    tax: 3184,
    total: 42984,
    paymentMethod: "Visa",
    paymentLast4: "4242",
    billingUrl: `${APP_URL}/dashboard/settings/billing`,
    paidAt: "2026-03-01T12:00:00Z",
  } satisfies InvoiceVars,

  "weekly-report": {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    weekOf: "March 23, 2026",
    leads: 34,
    callsAnswered: 18,
    reviewsGenerated: 7,
    bookings: 12,
    estimatedRevenue: 8400,
    weekOverWeekChange: 15,
    topActions: [
      "Follow up on 3 hot leads from Google Ads",
      "Respond to 2 pending review requests",
      "Approve AI-generated blog post draft",
    ],
    dashboardUrl: `${APP_URL}/dashboard`,
    narrative:
      "Your AI systems delivered 34 leads this week, up 15% from last " +
      "week. Google Ads remains your strongest channel. We recommend " +
      "following up on the 3 high-intent leads that came in Thursday.",
  } satisfies WeeklyReportVars,

  "lead-alert": {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    leadName: "Sarah Johnson",
    leadPhone: "(555) 867-5309",
    leadEmail: "sarah.johnson@example.com",
    leadSource: "Google Ads",
    leadService: "AC Installation",
    leadMessage:
      "Hi, I need a new AC unit installed in my 2,400 sq ft home. " +
      "Looking for quotes this week.",
    dashboardUrl: `${APP_URL}/dashboard/leads`,
    timestamp: "2026-03-29T14:32:00Z",
  } satisfies LeadAlertVars,

  "review-request": {
    customerName: "Sarah Johnson",
    businessName: "Smith HVAC Services",
    reviewUrl: "https://g.page/r/smith-hvac/review",
    serviceName: "AC Repair",
  } satisfies ReviewRequestVars,

  "magic-link": {
    email: "john@smithhvac.com",
    magicLinkUrl: `${APP_URL}/auth/verify?token=sample-preview-token`,
    expiresInMinutes: 15,
  } satisfies MagicLinkVars,

  "subscription-cancelled": {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    cancelDate: "March 29, 2026",
    reactivateUrl: `${APP_URL}/onboarding?reactivate=true`,
    stats: { totalLeads: 312, totalRevenue: 47800, monthsActive: 8 },
    offerPercent: 20,
  } satisfies SubscriptionCancelledVars,

  "service-activated": {
    name: "John Smith",
    businessName: "Smith HVAC Services",
    serviceName: "AI Review Management",
    serviceDescription:
      "Automatically request and respond to customer reviews across " +
      "Google, Yelp, and Facebook.",
    dashboardUrl: `${APP_URL}/dashboard/services/review-management`,
    nextSteps: [
      "Connect your Google Business Profile",
      "Set your preferred review request timing",
      "Customize your auto-response templates",
    ],
  } satisfies ServiceActivatedVars,
};

/**
 * Standalone email templates that live outside the central registry.
 * Each entry provides a build function that returns { subject, html }.
 */
const STANDALONE_BUILDERS: Record<
  string,
  () => { subject: string; html: string }
> = {
  "abandoned-cart": () =>
    buildAbandonedCartEmail(
      "John Smith",
      "Smith HVAC Services",
      ["ai-lead-gen", "ai-reviews", "ai-content"],
    ),

  "booking-noshow": () =>
    buildBookingNoshowEmail({
      customerName: "Sarah Johnson",
      businessName: "Smith HVAC Services",
      serviceType: "AC Repair",
      appointmentDate: "March 27, 2026",
      appointmentTime: "2:00 PM",
      rebookUrl: `${APP_URL}/book/smith-hvac`,
    }),

  "nps-30day": () =>
    buildNPSEmail(
      "John Smith",
      "Smith HVAC Services",
      "30day",
      `${APP_URL}/nps?id=sample`,
    ),

  "nps-90day": () =>
    buildNPSEmail(
      "John Smith",
      "Smith HVAC Services",
      "90day",
      `${APP_URL}/nps?id=sample`,
    ),

  "re-engagement-step1": () =>
    buildReEngagementEmail(1, "John Smith", "Smith HVAC Services"),

  "re-engagement-step2": () =>
    buildReEngagementEmail(2, "John Smith", "Smith HVAC Services"),

  "reactivation-step1": () =>
    buildReactivationEmail(1, "John Smith", "Smith HVAC Services"),

  "reactivation-step2": () =>
    buildReactivationEmail(2, "John Smith", "Smith HVAC Services"),

  "reactivation-step3": () =>
    buildReactivationEmail(3, "John Smith", "Smith HVAC Services"),

  "service-activated-legacy": () =>
    buildServiceActivatedEmail(
      "John Smith",
      "Smith HVAC Services",
      "AI Review Management",
      `${APP_URL}/dashboard`,
    ),

  "welcome-series-step1": () =>
    buildWelcomeSeriesEmail(1, "John Smith", "Smith HVAC Services"),

  "welcome-series-step2": () =>
    buildWelcomeSeriesEmail(2, "John Smith", "Smith HVAC Services"),

  "welcome-series-step3": () =>
    buildWelcomeSeriesEmail(3, "John Smith", "Smith HVAC Services"),

  "weekly-report-legacy": () =>
    buildWeeklyReportEmail("John Smith", "Smith HVAC Services", {
      leadsThisWeek: 34,
      leadsLastWeek: 28,
      bookingsThisWeek: 12,
      bookingsLastWeek: 9,
      revenueThisWeek: 8400,
      revenueLastWeek: 7200,
      topSource: "Google Ads",
      reviewsCollected: 7,
    }),
};

/**
 * Build the combined list of all available template names.
 */
function allTemplateNames(): string[] {
  return [
    ...Object.keys(REGISTRY_SAMPLE_DATA),
    ...Object.keys(STANDALONE_BUILDERS),
  ].sort();
}

/**
 * Render a template by name and return its subject line and HTML.
 */
function renderPreview(
  templateName: string,
): { subject: string; html: string } | null {
  // Check central registry first
  if (templateName in REGISTRY_SAMPLE_DATA) {
    return renderTemplate(
      templateName as EmailTemplate,
      REGISTRY_SAMPLE_DATA[templateName as EmailTemplate],
    );
  }

  // Check standalone builders
  const builder = STANDALONE_BUILDERS[templateName];
  if (builder) {
    return builder();
  }

  return null;
}

/**
 * GET /api/admin/email-preview
 *
 * Admin-only endpoint for previewing email templates with sample data.
 *
 * Query params:
 *   ?template=<name>   Render the named template and return its HTML.
 *   ?format=json        Return { subject, html } as JSON instead of raw HTML.
 *   (no params)         Return a JSON list of available template names.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.status },
      );
    }
    throw e;
  }

  const templateName = request.nextUrl.searchParams.get("template");
  const format = request.nextUrl.searchParams.get("format");

  if (!templateName) {
    return NextResponse.json({
      availableTemplates: allTemplateNames(),
      usage:
        "Add ?template=<name> to preview a template. " +
        "Add &format=json to get the subject and HTML as JSON.",
    });
  }

  const result = renderPreview(templateName);

  if (!result) {
    return NextResponse.json(
      {
        error: `Unknown template: ${templateName}`,
        availableTemplates: allTemplateNames(),
      },
      { status: 400 },
    );
  }

  if (format === "json") {
    return NextResponse.json({
      template: templateName,
      subject: result.subject,
      html: result.html,
    });
  }

  return new Response(result.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
