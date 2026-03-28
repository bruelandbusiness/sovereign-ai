/**
 * Type definitions for the prospect scraping and scoring system.
 *
 * These types drive the SerpAPI Google Maps scraper, enrichment pipeline,
 * scoring engine, and the API routes that tie them together.
 */

// ---------------------------------------------------------------------------
// SerpAPI raw response shapes
// ---------------------------------------------------------------------------

/** GPS coordinates returned by SerpAPI Google Maps results. */
export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

/** A single local result from SerpAPI's Google Maps endpoint. */
export interface SerpApiLocalResult {
  title?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  gps_coordinates?: GpsCoordinates;
  place_id?: string;
  data_id?: string;
  thumbnail?: string;
  type?: string;
  types?: string[];
  /** Full Google Maps URL (may be absent; we construct a fallback). */
  link?: string;
}

/** Top-level SerpAPI Google Maps search response. */
export interface SerpApiMapsResponse {
  local_results?: SerpApiLocalResult[];
  search_metadata?: {
    id?: string;
    status?: string;
    total_time_taken?: number;
  };
  search_information?: {
    local_results_state?: string;
  };
  serpapi_pagination?: {
    next?: string;
  };
}

// ---------------------------------------------------------------------------
// Prospect data flowing through the pipeline
// ---------------------------------------------------------------------------

/** Data extracted from a single Google Maps result before enrichment. */
export interface ProspectData {
  businessName: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUrl: string | null;
  placeId: string | null;
  gpsCoordinates: GpsCoordinates | null;

  // Enrichment fields (populated after scrape)
  ownerName: string | null;
  email: string | null;
  emailVerified: boolean;
  emailSource: string | null;
}

// ---------------------------------------------------------------------------
// Scrape job parameters and results
// ---------------------------------------------------------------------------

/** Parameters for starting a prospect scrape job. */
export interface ScrapeJobParams {
  vertical: string;
  city: string;
  state: string;
  limit?: number; // max prospects to return (default 20)
}

/** Result of a prospect scrape job. */
export interface ScrapeJobResult {
  query: string;
  totalFound: number;
  totalStored: number;
  totalDuplicates: number;
  prospects: ProspectData[];
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

/** Parameters for enriching a batch of prospects. */
export interface EnrichParams {
  prospectIds?: string[]; // if omitted, enriches all prospects missing email
  limit?: number;         // max to enrich in one run (default 50)
}

/** Result of a batch enrichment run. */
export interface EnrichResult {
  enriched: number;
  emailsFound: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/** Breakdown of how a prospect score was calculated. */
export interface ScoreBreakdown {
  reviewCountScore: number;
  ratingScore: number;
  noWebsiteScore: number;
  noChatWidgetScore: number;
  smallBusinessScore: number;
  hasEmailScore: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Export / list filters
// ---------------------------------------------------------------------------

/** Filters for listing prospects. */
export interface ProspectListFilters {
  vertical?: string;
  city?: string;
  state?: string;
  status?: string;
  minScore?: number;
  cursor?: string;
  limit?: number;
}

/** Shape of an exported prospect record. */
export interface ExportedProspect {
  businessName: string;
  ownerName: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  website: string | null;
  address: string | null;
  vertical: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  reviewCount: number | null;
  googleMapsUrl: string | null;
  score: number | null;
  status: string;
  source: string | null;
}
