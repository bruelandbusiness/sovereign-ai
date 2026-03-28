/**
 * Enhanced lead scoring incorporating enrichment signals.
 *
 * Weighted scoring formula:
 *   - Property signals  (40%): age, value, recent sale
 *   - Contact quality   (25%): verified email/phone, mobile bonus
 *   - Timing signals    (20%): recent permit, seasonal match, review complaint
 *   - Behavioral        (15%): email opened, link clicked, replied
 *
 * Output is clamped to 0-100.
 */

export interface EnrichedLeadInput {
  // Property signals
  propertyAge?: number | null; // years
  propertyValue?: number | null; // cents
  recentSaleDate?: Date | null;
  hasActivePermit?: boolean;
  hasRecentPermit?: boolean;

  // Contact quality
  emailVerified?: boolean;
  phoneVerified?: boolean;
  phoneLineType?: string | null; // mobile | landline | voip
  socialFound?: boolean;

  // Timing signals
  lastPermitDate?: Date | null;
  seasonalMatch?: boolean;
  recentReviewComplaint?: boolean;
  hasTriggerEvent?: boolean;

  // Behavioral signals
  emailOpened?: boolean;
  linkClicked?: boolean;
  visitedSite?: boolean;
  replied?: boolean;
}

// ---------------------------------------------------------------------------
// Property signals (40 points max)
// ---------------------------------------------------------------------------

// AGENTS.md property_age tiers
function scorePropertyAge(age?: number | null): number {
  if (age == null) return 0;
  if (age >= 25) return 10;  // Systems likely need replacement
  if (age >= 15) return 8;   // Systems aging
  if (age >= 5) return 4;    // Maintenance window
  return 1;                   // Too new, low need
}

// AGENTS.md property_value tiers
function scorePropertyValue(value?: number | null): number {
  if (value == null) return 0;
  const dollars = value / 100;
  if (dollars >= 500_000) return 10;  // High-value home, budget for quality work
  if (dollars >= 300_000) return 8;
  if (dollars >= 150_000) return 5;
  return 2;
}

// AGENTS.md recent_sale tiers
function scoreRecentSale(saleDate?: Date | null): number {
  if (!saleDate) return 0;
  const monthsAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo < 6) return 10;   // New homeowner, likely inspecting systems
  if (monthsAgo < 12) return 6;
  return 2;
}

// AGENTS.md permit_history
function scorePermitHistory(input: EnrichedLeadInput): number {
  if (input.hasActivePermit) return 10;  // They're already doing work
  if (input.hasRecentPermit) return 6;   // Done work recently
  return 2;                               // No permits
}

// ---------------------------------------------------------------------------
// Contact quality (25 points max)
// ---------------------------------------------------------------------------

// AGENTS.md contact quality tiers
function scoreContactQuality(input: EnrichedLeadInput): number {
  let points = 0;
  if (input.emailVerified) points += 8;
  if (input.phoneVerified) points += 8;
  if (input.phoneLineType?.toLowerCase() === "mobile") points += 5;
  else if (input.phoneLineType?.toLowerCase() === "landline") points += 3;
  if (input.socialFound) points += 4;
  return Math.min(points, 25);
}

// ---------------------------------------------------------------------------
// Timing signals (20 points max)
// ---------------------------------------------------------------------------

// AGENTS.md timing signals
function scoreTimingSignals(input: EnrichedLeadInput): number {
  let points = 0;

  // peak_season (8 pts)
  if (input.seasonalMatch) points += 8;

  // trigger_event (10 pts) — specific event like bad review, permit, home sale
  if (input.hasTriggerEvent || input.recentReviewComplaint) points += 10;

  // off_season (2 pts) — fallback if no other timing signals
  if (!input.seasonalMatch && !input.hasTriggerEvent && !input.recentReviewComplaint) {
    points += 2;
  }

  return Math.min(points, 20);
}

// ---------------------------------------------------------------------------
// Behavioral signals (15 points max)
// ---------------------------------------------------------------------------

// AGENTS.md behavioral signals
function scoreBehavioral(input: EnrichedLeadInput): number {
  let points = 0;
  if (input.emailOpened) points += 5;
  if (input.linkClicked) points += 8;
  if (input.visitedSite) points += 10;
  if (input.replied) points += 15;  // Any reply = massive signal
  return Math.min(points, 15);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score an enriched lead from 0-100 using weighted enrichment signals.
 */
export function scoreEnrichedLead(lead: EnrichedLeadInput): number {
  const property =
    scorePropertyAge(lead.propertyAge) +
    scorePropertyValue(lead.propertyValue) +
    scoreRecentSale(lead.recentSaleDate) +
    scorePermitHistory(lead);

  const contact = scoreContactQuality(lead);
  const timing = scoreTimingSignals(lead);
  const behavioral = scoreBehavioral(lead);

  // Property capped at 40, others already capped
  const raw = Math.min(property, 40) + contact + timing + behavioral;
  return Math.max(0, Math.min(100, raw));
}

/**
 * AGENTS.md outreach priority thresholds for enriched leads.
 */
export function getOutreachPriority(
  score: number
): "high" | "standard" | "held" | "deprioritized" {
  if (score >= 70) return "high";        // Queue for outreach (high priority)
  if (score >= 50) return "standard";    // Queue for outreach (standard)
  if (score >= 30) return "held";        // Outreach only if capacity allows
  return "deprioritized";                 // Check again next month
}

/**
 * Map a numeric enrichment score to a human-readable stage.
 */
export function getEnrichedLeadStage(
  score: number,
): "cold" | "warm" | "hot" | "urgent" {
  if (score >= 80) return "urgent";
  if (score >= 55) return "hot";
  if (score >= 30) return "warm";
  return "cold";
}
