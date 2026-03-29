/**
 * Centralized PostHog analytics helper for conversion event tracking.
 *
 * All custom event captures should go through these typed functions
 * to ensure consistent naming and properties across the app.
 *
 * PostHog is dynamically imported so it stays out of the initial JS bundle.
 */

/* ------------------------------------------------------------------ */
/*  Internal helper                                                    */
/* ------------------------------------------------------------------ */

function capture(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  import("posthog-js").then((m) => {
    const ph = m.default;
    if (!ph?.__loaded) return;
    ph.capture(event, properties);
  });
}

/* ------------------------------------------------------------------ */
/*  CTA clicks                                                         */
/* ------------------------------------------------------------------ */

export type CTALocation = "hero" | "header" | "pricing" | "cta_section";

export function trackCTAClick(ctaName: string, page: string): void {
  capture("cta_clicked", { cta_name: ctaName, page });
}

/** Fires the standardized `cta_click` conversion event with location. */
export function trackCtaClickConversion(location: CTALocation): void {
  capture("cta_click", { location });
}

/* ------------------------------------------------------------------ */
/*  Pricing page events                                                */
/* ------------------------------------------------------------------ */

export type PricingPlan = "starter" | "growth" | "empire" | "domination";

export function trackPlanSelected(
  plan: string,
  billing: "monthly" | "annual",
): void {
  capture("plan_selected", { plan, billing });
}

/** Fires when a user clicks a pricing plan CTA. */
export function trackPricingPlanSelected(plan: PricingPlan): void {
  capture("pricing_plan_selected", { plan });
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
/*  Demo video                                                         */
/* ------------------------------------------------------------------ */

/** Fires when the demo video modal opens. */
export function trackDemoVideoPlayed(): void {
  capture("demo_video_played");
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

/** Fires for each wizard onboarding step (numeric). */
export function trackOnboardingStepNumber(step: number): void {
  capture("onboarding_step_completed", { step });
}

export function trackOnboardingAllComplete(): void {
  capture("onboarding_all_complete");
}

/* ------------------------------------------------------------------ */
/*  Checkout                                                           */
/* ------------------------------------------------------------------ */

/** Fires when Stripe checkout is initiated. */
export function trackCheckoutInitiated(plan: string, price: number): void {
  capture("checkout_initiated", { plan, price });
}

export function trackCheckoutSuccess(
  plan: string,
  sessionId: string | null,
): void {
  capture("checkout_success", {
    plan,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
}
