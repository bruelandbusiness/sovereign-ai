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
