/**
 * Local SEO Service Packages Module
 *
 * Defines the SEO service tiers, on-page SEO templates, and tracking metrics
 * for the Sovereign Empire platform.
 */

// ---------------------------------------------------------------------------
// Service Packages
// ---------------------------------------------------------------------------

/** An SEO service package with pricing and feature list. */
export interface SEOPackage {
  /** Display name of the package. */
  name: string;
  /** Monthly price in USD (0 = included with all plans). */
  price: number;
  /** Whether this package is included with all plans at no extra cost. */
  included: boolean;
  /** List of features provided by this package. */
  features: string[];
}

/** All available SEO service packages. */
export const SEO_PACKAGES: SEOPackage[] = [
  {
    name: "Included with All Plans",
    price: 0,
    included: true,
    features: [
      "Review request automation (SMS + email after completed jobs)",
      "Review monitoring + response drafting",
      "Monthly review velocity report",
    ],
  },
  {
    name: "Local SEO Boost",
    price: 500,
    included: false,
    features: [
      "Google Business Profile optimization",
      "Google Posts weekly (4/month)",
      "Citation building (Tier 1 + 2)",
      "Citation audit and cleanup",
      "Monthly ranking report (Map Pack position tracking)",
      "Competitor review monitoring",
      "On-page SEO recommendations",
    ],
  },
  {
    name: "Full SEO",
    price: 1500,
    included: false,
    features: [
      "Everything in Local SEO Boost",
      "On-page SEO implementation (title tags, schema, content)",
      "Service area page creation",
      "Monthly blog post (SEO-optimized, Claude-generated)",
      "Link building (local directories, supplier links, associations)",
      "Monthly technical SEO audit",
      "Quarterly content strategy update",
    ],
  },
];

/**
 * Finds a package by its exact name.
 *
 * @param name - The package name to search for.
 * @returns The matching SEOPackage or null if not found.
 */
export function getPackageByName(name: string): SEOPackage | null {
  return SEO_PACKAGES.find((pkg) => pkg.name === name) ?? null;
}

/**
 * Returns the features that are included with all plans at no extra cost.
 *
 * @returns Array of feature description strings.
 */
export function getIncludedFeatures(): string[] {
  const included = SEO_PACKAGES.find((pkg) => pkg.included);
  return included ? included.features : [];
}

/**
 * Returns only the paid add-on packages (excludes the included-with-all-plans package).
 *
 * @returns Array of SEOPackage objects that require additional payment.
 */
export function getAddOnPackages(): SEOPackage[] {
  return SEO_PACKAGES.filter((pkg) => !pkg.included);
}

// ---------------------------------------------------------------------------
// On-Page SEO Templates
// ---------------------------------------------------------------------------

/** A template for generating SEO title tags by page type. */
export interface TitleTagTemplate {
  /** The type of page this template applies to. */
  pageType: "homepage" | "service_page";
  /** The template string with placeholders. */
  template: string;
  /** An example of a generated title tag. */
  example: string;
}

/** Pre-defined title tag templates by page type. */
export const TITLE_TAG_TEMPLATES: TitleTagTemplate[] = [
  {
    pageType: "homepage",
    template: "{Service} in {City}, {State} | {Company Name}",
    example: "HVAC Repair in Lake Havasu City, AZ | The Weatherman AC",
  },
  {
    pageType: "service_page",
    template: "{Specific Service} in {City} | {Company Name}",
    example: "AC Installation in Lake Havasu City | The Weatherman AC",
  },
];

/** Template configuration for structured data (JSON-LD) schema markup. */
export interface SchemaTemplate {
  /** Schema.org type (e.g. "HVACBusiness", "Plumber", "RoofingContractor"). */
  type: string;
  /** Required and recommended fields for this schema type. */
  fields: string[];
}

/**
 * Generates an SEO-optimized title tag for a given page type.
 *
 * Homepage format: "{Service} in {City}, {State} | {Company Name}"
 * Service page format: "{Service} in {City} | {Company Name}"
 *
 * @param pageType - Whether this is a homepage or service page.
 * @param service - The primary service (e.g. "HVAC Repair").
 * @param city - The target city name.
 * @param state - The state abbreviation (used for homepage only).
 * @param companyName - The business name.
 * @returns A formatted title tag string.
 */
export function generateTitleTag(
  pageType: "homepage" | "service_page",
  service: string,
  city: string,
  state: string,
  companyName: string,
): string {
  if (pageType === "homepage") {
    return `${service} in ${city}, ${state} | ${companyName}`;
  }
  return `${service} in ${city} | ${companyName}`;
}

/**
 * Generates an SEO-optimized meta description. Ensures the result does not
 * exceed 155 characters. Includes the service, city, differentiator, and a
 * call-to-action with the phone number.
 *
 * @param service - The primary service offered.
 * @param city - The target city name.
 * @param differentiator - A unique selling proposition.
 * @param phone - The business phone number for the CTA.
 * @returns A meta description string (max 155 characters).
 */
export function generateMetaDescription(
  service: string,
  city: string,
  differentiator: string,
  phone: string,
): string {
  const full = `${service} in ${city}. ${differentiator}. Call ${phone} today!`;
  if (full.length <= 155) {
    return full;
  }
  // Truncate to 152 chars + "..."
  return `${full.slice(0, 152)}...`;
}

/**
 * Generates an H1 heading tag for a page.
 *
 * Homepage format: "{Service} in {City}"
 * Service page format: "Professional {Service} in {City}"
 *
 * @param pageType - Whether this is a homepage or service page.
 * @param service - The primary service.
 * @param city - The target city name.
 * @returns A formatted H1 string.
 */
export function generateH1(
  pageType: "homepage" | "service_page",
  service: string,
  city: string,
): string {
  if (pageType === "homepage") {
    return `${service} in ${city}`;
  }
  return `Professional ${service} in ${city}`;
}

/**
 * Generates a LocalBusiness JSON-LD schema object for structured data markup.
 * Outputs a fully-formed schema.org object ready to be serialized into a
 * `<script type="application/ld+json">` tag.
 *
 * @param config - Business configuration for schema generation.
 * @param config.type - Schema.org business type (e.g. "HVACBusiness").
 * @param config.name - Business name.
 * @param config.address - Business address components.
 * @param config.phone - Business phone number.
 * @param config.website - Business website URL.
 * @param config.hours - Array of opening hours in schema.org format.
 * @param config.areaServed - Array of cities/areas served.
 * @param config.priceRange - Optional price range indicator (e.g. "$$").
 * @param config.rating - Optional aggregate rating data.
 * @returns A JSON-LD schema object ready for serialization.
 */
export function generateLocalBusinessSchema(config: {
  type: string;
  name: string;
  address: { street: string; city: string; state: string; zip: string };
  phone: string;
  website: string;
  hours: string[];
  areaServed: string[];
  priceRange?: string;
  rating?: { value: number; count: number };
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": config.type,
    name: config.name,
    telephone: config.phone,
    url: config.website,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.address.street,
      addressLocality: config.address.city,
      addressRegion: config.address.state,
      postalCode: config.address.zip,
      addressCountry: "US",
    },
    openingHoursSpecification: config.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h,
    })),
    areaServed: config.areaServed.map((area) => ({
      "@type": "City",
      name: area,
    })),
  };

  if (config.priceRange) {
    schema.priceRange = config.priceRange;
  }

  if (config.rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: config.rating.value,
      reviewCount: config.rating.count,
    };
  }

  return schema;
}

// ---------------------------------------------------------------------------
// SEO Metrics
// ---------------------------------------------------------------------------

/** How often an SEO metric should be measured. */
export type MetricFrequency = "weekly" | "monthly" | "quarterly";

/** A trackable SEO performance metric. */
export interface SEOMetric {
  /** Machine-readable metric identifier. */
  name: string;
  /** How often this metric should be measured. */
  frequency: MetricFrequency;
  /** Human-readable description of what this metric tracks. */
  description: string;
}

/** All local SEO metrics tracked by the platform. */
export const LOCAL_SEO_METRICS: SEOMetric[] = [
  // Weekly
  { name: "new_reviews", frequency: "weekly", description: "New reviews received" },
  { name: "average_rating", frequency: "weekly", description: "Average rating (current)" },
  { name: "review_response_rate", frequency: "weekly", description: "Review response rate %" },
  { name: "google_posts_published", frequency: "weekly", description: "Google Posts published" },
  // Monthly
  { name: "map_pack_position", frequency: "monthly", description: "Map Pack position for top 5 keywords" },
  { name: "total_review_count", frequency: "monthly", description: "Total review count (vs last month)" },
  { name: "review_velocity", frequency: "monthly", description: "Reviews/month (trailing 3mo average)" },
  { name: "citation_score", frequency: "monthly", description: "Citation count and consistency score" },
  { name: "organic_traffic", frequency: "monthly", description: "Website traffic from organic search" },
  { name: "gbp_calls", frequency: "monthly", description: "Phone calls from Google Business Profile" },
  { name: "gbp_directions", frequency: "monthly", description: "Direction requests from Google Maps" },
  { name: "gbp_website_clicks", frequency: "monthly", description: "Website clicks from GBP" },
  // Quarterly
  { name: "ranking_trend", frequency: "quarterly", description: "Ranking trend (improving, stable, declining)" },
  { name: "review_growth_vs_competitors", frequency: "quarterly", description: "Review growth vs competitors" },
  { name: "citation_completeness", frequency: "quarterly", description: "Citation coverage completeness" },
  { name: "technical_seo_score", frequency: "quarterly", description: "Technical SEO health score" },
];

/**
 * Filters SEO metrics by their measurement frequency.
 *
 * @param frequency - The frequency to filter by ("weekly", "monthly", or "quarterly").
 * @returns Array of SEOMetric objects matching the specified frequency.
 */
export function getMetricsByFrequency(frequency: MetricFrequency): SEOMetric[] {
  return LOCAL_SEO_METRICS.filter((m) => m.frequency === frequency);
}

/**
 * Map Pack ranking factors and their relative weights.
 * Prominence (reviews, citations, SEO signals) carries the most weight at 50%.
 */
export const MAP_PACK_RANKING_FACTORS = {
  relevance: { weight: 0.25, description: "Category, keywords, services listed" },
  distance: { weight: 0.25, description: "Proximity to searcher" },
  prominence: { weight: 0.50, description: "Reviews, citations, SEO signals" },
} as const;
