/**
 * PostHog experiment flag key constants.
 *
 * Each key maps to a feature flag configured in the PostHog dashboard.
 * Use these constants everywhere instead of raw strings so renaming a
 * flag only requires a single change.
 */
export const EXPERIMENTS = {
  /** "Start Getting More Leads" vs "Book Your Free Strategy Call" */
  HERO_CTA_TEXT: "exp_hero_cta_text",
  /** "grid" vs "comparison" pricing layout */
  PRICING_LAYOUT: "exp_pricing_layout",
  /** Show / hide the social-proof stats bar */
  SOCIAL_PROOF_BAR: "exp_social_proof_bar",
} as const;
