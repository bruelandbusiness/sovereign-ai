/**
 * Lead scoring algorithm — assigns 0-100 score based on contact info,
 * source, status, recency, and data completeness.
 *
 * NOTE: Recency is intentionally time-dependent (newer leads score higher).
 * Use the `now` parameter to make scoring deterministic for tests and
 * batch re-scoring jobs.
 */

export interface LeadInput {
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  notes?: string | null;
  value?: number | null;
  createdAt: Date;
}

/** Canonical list of valid lead statuses. */
export const VALID_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "proposal",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof VALID_LEAD_STATUSES)[number];

/** Canonical list of valid lead sources. */
export const VALID_LEAD_SOURCES = [
  "chatbot",
  "website",
  "referral",
  "phone",
  "ads",
  "form",
  "social",
  "voice",
] as const;
export type LeadSource = (typeof VALID_LEAD_SOURCES)[number];

/** Canonical list of valid lead stages. */
export const VALID_LEAD_STAGES = [
  "new",
  "nurturing",
  "hot",
  "converted",
] as const;
export type LeadStage = (typeof VALID_LEAD_STAGES)[number];

const SOURCE_MULTIPLIER: Record<string, number> = {
  chatbot: 1.0,
  website: 1.1,
  referral: 1.3,
  phone: 1.2,
  ads: 1.0,
  form: 1.0,
  social: 1.0,
  voice: 1.2,
};

const STATUS_POINTS: Record<string, number> = {
  new: 0,
  contacted: 10,
  qualified: 20,
  appointment: 30,
  proposal: 40,
  won: 40,
  lost: 0,
};

function getRecencyPoints(createdAt: Date, now: Date): number {
  const ageMs = now.getTime() - createdAt.getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;

  if (ageMs < oneHour) return 15;
  if (ageMs < oneDay) return 10;
  if (ageMs < oneWeek) return 5;
  return 0;
}

/**
 * Score a lead from 0-100.
 *
 * @param lead   - Lead data to score.
 * @param now    - Optional reference time for recency calculation.
 *                 Defaults to `new Date()`. Pass an explicit value for
 *                 deterministic / testable scoring.
 */
export function scoreLead(lead: LeadInput, now: Date = new Date()): number {
  let raw = 0;

  // Contact info
  const hasEmail = Boolean(lead.email);
  const hasPhone = Boolean(lead.phone);
  if (hasEmail) raw += 15;
  if (hasPhone) raw += 20;
  if (hasEmail && hasPhone) raw += 10; // bonus for both

  // Source multiplier
  const multiplier = SOURCE_MULTIPLIER[lead.source] ?? 1.0;

  // Status points
  raw += STATUS_POINTS[lead.status] ?? 0;

  // Recency (time-dependent — pass `now` for deterministic results)
  raw += getRecencyPoints(lead.createdAt, now);

  // Data completeness
  if (lead.notes) raw += 5;
  if (lead.value != null && lead.value > 0) raw += 5;

  // Apply source multiplier and clamp to 0-100
  const score = Math.round(raw * multiplier);
  return Math.max(0, Math.min(100, score));
}

export function getLeadStage(score: number): LeadStage {
  if (score <= 20) return "new";
  if (score <= 40) return "nurturing";
  if (score <= 70) return "hot";
  return "converted";
}

/**
 * Validates whether a status string is a known lead status.
 */
export function isValidLeadStatus(s: string): s is LeadStatus {
  return (VALID_LEAD_STATUSES as readonly string[]).includes(s);
}

// ---------------------------------------------------------------------------
// Home-service lead qualification scoring
// ---------------------------------------------------------------------------

export type BusinessSize = "small" | "medium" | "large" | "unknown";

export interface LeadScoreFactors {
  hasEmail: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  source: string;
  responseTime: number;
  engagementCount: number;
  businessSize: BusinessSize;
  vertical: string;
  hasReviews: boolean;
  reviewCount: number;
}

export type LeadGrade = "A" | "B" | "C" | "D" | "F";

export interface LeadScore {
  total: number;
  grade: LeadGrade;
  factors: Record<string, number>;
  recommendation: string;
}

/** High-value verticals for home-service businesses. */
const HIGH_VALUE_VERTICALS = new Set([
  "hvac",
  "plumbing",
  "roofing",
  "electrical",
  "solar",
]);

/** Mid-value verticals for home-service businesses. */
const MID_VALUE_VERTICALS = new Set([
  "landscaping",
  "painting",
  "flooring",
  "fencing",
  "windows",
  "siding",
  "gutters",
  "pest-control",
  "garage-door",
]);

/** Source quality ranking (higher is better). */
const SOURCE_QUALITY: Record<string, number> = {
  referral: 20,
  organic: 16,
  "google-local": 16,
  "home-advisor": 14,
  "angi-leads": 14,
  website: 12,
  paid: 10,
  social: 8,
  outreach: 4,
  cold: 2,
};

/** Size-based fit score for home-service market. */
const SIZE_FIT: Record<BusinessSize, number> = {
  medium: 20,
  small: 15,
  large: 10,
  unknown: 5,
};

function scoreContactInfo(factors: LeadScoreFactors): Record<string, number> {
  const breakdown: Record<string, number> = {};
  if (factors.hasEmail) breakdown.email = 7;
  if (factors.hasPhone) breakdown.phone = 8;
  if (factors.hasEmail && factors.hasPhone) breakdown.bothContact = 3;
  if (factors.hasWebsite) breakdown.website = 2;
  return breakdown;
}

function scoreSource(source: string): number {
  const normalized = source.toLowerCase().trim();
  return SOURCE_QUALITY[normalized] ?? 6;
}

function scoreEngagement(factors: LeadScoreFactors): Record<string, number> {
  const breakdown: Record<string, number> = {};

  // Response time scoring (0-10): faster response = hotter lead
  if (factors.responseTime <= 5) {
    breakdown.responseTime = 10;
  } else if (factors.responseTime <= 30) {
    breakdown.responseTime = 8;
  } else if (factors.responseTime <= 60) {
    breakdown.responseTime = 6;
  } else if (factors.responseTime <= 240) {
    breakdown.responseTime = 3;
  } else if (factors.responseTime <= 1440) {
    breakdown.responseTime = 1;
  } else {
    breakdown.responseTime = 0;
  }

  // Engagement count scoring (0-10)
  if (factors.engagementCount >= 5) {
    breakdown.engagementCount = 10;
  } else if (factors.engagementCount >= 3) {
    breakdown.engagementCount = 7;
  } else if (factors.engagementCount >= 1) {
    breakdown.engagementCount = 4;
  } else {
    breakdown.engagementCount = 0;
  }

  return breakdown;
}

function scoreBusinessFit(factors: LeadScoreFactors): Record<string, number> {
  const breakdown: Record<string, number> = {};
  const v = factors.vertical.toLowerCase().trim();

  if (HIGH_VALUE_VERTICALS.has(v)) {
    breakdown.vertical = 12;
  } else if (MID_VALUE_VERTICALS.has(v)) {
    breakdown.vertical = 8;
  } else if (v.length > 0) {
    breakdown.vertical = 4;
  } else {
    breakdown.vertical = 0;
  }

  breakdown.businessSize = SIZE_FIT[factors.businessSize] ?? 5;

  // Cap business fit at 20
  const fitTotal = breakdown.vertical + breakdown.businessSize;
  if (fitTotal > 20) {
    const scale = 20 / fitTotal;
    breakdown.vertical = Math.round(breakdown.vertical * scale);
    breakdown.businessSize = Math.round(breakdown.businessSize * scale);
  }

  return breakdown;
}

function scoreOnlinePresence(
  factors: LeadScoreFactors,
): Record<string, number> {
  const breakdown: Record<string, number> = {};

  if (factors.hasReviews) {
    breakdown.hasReviews = 5;
    if (factors.reviewCount >= 50) {
      breakdown.reviewVolume = 10;
    } else if (factors.reviewCount >= 20) {
      breakdown.reviewVolume = 7;
    } else if (factors.reviewCount >= 5) {
      breakdown.reviewVolume = 4;
    } else {
      breakdown.reviewVolume = 2;
    }
  } else {
    breakdown.hasReviews = 0;
    breakdown.reviewVolume = 0;
  }

  if (factors.hasWebsite) {
    breakdown.websitePresence = 5;
  } else {
    breakdown.websitePresence = 0;
  }

  // Cap online presence at 20
  const total =
    breakdown.hasReviews + breakdown.reviewVolume + breakdown.websitePresence;
  if (total > 20) {
    const scale = 20 / total;
    breakdown.hasReviews = Math.round(breakdown.hasReviews * scale);
    breakdown.reviewVolume = Math.round(breakdown.reviewVolume * scale);
    breakdown.websitePresence = Math.round(breakdown.websitePresence * scale);
  }

  return breakdown;
}

function gradeFromScore(score: number): LeadGrade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

function recommendationForGrade(grade: LeadGrade): string {
  switch (grade) {
    case "A":
      return "Hot lead — call immediately and schedule an estimate";
    case "B":
      return "Strong prospect — follow up within 24 hours with a personalized offer";
    case "C":
      return "Moderate interest — add to nurture sequence and monitor engagement";
    case "D":
      return "Low priority — include in drip campaign for long-term conversion";
    case "F":
      return "Unqualified — archive and revisit only if new signals appear";
  }
}

/**
 * Calculate a comprehensive lead score for home-service business leads.
 *
 * Scoring breakdown (0-100):
 *   - Contact completeness  (0-20)
 *   - Source quality         (0-20)
 *   - Engagement level       (0-20)
 *   - Business fit           (0-20)
 *   - Online presence        (0-20)
 */
export function calculateLeadScore(factors: LeadScoreFactors): LeadScore {
  const allFactors: Record<string, number> = {};

  // Contact info (max 20)
  const contact = scoreContactInfo(factors);
  Object.assign(allFactors, contact);

  // Source quality (max 20)
  const sourcePoints = scoreSource(factors.source);
  allFactors.source = sourcePoints;

  // Engagement (max 20)
  const engagement = scoreEngagement(factors);
  Object.assign(allFactors, engagement);

  // Business fit (max 20)
  const fit = scoreBusinessFit(factors);
  Object.assign(allFactors, fit);

  // Online presence (max 20)
  const presence = scoreOnlinePresence(factors);
  Object.assign(allFactors, presence);

  const contactTotal = Object.values(contact).reduce((a, b) => a + b, 0);
  const engagementTotal = Object.values(engagement).reduce((a, b) => a + b, 0);
  const fitTotal = Object.values(fit).reduce((a, b) => a + b, 0);
  const presenceTotal = Object.values(presence).reduce((a, b) => a + b, 0);

  const raw =
    Math.min(contactTotal, 20) +
    Math.min(sourcePoints, 20) +
    Math.min(engagementTotal, 20) +
    Math.min(fitTotal, 20) +
    Math.min(presenceTotal, 20);

  const total = Math.max(0, Math.min(100, raw));
  const grade = gradeFromScore(total);

  return {
    total,
    grade,
    factors: allFactors,
    recommendation: recommendationForGrade(grade),
  };
}

// Re-export enhanced scoring for enriched leads
export { scoreEnrichedLead, getEnrichedLeadStage } from "@/lib/enrichment/enhanced-scoring";
