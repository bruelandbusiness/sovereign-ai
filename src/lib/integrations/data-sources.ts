/**
 * County permit and property data source configurations.
 *
 * Defines the available data sources for lead discovery including county
 * permit feeds and property records, along with helper functions for
 * selecting the best source based on vertical, budget, and data needs.
 */

// ---------------------------------------------------------------------------
// Permit Sources
// ---------------------------------------------------------------------------

/** Describes a county building-permit data feed. */
export interface PermitSource {
  county: string;
  state: string;
  url: string;
  method: "api" | "scraping";
  status: "active" | "research_needed" | "unavailable";
  notes?: string;
}

/** Known permit data sources, indexed by county. */
export const PERMIT_SOURCES: PermitSource[] = [
  {
    county: "Maricopa County",
    state: "AZ",
    url: "https://eservices.maricopa.gov/buildinginspections/",
    method: "scraping",
    status: "active",
  },
  {
    county: "Mohave County",
    state: "AZ",
    url: "",
    method: "scraping",
    status: "research_needed",
    notes: "May require in-person records request",
  },
  {
    county: "Pima County",
    state: "AZ",
    url: "https://www.pima.gov/571/Permits",
    method: "scraping",
    status: "active",
  },
  {
    county: "Harris County",
    state: "TX",
    url: "https://permitting.harriscountytx.gov/",
    method: "scraping",
    status: "active",
  },
  {
    county: "Clark County",
    state: "NV",
    url: "https://www.clarkcountynv.gov/government/departments/building_and_fire_prevention/",
    method: "scraping",
    status: "active",
  },
];

/** A parsed building permit record. */
export interface PermitData {
  permitNumber: string;
  address: string;
  /** Permit category: residential, commercial, HVAC, roofing, electrical, plumbing. */
  permitType: string;
  issueDate: Date;
  estimatedValue?: number;
  ownerName?: string;
  contractorName?: string;
  status: "issued" | "in_progress" | "final" | "expired";
}

/** Global scraping configuration for permit sources. */
export const PERMIT_SCRAPING_CONFIG = {
  /** Maximum requests per second to any single permit source. */
  rateLimit: 2,
  /** How long to cache scraped results before re-fetching (hours). */
  cacheDurationHours: 24,
  /** Whether to automatically retry on transient failures. */
  retryOnFailure: true,
  /** Maximum number of retry attempts per request. */
  maxRetries: 3,
} as const;

// ---------------------------------------------------------------------------
// Property Data Sources
// ---------------------------------------------------------------------------

/** Supported property-data provider types. */
export type PropertySourceType =
  | "redfin_scraping"
  | "attom_api"
  | "county_assessor";

/** Describes a property data provider and its characteristics. */
export interface PropertySource {
  type: PropertySourceType;
  name: string;
  method: "api" | "scraping";
  dataFields: string[];
  /** Estimated cost per single property lookup (USD). */
  costPerLookup: number;
  quality: "high" | "medium" | "low";
  risk?: string;
}

/** Available property data sources ordered by quality. */
export const PROPERTY_SOURCES: PropertySource[] = [
  {
    type: "redfin_scraping",
    name: "Redfin Data",
    method: "scraping",
    dataFields: [
      "recent_sales",
      "listing_price",
      "property_age",
      "square_footage",
      "lot_size",
    ],
    costPerLookup: 0,
    quality: "medium",
    risk: "May block automated access -- rotate user agents, respect robots.txt",
  },
  {
    type: "attom_api",
    name: "ATTOM Data API",
    method: "api",
    dataFields: [
      "property_details",
      "owner_info",
      "sale_history",
      "tax_records",
      "avm",
    ],
    costPerLookup: 0.3, // $0.10-0.50 average
    quality: "high",
  },
  {
    type: "county_assessor",
    name: "County Assessor Records",
    method: "scraping",
    dataFields: [
      "owner_name",
      "property_value",
      "year_built",
      "last_sale_date",
    ],
    costPerLookup: 0,
    quality: "medium",
    risk: "Format varies wildly by county",
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Return only the permit sources that are currently active and scrapable.
 *
 * @returns Array of permit sources with status "active".
 */
export function getActivePermitSources(): PermitSource[] {
  return PERMIT_SOURCES.filter((s) => s.status === "active");
}

/**
 * Look up the permit source configuration for a specific county.
 *
 * @param county  County name (case-insensitive partial match).
 * @returns       The matching permit source, or null if none found.
 */
export function getPermitSourceForCounty(county: string): PermitSource | null {
  const normalised = county.toLowerCase().trim();
  return (
    PERMIT_SOURCES.find((s) =>
      s.county.toLowerCase().includes(normalised),
    ) ?? null
  );
}

/**
 * Recommend the best property data source based on data requirements and
 * budget constraints.
 *
 * @param needsOwnerInfo  Whether the caller requires property-owner details.
 * @param budget          "free" limits to zero-cost sources; "paid" allows all.
 * @returns               The recommended property source.
 */
export function getBestPropertySource(
  needsOwnerInfo: boolean,
  budget: "free" | "paid",
): PropertySource {
  const candidates =
    budget === "free"
      ? PROPERTY_SOURCES.filter((s) => s.costPerLookup === 0)
      : [...PROPERTY_SOURCES];

  if (needsOwnerInfo) {
    // ATTOM is the best source for owner info if budget allows.
    const attom = candidates.find((s) => s.type === "attom_api");
    if (attom) return attom;

    // Fall back to county assessor which often has owner_name.
    const assessor = candidates.find((s) => s.type === "county_assessor");
    if (assessor) return assessor;
  }

  // Sort by quality (high > medium > low) and return the best available.
  const qualityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  candidates.sort(
    (a, b) => (qualityOrder[b.quality] ?? 0) - (qualityOrder[a.quality] ?? 0),
  );

  return candidates[0];
}

/**
 * Estimate the total cost of running a discovery batch against the specified
 * data sources.
 *
 * @param leadCount  Number of leads/properties to look up.
 * @param sources    Which property source types will be queried per lead.
 * @returns          Estimated total cost in USD.
 */
export function estimateDiscoveryCost(
  leadCount: number,
  sources: PropertySourceType[],
): number {
  let total = 0;

  for (const sourceType of sources) {
    const source = PROPERTY_SOURCES.find((s) => s.type === sourceType);
    if (source) {
      total += source.costPerLookup * leadCount;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Determine the recommended order of data sources to consult based on the
 * service vertical.
 *
 * For HVAC, roofing, electrical, and plumbing verticals, permit data is the
 * strongest signal. For general or real-estate-adjacent verticals, property
 * data from Redfin or ATTOM is preferred.
 *
 * @param vertical  Business vertical (e.g. "hvac", "roofing", "general").
 * @returns         Ordered list of property source types to query.
 */
export function getSourcePriority(vertical: string): PropertySourceType[] {
  const v = vertical.toLowerCase().trim();

  // Permit-first verticals: trades where active permits are the best lead signal.
  const permitFirstVerticals = [
    "hvac",
    "roofing",
    "electrical",
    "plumbing",
    "solar",
    "general_contractor",
  ];

  if (permitFirstVerticals.includes(v)) {
    // Permits are checked separately; for property enrichment prefer assessor
    // (free owner info) then ATTOM (paid but high quality) then Redfin.
    return ["county_assessor", "attom_api", "redfin_scraping"];
  }

  // Real-estate / general verticals: recent sales and listing data are most
  // useful, so Redfin comes first.
  return ["redfin_scraping", "attom_api", "county_assessor"];
}
