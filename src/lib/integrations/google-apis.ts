import { logger } from "@/lib/logger";
/**
 * Google Maps/Places, Calendar, and Business Profile API clients.
 *
 * Provides typed wrappers around Google APIs used for lead discovery,
 * competitor analysis, appointment booking, and reputation monitoring.
 */

// ---------------------------------------------------------------------------
// Shared interfaces
// ---------------------------------------------------------------------------

/** A place returned by a Nearby Search or Text Search. */
export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  types: string[];
  location: { lat: number; lng: number };
}

/** Extended place information including reviews and contact details. */
export interface PlaceDetails extends PlaceResult {
  phone?: string;
  website?: string;
  hours?: string[];
  reviews: Review[];
}

/** A single Google review (from Places or GBP). */
export interface Review {
  author: string;
  rating: number;
  text: string;
  time: Date;
  relativeTime?: string;
}

// ---------------------------------------------------------------------------
// Google Maps / Places
// ---------------------------------------------------------------------------

/** Configuration for the Google Maps / Places client. */
export interface GoogleMapsConfig {
  apiKey: string;
  budgetCap: { dailyDollars: number; monthlyDollars: number };
  rateLimitPerSecond: number;
}

/** Sensible defaults -- the API key is read from the environment at runtime. */
export const GOOGLE_MAPS_DEFAULTS: GoogleMapsConfig = {
  apiKey: "", // populated from GOOGLE_MAPS_API_KEY env var
  budgetCap: { dailyDollars: 10, monthlyDollars: 200 },
  rateLimitPerSecond: 50,
};

/** Per-request cost estimates (USD) used for budget tracking. */
export const GOOGLE_MAPS_COSTS: Record<string, number> = {
  nearbySearch: 0.032,
  placeDetails: 0.017,
  geocoding: 0.005,
};

// Module-level budget tracker (resets on process restart).
let _dailySpend = 0;
let _monthlySpend = 0;
let _lastResetDay = new Date().getDate();
let _lastResetMonth = new Date().getMonth();

/**
 * Return the current Maps API key from the environment, throwing if missing.
 */
function getMapsApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY ?? GOOGLE_MAPS_DEFAULTS.apiKey;
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not set. Please configure it in your environment.",
    );
  }
  return key;
}

/**
 * Check and update the daily/monthly budget tracker before a request.
 * Throws if the request would exceed the configured cap.
 */
function checkBudget(
  costKey: string,
  config: GoogleMapsConfig = GOOGLE_MAPS_DEFAULTS,
): void {
  const now = new Date();

  // Reset daily counter if the day rolled over.
  if (now.getDate() !== _lastResetDay) {
    _dailySpend = 0;
    _lastResetDay = now.getDate();
  }
  // Reset monthly counter if the month rolled over.
  if (now.getMonth() !== _lastResetMonth) {
    _monthlySpend = 0;
    _lastResetMonth = now.getMonth();
  }

  const cost = GOOGLE_MAPS_COSTS[costKey] ?? 0;

  if (_dailySpend + cost > config.budgetCap.dailyDollars) {
    throw new Error(
      `Google Maps daily budget cap of $${config.budgetCap.dailyDollars} would be exceeded. Current spend: $${_dailySpend.toFixed(3)}.`,
    );
  }
  if (_monthlySpend + cost > config.budgetCap.monthlyDollars) {
    throw new Error(
      `Google Maps monthly budget cap of $${config.budgetCap.monthlyDollars} would be exceeded. Current spend: $${_monthlySpend.toFixed(3)}.`,
    );
  }

  _dailySpend += cost;
  _monthlySpend += cost;
}

/**
 * Search for nearby places -- useful for contractor competitor analysis and
 * detecting construction activity signals.
 *
 * @param location  Centre point for the search.
 * @param type      Google place type (e.g. "general_contractor", "roofing_contractor").
 * @param radius    Search radius in metres.
 * @param keyword   Optional keyword filter.
 * @returns         Array of matching place results.
 */
export async function searchNearbyPlaces(
  location: { lat: number; lng: number },
  type: string,
  radius: number,
  keyword?: string,
): Promise<PlaceResult[]> {
  const apiKey = getMapsApiKey();
  checkBudget("nearbySearch");

  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: String(radius),
    type,
    key: apiKey,
  });
  if (keyword) params.set("keyword", keyword);

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Nearby search failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message ?? ""}`);
    }

    return (data.results ?? []).map((r: RawPlaceResult): PlaceResult => ({
      placeId: r.place_id,
      name: r.name,
      address: r.vicinity ?? r.formatted_address ?? "",
      rating: r.rating ?? 0,
      reviewCount: r.user_ratings_total ?? 0,
      types: r.types ?? [],
      location: {
        lat: r.geometry?.location?.lat ?? 0,
        lng: r.geometry?.location?.lng ?? 0,
      },
    }));
  } catch (err) {
    logger.errorWithCause("[google-apis] searchNearbyPlaces error:", err);
    throw err;
  }
}

/**
 * Retrieve detailed information for a place including reviews, hours, and
 * contact info.
 *
 * @param placeId  The Google Place ID.
 * @returns        Full place details with reviews.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const apiKey = getMapsApiKey();
  checkBudget("placeDetails");

  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "rating",
    "user_ratings_total",
    "types",
    "geometry",
    "formatted_phone_number",
    "website",
    "opening_hours",
    "reviews",
  ].join(",");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Place details failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message ?? ""}`);
    }

    const r = data.result;
    return {
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address ?? "",
      rating: r.rating ?? 0,
      reviewCount: r.user_ratings_total ?? 0,
      types: r.types ?? [],
      location: {
        lat: r.geometry?.location?.lat ?? 0,
        lng: r.geometry?.location?.lng ?? 0,
      },
      phone: r.formatted_phone_number,
      website: r.website,
      hours: r.opening_hours?.weekday_text,
      reviews: (r.reviews ?? []).map(parseReview),
    };
  } catch (err) {
    logger.errorWithCause("[google-apis] getPlaceDetails error:", err);
    throw err;
  }
}

/**
 * Geocode a street address into coordinates and a canonical formatted address.
 *
 * @param address  Free-form address string.
 * @returns        Latitude, longitude, and Google-formatted address.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number; formattedAddress: string }> {
  const apiKey = getMapsApiKey();
  checkBudget("geocoding");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Geocoding failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error(`Geocoding API error: ${data.status} - ${data.error_message ?? ""}`);
    }

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (err) {
    logger.errorWithCause("[google-apis] geocodeAddress error:", err);
    throw err;
  }
}

/**
 * Pull reviews for a competitor place, useful for mining lead signals
 * (e.g. negative reviews may indicate opportunity).
 *
 * @param placeId  Google Place ID of the competitor business.
 * @returns        Array of reviews from the listing.
 */
export async function mineCompetitorReviews(
  placeId: string,
): Promise<Review[]> {
  const details = await getPlaceDetails(placeId);
  return details.reviews;
}

// ---------------------------------------------------------------------------
// Google Calendar
// ---------------------------------------------------------------------------

/** Template used to create a service appointment in the contractor's calendar. */
export interface CalendarEventTemplate {
  serviceType: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadAddress?: string;
  serviceNeeded: string;
  score: number;
  source: string;
  appointmentTime: Date;
  durationMinutes: number;
  timezone: string;
}

const CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";

/**
 * Check whether the contractor's calendar is free during the proposed window.
 *
 * @param accessToken  OAuth2 access token for the contractor's Google account.
 * @param startTime    Proposed start of the appointment.
 * @param endTime      Proposed end of the appointment.
 * @param timezone     IANA timezone string (e.g. "America/Phoenix").
 * @returns            Whether the slot is available plus any conflicting event summaries.
 */
export async function checkAvailability(
  accessToken: string,
  startTime: Date,
  endTime: Date,
  timezone: string,
): Promise<{ available: boolean; conflicts: string[] }> {
  const url = `${CALENDAR_BASE_URL}/freeBusy`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        timeZone: timezone,
        items: [{ id: "primary" }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Calendar freeBusy failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const busy: { start: string; end: string }[] =
      data.calendars?.primary?.busy ?? [];

    return {
      available: busy.length === 0,
      conflicts: busy.map(
        (b) =>
          `Busy ${new Date(b.start).toLocaleString()} - ${new Date(b.end).toLocaleString()}`,
      ),
    };
  } catch (err) {
    logger.errorWithCause("[google-apis] checkAvailability error:", err);
    throw err;
  }
}

/**
 * Book an appointment in the contractor's Google Calendar.
 *
 * Rules enforced:
 * - Checks for conflicts before booking.
 * - Sends confirmation notifications to lead and contractor.
 * - Logs the booking.
 *
 * @param event        Populated calendar event template.
 * @param accessToken  OAuth2 access token for the contractor's Google account.
 * @returns            The created event ID and an HTML link to view it.
 */
export async function createAppointment(
  event: CalendarEventTemplate,
  accessToken: string,
): Promise<{ eventId: string; htmlLink: string }> {
  const startTime = new Date(event.appointmentTime);
  const endTime = new Date(
    startTime.getTime() + event.durationMinutes * 60_000,
  );

  // 1. Check for conflicts.
  const availability = await checkAvailability(
    accessToken,
    startTime,
    endTime,
    event.timezone,
  );

  if (!availability.available) {
    throw new Error(
      `Time slot is not available. Conflicts: ${availability.conflicts.join("; ")}`,
    );
  }

  // 2. Build the calendar event payload.
  const description = [
    `Service: ${event.serviceNeeded}`,
    `Lead: ${event.leadName}`,
    `Phone: ${event.leadPhone}`,
    event.leadEmail ? `Email: ${event.leadEmail}` : null,
    event.leadAddress ? `Address: ${event.leadAddress}` : null,
    `Lead Score: ${event.score}`,
    `Source: ${event.source}`,
  ]
    .filter(Boolean)
    .join("\n");

  const attendees: { email: string }[] = [];
  if (event.leadEmail) {
    attendees.push({ email: event.leadEmail });
  }

  const calendarEvent = {
    summary: `${event.serviceType} - ${event.leadName}`,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: event.timezone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: event.timezone,
    },
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  // 3. Create the event (sendUpdates: "all" sends confirmation to attendees).
  const url = `${CALENDAR_BASE_URL}/calendars/primary/events?sendUpdates=all`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!res.ok) {
      throw new Error(
        `Calendar event creation failed: ${res.status} ${res.statusText}`,
      );
    }

    const data = await res.json();

    logger.info(
      `[google-apis] Appointment booked: ${data.id} for ${event.leadName} at ${startTime.toISOString()}`,
    );

    return {
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (err) {
    logger.errorWithCause("[google-apis] createAppointment error:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Google Business Profile
// ---------------------------------------------------------------------------

/** Base URL for the Google My Business (v4) API. */
export const GBP_CONFIG = {
  baseUrl: "https://mybusiness.googleapis.com/v4",
} as const;

/**
 * List reviews for a Google Business Profile location.
 *
 * @param accountId   GBP account ID.
 * @param locationId  GBP location ID.
 * @param accessToken OAuth2 access token with GBP scope.
 * @returns           Array of reviews for the location.
 */
export async function listReviews(
  accountId: string,
  locationId: string,
  accessToken: string,
): Promise<Review[]> {
  const url = `${GBP_CONFIG.baseUrl}/accounts/${accountId}/locations/${locationId}/reviews`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`GBP listReviews failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return (data.reviews ?? []).map(
      (r: RawGBPReview): Review => ({
        author: r.reviewer?.displayName ?? "Anonymous",
        rating: r.starRating ? starRatingToNumber(r.starRating) : 0,
        text: r.comment ?? "",
        time: new Date(r.createTime ?? 0),
      }),
    );
  } catch (err) {
    logger.errorWithCause("[google-apis] listReviews error:", err);
    throw err;
  }
}

/**
 * Compute aggregate review statistics from a list of reviews.
 *
 * @param reviews  Array of reviews (from GBP or Places).
 * @returns        Average rating, total count, and whether the recent trend
 *                 is improving, declining, or stable.
 */
export function getReviewStats(reviews: Review[]): {
  averageRating: number;
  totalReviews: number;
  recentTrend: "improving" | "declining" | "stable";
} {
  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0, recentTrend: "stable" };
  }

  const totalReviews = reviews.length;
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  // Determine trend by comparing the older half to the newer half.
  const sorted = [...reviews].sort(
    (a, b) => a.time.getTime() - b.time.getTime(),
  );
  const mid = Math.floor(sorted.length / 2);
  const olderHalf = sorted.slice(0, mid);
  const newerHalf = sorted.slice(mid);

  const avgOlder =
    olderHalf.length > 0
      ? olderHalf.reduce((s, r) => s + r.rating, 0) / olderHalf.length
      : 0;
  const avgNewer =
    newerHalf.length > 0
      ? newerHalf.reduce((s, r) => s + r.rating, 0) / newerHalf.length
      : 0;

  const delta = avgNewer - avgOlder;
  let recentTrend: "improving" | "declining" | "stable" = "stable";
  if (delta > 0.25) recentTrend = "improving";
  else if (delta < -0.25) recentTrend = "declining";

  return {
    averageRating: Math.round(averageRating * 100) / 100,
    totalReviews,
    recentTrend,
  };
}

// ---------------------------------------------------------------------------
// Raw Google API response shapes (untyped upstream; typed here for safety)
// ---------------------------------------------------------------------------

/** Shape of a single review from the Places API. */
interface RawPlacesReview {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  relative_time_description?: string;
}

/** Shape of a single result from a Nearby Search / Text Search. */
interface RawPlaceResult {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
}

/** Shape of a single review from the GBP API. */
interface RawGBPReview {
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a raw Google Places review object into our Review interface. */
function parseReview(raw: RawPlacesReview): Review {
  return {
    author: raw.author_name ?? "Anonymous",
    rating: raw.rating ?? 0,
    text: raw.text ?? "",
    time: new Date((raw.time ?? 0) * 1000),
    relativeTime: raw.relative_time_description,
  };
}

/** Convert GBP star rating enum string to a numeric value. */
function starRatingToNumber(starRating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[starRating] ?? 0;
}
