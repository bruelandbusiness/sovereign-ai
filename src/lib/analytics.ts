/**
 * Centralized PostHog analytics helper for conversion event tracking.
 *
 * All custom event captures should go through these typed functions
 * to ensure consistent naming and properties across the app.
 */

import { posthog } from "@/lib/posthog";

/* ------------------------------------------------------------------ */
/*  Internal helper                                                    */
/* ------------------------------------------------------------------ */

function capture(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

/* ------------------------------------------------------------------ */
/*  CTA clicks                                                         */
/* ------------------------------------------------------------------ */

export function trackCTAClick(ctaName: string, page: string): void {
  capture("cta_clicked", { cta_name: ctaName, page });
}

/* ------------------------------------------------------------------ */
/*  Pricing page events                                                */
/* ------------------------------------------------------------------ */

export function trackPlanSelected(
  plan: string,
  billing: "monthly" | "annual",
): void {
  capture("plan_selected", { plan, billing });
}

export function trackBillingToggle(billing: "monthly" | "annual"): void {
  capture("billing_toggle", { billing });
}

export function trackGetStartedClick(
  plan: string,
  billing: "monthly" | "annual",
): void {
  capture("get_started_clicked", { plan, billing });
}

/* ------------------------------------------------------------------ */
/*  Form submissions                                                   */
/* ------------------------------------------------------------------ */

export function trackFormSubmission(formName: string): void {
  capture("form_submitted", { form_name: formName });
}

export function trackFormCompletion(formName: string): void {
  capture("form_completed", { form_name: formName });
}

/* ------------------------------------------------------------------ */
/*  Newsletter                                                         */
/* ------------------------------------------------------------------ */

export function trackNewsletterSignup(): void {
  capture("newsletter_signup");
}

/* ------------------------------------------------------------------ */
/*  Dashboard onboarding                                               */
/* ------------------------------------------------------------------ */

export function trackOnboardingStepCompleted(stepId: string): void {
  capture("onboarding_step_completed", { step_id: stepId });
}

export function trackOnboardingAllComplete(): void {
  capture("onboarding_all_complete");
}

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

export function trackCheckoutSuccess(
  plan: string,
  sessionId: string | null,
): void {
  capture("checkout_success", {
    plan,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
}
