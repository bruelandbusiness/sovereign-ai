/**
 * Local Citation Building Module
 *
 * Manages citation sources across three tiers, performs NAP (Name, Address, Phone)
 * consistency audits, and generates prioritized recommendations for local SEO clients.
 */

/** Classification tier for a citation source. */
export type CitationTier = "tier_1_critical" | "tier_2_important" | "tier_3_vertical";

/** A directory or platform where a business listing can appear. */
export interface CitationSource {
  /** Display name of the citation source. */
  name: string;
  /** Base URL of the citation source. */
  url: string;
  /** Tier classification determining priority. */
  tier: CitationTier;
  /** Industry vertical (only for tier 3 sources). */
  vertical?: string;
  /** Priority label (e.g. "MUST HAVE" for tier 1). */
  priority?: string;
}

/** Master list of citation sources across all tiers. */
export const CITATION_SOURCES: CitationSource[] = [
  // Tier 1 — Critical (MUST HAVE for every client)
  { name: "Google Business Profile", url: "google.com/business", tier: "tier_1_critical", priority: "MUST HAVE" },
  { name: "Yelp", url: "yelp.com", tier: "tier_1_critical", priority: "MUST HAVE" },
  { name: "Facebook Business Page", url: "facebook.com", tier: "tier_1_critical", priority: "MUST HAVE" },
  { name: "BBB", url: "bbb.org", tier: "tier_1_critical", priority: "MUST HAVE" },
  { name: "Apple Maps", url: "mapsconnect.apple.com", tier: "tier_1_critical", priority: "MUST HAVE" },
  { name: "Bing Places", url: "bingplaces.com", tier: "tier_1_critical", priority: "MUST HAVE" },

  // Tier 2 — Important
  { name: "Angi", url: "angi.com", tier: "tier_2_important" },
  { name: "HomeAdvisor", url: "homeadvisor.com", tier: "tier_2_important" },
  { name: "Thumbtack", url: "thumbtack.com", tier: "tier_2_important" },
  { name: "Nextdoor Business", url: "nextdoor.com", tier: "tier_2_important" },
  { name: "Yellow Pages", url: "yellowpages.com", tier: "tier_2_important" },
  { name: "Manta", url: "manta.com", tier: "tier_2_important" },
  { name: "Mapquest", url: "mapquest.com", tier: "tier_2_important" },

  // Tier 3 — Vertical-specific
  // HVAC
  { name: "HVAC.com", url: "hvac.com", tier: "tier_3_vertical", vertical: "hvac" },
  { name: "Trane Dealer Locator", url: "trane.com/dealers", tier: "tier_3_vertical", vertical: "hvac" },
  { name: "Carrier Dealer Locator", url: "carrier.com/dealers", tier: "tier_3_vertical", vertical: "hvac" },
  { name: "ACCA Member Directory", url: "acca.org", tier: "tier_3_vertical", vertical: "hvac" },
  // Roofing
  { name: "Roofing Contractor", url: "roofingcontractor.com", tier: "tier_3_vertical", vertical: "roofing" },
  { name: "GAF Contractor Search", url: "gaf.com", tier: "tier_3_vertical", vertical: "roofing" },
  { name: "Owens Corning Roofing", url: "owenscorning.com", tier: "tier_3_vertical", vertical: "roofing" },
  // Plumbing
  { name: "PHCC Association", url: "phccweb.org", tier: "tier_3_vertical", vertical: "plumbing" },
  // Electrical
  { name: "Electrical Contractor Magazine", url: "ecmag.com", tier: "tier_3_vertical", vertical: "electrical" },
];

// ---------------------------------------------------------------------------
// Citation Audit Types
// ---------------------------------------------------------------------------

/** Status of a single citation listing for a client. */
export interface CitationStatus {
  /** The citation source this status refers to. */
  source: CitationSource;
  /** Whether the listing has been claimed/verified. */
  claimed: boolean;
  /** Whether Name, Address, Phone match the standardized values. */
  napConsistent: boolean;
  /** Whether photos, descriptions, and services have been added. */
  optimized: boolean;
  /** Number of duplicate listings found for this source. */
  duplicates: number;
  /** When this citation was last checked. */
  lastChecked?: Date;
  /** Free-form notes about this citation. */
  notes?: string;
}

/** A full citation audit for a client business. */
export interface CitationAudit {
  /** Unique identifier for the client. */
  clientId: string;
  /** Official business name (must be identical across all citations). */
  businessName: string;
  /** USPS-standardized address string. */
  standardAddress: string;
  /** Phone number in (XXX) XXX-XXXX format. */
  standardPhone: string;
  /** Status of each applicable citation source. */
  citations: CitationStatus[];
  /** Overall NAP consistency score from 0 to 100. */
  consistencyScore: number;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns all applicable citation sources for a client in a given vertical.
 * Includes all tier 1 (critical) + tier 2 (important) sources plus tier 3
 * sources that match the specified vertical.
 *
 * @param vertical - The industry vertical (e.g. "hvac", "roofing", "plumbing").
 * @returns Array of applicable citation sources ordered by tier priority.
 */
export function getCitationsForClient(vertical: string): CitationSource[] {
  const normalizedVertical = vertical.toLowerCase().trim();
  return CITATION_SOURCES.filter((source) => {
    if (source.tier === "tier_1_critical" || source.tier === "tier_2_important") {
      return true;
    }
    return source.tier === "tier_3_vertical" && source.vertical === normalizedVertical;
  });
}

/**
 * Initializes a citation audit for a client with all applicable sources
 * marked as unclaimed. Phone and address are standardized automatically.
 *
 * @param clientId - Unique client identifier.
 * @param businessName - Official business name.
 * @param address - Business address (will be USPS-standardized).
 * @param phone - Business phone number (will be normalized).
 * @param vertical - Industry vertical for tier 3 source selection.
 * @returns A new CitationAudit with all citations initialized as unclaimed.
 */
export function createCitationAudit(
  clientId: string,
  businessName: string,
  address: string,
  phone: string,
  vertical: string,
): CitationAudit {
  const sources = getCitationsForClient(vertical);
  const citations: CitationStatus[] = sources.map((source) => ({
    source,
    claimed: false,
    napConsistent: false,
    optimized: false,
    duplicates: 0,
  }));

  const audit: CitationAudit = {
    clientId,
    businessName: businessName.trim(),
    standardAddress: standardizeAddress(address),
    standardPhone: standardizePhone(phone),
    citations,
    consistencyScore: 0,
  };

  audit.consistencyScore = calculateConsistencyScore(audit);
  return audit;
}

/**
 * Updates the status of a specific citation source within an audit.
 * Returns a new audit object with the updated citation and recalculated
 * consistency score.
 *
 * @param audit - The current citation audit.
 * @param sourceName - Name of the citation source to update.
 * @param status - Partial status fields to merge.
 * @returns Updated CitationAudit with recalculated consistency score.
 */
export function updateCitationStatus(
  audit: CitationAudit,
  sourceName: string,
  status: Partial<CitationStatus>,
): CitationAudit {
  const updatedCitations = audit.citations.map((citation) => {
    if (citation.source.name === sourceName) {
      return { ...citation, ...status, source: citation.source };
    }
    return citation;
  });

  const updatedAudit: CitationAudit = {
    ...audit,
    citations: updatedCitations,
  };

  updatedAudit.consistencyScore = calculateConsistencyScore(updatedAudit);
  return updatedAudit;
}

/**
 * Calculates the NAP consistency score as a percentage of claimed citations
 * that have consistent Name, Address, and Phone information.
 *
 * @param audit - The citation audit to score.
 * @returns A score from 0 to 100. Returns 0 if no citations are claimed.
 */
export function calculateConsistencyScore(audit: CitationAudit): number {
  const claimed = audit.citations.filter((c) => c.claimed);
  if (claimed.length === 0) return 0;

  const consistent = claimed.filter((c) => c.napConsistent).length;
  return Math.round((consistent / claimed.length) * 100);
}

/**
 * Generates a prioritized list of recommendations based on the audit state.
 *
 * Priority order:
 * 1. Claim unclaimed tier 1 (critical) sources first
 * 2. Fix NAP inconsistencies on claimed listings
 * 3. Remove/merge duplicate listings
 * 4. Claim unclaimed tier 2 (important) sources
 * 5. Claim unclaimed tier 3 (vertical) sources
 * 6. Optimize claimed listings (photos, descriptions, services)
 *
 * @param audit - The citation audit to analyze.
 * @returns Array of human-readable recommendation strings.
 */
export function getRecommendations(audit: CitationAudit): string[] {
  const recommendations: string[] = [];

  // 1. Claim unclaimed tier 1 sources
  const unclaimedTier1 = audit.citations.filter(
    (c) => !c.claimed && c.source.tier === "tier_1_critical",
  );
  for (const c of unclaimedTier1) {
    recommendations.push(
      `[CRITICAL] Claim ${c.source.name} listing — this is a MUST HAVE citation source.`,
    );
  }

  // 2. Fix NAP inconsistencies
  const inconsistent = audit.citations.filter((c) => c.claimed && !c.napConsistent);
  for (const c of inconsistent) {
    recommendations.push(
      `[FIX NAP] Update ${c.source.name} — NAP data does not match standardized business information.`,
    );
  }

  // 3. Remove/merge duplicates
  const withDuplicates = audit.citations.filter((c) => c.duplicates > 0);
  for (const c of withDuplicates) {
    recommendations.push(
      `[DUPLICATES] Merge or remove ${c.duplicates} duplicate listing(s) on ${c.source.name}.`,
    );
  }

  // 4. Claim unclaimed tier 2 sources
  const unclaimedTier2 = audit.citations.filter(
    (c) => !c.claimed && c.source.tier === "tier_2_important",
  );
  for (const c of unclaimedTier2) {
    recommendations.push(`[IMPORTANT] Claim ${c.source.name} listing to strengthen citation profile.`);
  }

  // 5. Claim unclaimed tier 3 sources
  const unclaimedTier3 = audit.citations.filter(
    (c) => !c.claimed && c.source.tier === "tier_3_vertical",
  );
  for (const c of unclaimedTier3) {
    recommendations.push(
      `[VERTICAL] Claim ${c.source.name} listing for industry-specific visibility.`,
    );
  }

  // 6. Optimize unoptimized claimed listings
  const unoptimized = audit.citations.filter((c) => c.claimed && !c.optimized);
  for (const c of unoptimized) {
    recommendations.push(
      `[OPTIMIZE] Add photos, descriptions, and services to ${c.source.name} listing.`,
    );
  }

  return recommendations;
}

/**
 * Normalizes a phone number string to the standard (XXX) XXX-XXXX format.
 * NAP consistency requires phone format to be identical across all citations.
 *
 * @param phone - Raw phone number string (digits, dashes, dots, spaces, parens accepted).
 * @returns Phone number in (XXX) XXX-XXXX format.
 * @throws Error if the phone number does not contain exactly 10 digits.
 */
export function standardizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Handle 11-digit numbers starting with 1 (country code)
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalized.length !== 10) {
    throw new Error(
      `Invalid phone number: expected 10 digits but got ${normalized.length} from "${phone}".`,
    );
  }

  const area = normalized.slice(0, 3);
  const prefix = normalized.slice(3, 6);
  const line = normalized.slice(6, 10);
  return `(${area}) ${prefix}-${line}`;
}

/**
 * Standardizes an address to USPS format with common abbreviations.
 * NAP consistency requires the address to be identical across all citations.
 *
 * Applies standard USPS abbreviations:
 * - Street -> St, Avenue -> Ave, Boulevard -> Blvd, Drive -> Dr,
 *   Lane -> Ln, Road -> Rd, Court -> Ct, Circle -> Cir,
 *   Suite -> Ste, Apartment -> Apt, North -> N, South -> S,
 *   East -> E, West -> W
 *
 * @param address - Raw address string.
 * @returns USPS-standardized address string.
 */
export function standardizeAddress(address: string): string {
  const abbreviations: Record<string, string> = {
    street: "St",
    avenue: "Ave",
    boulevard: "Blvd",
    drive: "Dr",
    lane: "Ln",
    road: "Rd",
    court: "Ct",
    circle: "Cir",
    suite: "Ste",
    apartment: "Apt",
    north: "N",
    south: "S",
    east: "E",
    west: "W",
  };

  let standardized = address.trim();

  // Collapse multiple spaces
  standardized = standardized.replace(/\s+/g, " ");

  // Apply USPS abbreviations (word-boundary aware, case-insensitive)
  for (const [full, abbr] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${full}\\b`, "gi");
    standardized = standardized.replace(regex, abbr);
  }

  return standardized;
}
