/**
 * Referral Program Module
 *
 * Manages the client referral workflow: automatic ask at 60 days,
 * $500 credit on successful sign-up, tracking, and metrics.
 */

import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Global referral program configuration. */
export interface ReferralConfig {
  /** Days after client signup to auto-ask for referral. */
  autoAskDayThreshold: number;
  /** Credit amount (in dollars) for a successful referral. */
  creditAmount: number;
  /** Minimum client health score required before asking for a referral. */
  minHealthScore: number;
}

/** Result of evaluating whether a client is eligible for a referral ask. */
export interface ReferralRequest {
  clientId: string;
  clientName: string;
  daysSinceSignup: number;
  healthScore: number;
  eligibleForAsk: boolean;
  /** Reason the client is NOT eligible (omitted when eligible). */
  reason?: string;
}

/** A referral record tracking one introduction through its lifecycle. */
export interface Referral {
  id: string;
  referrerId: string;
  referredName: string;
  referredEmail?: string;
  referredPhone?: string;
  status: "pending" | "contacted" | "signed" | "credited";
  creditApplied: boolean;
  createdAt: Date;
}

/** Aggregate metrics across a set of referrals. */
export interface ReferralMetrics {
  total: number;
  pending: number;
  signed: number;
  credited: number;
  totalCreditsIssued: number;
  /** Ratio of signed referrals to total referrals (0-1). */
  conversionRate: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default referral program settings. */
export const REFERRAL_CONFIG: ReferralConfig = {
  autoAskDayThreshold: 60,
  creditAmount: 500,
  minHealthScore: 70,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escapes a string for safe inclusion in HTML content.
 *
 * @param str - Raw string to escape.
 * @returns HTML-safe string.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Evaluates whether a client is eligible for a referral ask.
 *
 * Eligible when:
 * - 60+ days since signup
 * - Health score >= 70
 * - Not already asked in the last 90 days
 *
 * @param daysSinceSignup - Number of days since the client signed up.
 * @param healthScore     - Current client health score (0-100).
 * @param alreadyAsked    - Whether the client was asked within the last 90 days.
 * @returns A {@link ReferralRequest} with eligibility details. `clientId` and
 *          `clientName` are left as empty strings -- the caller should populate
 *          them from their own records.
 */
export function isEligibleForReferralAsk(
  daysSinceSignup: number,
  healthScore: number,
  alreadyAsked: boolean,
): ReferralRequest {
  const base: ReferralRequest = {
    clientId: "",
    clientName: "",
    daysSinceSignup,
    healthScore,
    eligibleForAsk: false,
  };

  if (daysSinceSignup < REFERRAL_CONFIG.autoAskDayThreshold) {
    return {
      ...base,
      reason: `Client has only been signed up for ${daysSinceSignup} days (minimum ${REFERRAL_CONFIG.autoAskDayThreshold}).`,
    };
  }

  if (healthScore < REFERRAL_CONFIG.minHealthScore) {
    return {
      ...base,
      reason: `Health score ${healthScore} is below the minimum threshold of ${REFERRAL_CONFIG.minHealthScore}.`,
    };
  }

  if (alreadyAsked) {
    return {
      ...base,
      reason: "Client was already asked for a referral within the last 90 days.",
    };
  }

  return { ...base, eligibleForAsk: true };
}

/**
 * Generates a warm, personal referral-ask email from Seth.
 *
 * @param clientName  - Full name of the client.
 * @param creditAmount - Dollar credit offered for a successful referral.
 * @returns Object with `subject` and `html` body.
 */
export function generateReferralAskEmail(
  clientName: string,
  creditAmount: number,
): { subject: string; html: string } {
  const safeName = escapeHtml(clientName);
  const safeCredit = escapeHtml(`$${creditAmount}`);

  const subject = `Quick question for you, ${clientName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hey ${safeName},</p>

  <p>
    Hope things are going well on your end. It's been great working together
    and seeing the leads come in for your business.
  </p>

  <p>
    I wanted to ask -- do you know any other contractors or home-service pros
    who could use a steady flow of quality leads? We've got capacity to take
    on a few more clients and I'd love to help someone you trust.
  </p>

  <p>
    If you send someone our way and they sign up, I'll knock
    <strong>${safeCredit}</strong> off your next month as a thank-you.
    No strings attached.
  </p>

  <p>
    Just reply to this email with their name and number (or have them reach
    out directly) and I'll take it from there.
  </p>

  <p>Thanks for being awesome,<br/>Seth</p>
</body>
</html>`;

  return { subject, html };
}

/**
 * Generates a short, friendly referral-ask SMS message.
 *
 * @param clientFirstName - Client's first name.
 * @param creditAmount    - Dollar credit offered for a successful referral.
 * @returns SMS body string.
 */
export function generateReferralAskSms(
  clientFirstName: string,
  creditAmount: number,
): string {
  return (
    `Hey ${clientFirstName}, loving working with you. Know any other contractors ` +
    `who could use more leads? We'll give you $${creditAmount} off your next month ` +
    `for any referral that signs up. Just reply with their name and number.`
  );
}

/**
 * Creates a new referral record in "pending" status.
 *
 * @param referrerId    - ID of the client making the referral.
 * @param referredName  - Name of the person being referred.
 * @param referredEmail - (Optional) email of the referred person.
 * @param referredPhone - (Optional) phone of the referred person.
 * @returns A new {@link Referral} object.
 */
export function trackReferral(
  referrerId: string,
  referredName: string,
  referredEmail?: string,
  referredPhone?: string,
): Referral {
  return {
    id: randomUUID(),
    referrerId,
    referredName,
    referredEmail,
    referredPhone,
    status: "pending",
    creditApplied: false,
    createdAt: new Date(),
  };
}

/**
 * Marks a referral as credited (the referring client received their discount).
 *
 * @param referral - The referral to credit.
 * @returns A new {@link Referral} with `status: "credited"` and `creditApplied: true`.
 */
export function creditReferral(referral: Referral): Referral {
  return {
    ...referral,
    status: "credited",
    creditApplied: true,
  };
}

/**
 * Computes aggregate metrics for a collection of referrals.
 *
 * @param referrals - Array of {@link Referral} records.
 * @returns A {@link ReferralMetrics} summary.
 */
export function getReferralMetrics(referrals: Referral[]): ReferralMetrics {
  const total = referrals.length;
  const pending = referrals.filter((r) => r.status === "pending").length;
  const signed = referrals.filter(
    (r) => r.status === "signed" || r.status === "credited",
  ).length;
  const credited = referrals.filter((r) => r.status === "credited").length;
  const totalCreditsIssued = credited * REFERRAL_CONFIG.creditAmount;
  const conversionRate = total > 0 ? Math.round((signed / total) * 10000) / 10000 : 0;

  return { total, pending, signed, credited, totalCreditsIssued, conversionRate };
}
