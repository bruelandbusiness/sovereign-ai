import { RawDiscoveredLead } from "./types";

/**
 * Score a discovered lead 0-100 based on four signal dimensions.
 *
 * - Property age signal (0-25): older properties score higher (HVAC/roofing targets)
 * - Trigger recency (0-25): more recent trigger events score higher
 * - Signal strength (0-25): multiple data signals from different sources score higher
 * - Data completeness (0-25): has phone, email, address, owner name
 */
export function scoreDiscoveredLead(lead: RawDiscoveredLead): number {
  let score = 0;

  // --- Property age signal (0-25) ---
  // Homes 20+ years old are prime targets for HVAC, roofing, plumbing work.
  // Scale: 0 years = 0, 10 years = 8, 20 years = 16, 30+ years = 25
  if (lead.propertyAge != null && lead.propertyAge > 0) {
    score += Math.min(25, Math.round((lead.propertyAge / 30) * 25));
  }

  // --- Trigger recency (0-25) ---
  // Recent events (permits, sales, reviews, seasonal) indicate active need.
  const triggerDate = lead.permitDate ?? lead.saleDate;
  if (triggerDate) {
    const daysSinceTrigger = Math.max(
      0,
      (Date.now() - triggerDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceTrigger <= 7) {
      score += 25;
    } else if (daysSinceTrigger <= 30) {
      score += 20;
    } else if (daysSinceTrigger <= 90) {
      score += 12;
    } else if (daysSinceTrigger <= 180) {
      score += 6;
    }
    // Older than 180 days: 0 recency points
  } else if (lead.seasonalTrigger) {
    // Seasonal triggers are current by definition
    score += 18;
  } else if (lead.reviewRating != null) {
    // Negative reviews are time-sensitive; assume recent
    score += 15;
  }

  // --- Signal strength (0-25) ---
  // More data signals from different dimensions indicate a stronger lead.
  let signalCount = 0;
  if (lead.propertyAge != null) signalCount++;
  if (lead.permitType) signalCount++;
  if (lead.permitDate) signalCount++;
  if (lead.saleDate) signalCount++;
  if (lead.salePrice != null) signalCount++;
  if (lead.reviewPlatform) signalCount++;
  if (lead.reviewRating != null) signalCount++;
  if (lead.competitorName) signalCount++;
  if (lead.seasonalTrigger) signalCount++;
  if (lead.propertyType) signalCount++;

  // Scale: 1 signal = 5, 2 = 10, 3 = 15, 4 = 20, 5+ = 25
  score += Math.min(25, signalCount * 5);

  // --- Data completeness (0-25) ---
  // Each contact/property field contributes to actionability.
  let completenessPoints = 0;
  if (lead.propertyAddress) completenessPoints += 7;
  if (lead.ownerName) completenessPoints += 6;
  if (lead.ownerPhone) completenessPoints += 6;
  if (lead.ownerEmail) completenessPoints += 6;
  score += Math.min(25, completenessPoints);

  return Math.min(100, Math.max(0, score));
}
