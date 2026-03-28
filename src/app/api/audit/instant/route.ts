import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { rateLimitByIP } from "@/lib/rate-limit";
import { z } from "zod";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SerpPlace {
  title?: string;
  rating?: number;
  reviews?: number;
  website?: string;
  address?: string;
  thumbnail?: string;
  type?: string;
}

interface CompetitorInfo {
  name: string;
  rating: number;
  reviews: number;
}

interface ScoreBreakdown {
  reviews: number;
  rating: number;
  website: number;
  competitive: number;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface InstantAuditResult {
  id: string;
  businessName: string;
  city: string;
  state: string;
  vertical: string;
  score: number;
  breakdown: ScoreBreakdown;
  businessData: {
    rating: number;
    reviewCount: number;
    website: string | null;
    address: string | null;
  };
  websiteChecks: {
    hasSSL: boolean;
    hasMobileViewport: boolean;
    hasChatWidget: boolean;
    hasSchemaMarkup: boolean;
    isFastLoading: boolean;
  };
  competitors: CompetitorInfo[];
  recommendations: Recommendation[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// In-memory cache (24h TTL) — keeps results shareable without DB migration
// ---------------------------------------------------------------------------

const auditCache = new Map<
  string,
  { result: InstantAuditResult; timestamp: number }
>();

// Purge expired entries every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of auditCache) {
    if (now - entry.timestamp > 86_400_000) auditCache.delete(key);
  }
}, 1_800_000);

// Also store by ID for the shareable page
const auditById = new Map<string, InstantAuditResult>();

function cacheKey(biz: string, city: string, state: string): string {
  return `${biz.toLowerCase().trim()}|${city.toLowerCase().trim()}|${state.toLowerCase().trim()}`;
}

function generateId(): string {
  return randomBytes(9).toString("base64url"); // 12 chars, cryptographically random
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  businessName: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  vertical: z.string().min(1).max(50),
});

// ---------------------------------------------------------------------------
// SerpAPI helpers
// ---------------------------------------------------------------------------

async function searchGoogleMaps(
  query: string,
  apiKey: string
): Promise<SerpPlace[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = await res.json();
  const results = data.local_results ?? data.place_results ?? [];
  // If single place result, wrap it
  if (!Array.isArray(results)) return [results];
  return results as SerpPlace[];
}

// ---------------------------------------------------------------------------
// Website analysis
// ---------------------------------------------------------------------------

async function analyzeWebsite(url: string): Promise<{
  hasSSL: boolean;
  hasMobileViewport: boolean;
  hasChatWidget: boolean;
  hasSchemaMarkup: boolean;
  isFastLoading: boolean;
}> {
  const defaults = {
    hasSSL: false,
    hasMobileViewport: false,
    hasChatWidget: false,
    hasSchemaMarkup: false,
    isFastLoading: false,
  };

  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const startTime = Date.now();
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SovereignAI-AuditBot/1.0; +https://trysovereignai.com)",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const loadTime = Date.now() - startTime;
    const html = await res.text();
    const lower = html.toLowerCase();

    return {
      hasSSL: normalized.startsWith("https://"),
      hasMobileViewport: lower.includes('name="viewport"') || lower.includes("name='viewport'"),
      hasChatWidget:
        lower.includes("intercom") ||
        lower.includes("drift") ||
        lower.includes("tawk") ||
        lower.includes("livechat") ||
        lower.includes("chatbot") ||
        lower.includes("hubspot-messages") ||
        lower.includes("crisp.chat"),
      hasSchemaMarkup: lower.includes("application/ld+json"),
      isFastLoading: loadTime < 3000,
    };
  } catch {
    return defaults;
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function calculateScores(
  biz: SerpPlace,
  websiteChecks: {
    hasSSL: boolean;
    hasMobileViewport: boolean;
    hasChatWidget: boolean;
    hasSchemaMarkup: boolean;
    isFastLoading: boolean;
  },
  competitors: CompetitorInfo[]
): { breakdown: ScoreBreakdown; score: number } {
  // Reviews Score: (reviewCount / 100) * 25, capped at 25
  const reviewCount = biz.reviews ?? 0;
  const reviewsScore = Math.min(25, (reviewCount / 100) * 25);

  // Rating Score: (rating / 5) * 20
  const rating = biz.rating ?? 0;
  const ratingScore = (rating / 5) * 20;

  // Website Score: 5 points each for SSL, mobile, chat, schema, speed (max 25)
  let websiteScore = 0;
  if (websiteChecks.hasSSL) websiteScore += 5;
  if (websiteChecks.hasMobileViewport) websiteScore += 5;
  if (websiteChecks.hasChatWidget) websiteScore += 5;
  if (websiteChecks.hasSchemaMarkup) websiteScore += 5;
  if (websiteChecks.isFastLoading) websiteScore += 5;

  // Competitive Score: compare against top competitors (max 30)
  let competitiveScore = 15; // default if no competitors
  if (competitors.length > 0) {
    const avgCompRating =
      competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    const avgCompReviews =
      competitors.reduce((sum, c) => sum + c.reviews, 0) / competitors.length;

    // Rating comparison (max 15)
    const ratingRatio = rating > 0 ? rating / Math.max(avgCompRating, 0.1) : 0;
    const ratingCompScore = Math.min(15, ratingRatio * 15);

    // Review count comparison (max 15)
    const reviewRatio =
      reviewCount > 0 ? reviewCount / Math.max(avgCompReviews, 1) : 0;
    const reviewCompScore = Math.min(15, reviewRatio * 15);

    competitiveScore = Math.round(ratingCompScore + reviewCompScore);
  }

  const breakdown: ScoreBreakdown = {
    reviews: Math.round(reviewsScore),
    rating: Math.round(ratingScore),
    website: websiteScore,
    competitive: Math.min(30, competitiveScore),
  };

  const total = Math.min(
    100,
    breakdown.reviews + breakdown.rating + breakdown.website + breakdown.competitive
  );

  return { breakdown, score: total };
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function generateRecommendations(
  breakdown: ScoreBreakdown,
  websiteChecks: {
    hasSSL: boolean;
    hasMobileViewport: boolean;
    hasChatWidget: boolean;
    hasSchemaMarkup: boolean;
    isFastLoading: boolean;
  },
  biz: SerpPlace,
  competitors: CompetitorInfo[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  if ((biz.reviews ?? 0) < 50) {
    recs.push({
      priority: "high",
      title: "Build Up Your Google Reviews",
      description: `You have ${biz.reviews ?? 0} reviews. Top competitors average ${
        competitors.length > 0
          ? Math.round(
              competitors.reduce((s, c) => s + c.reviews, 0) /
                competitors.length
            )
          : "50+"
      }. Implement an automated review request system to close the gap.`,
    });
  }

  if ((biz.rating ?? 0) < 4.5) {
    recs.push({
      priority: "medium",
      title: "Improve Your Star Rating",
      description: `Your ${biz.rating ?? 0}-star rating could be costing you clicks. Businesses with 4.5+ stars get 28% more calls from Google Maps.`,
    });
  }

  if (!websiteChecks.hasChatWidget) {
    recs.push({
      priority: "high",
      title: "Add a Live Chat / AI Chatbot",
      description:
        "You have no chat widget on your website. 79% of consumers prefer live chat because of the immediacy it offers. An AI chatbot can capture leads 24/7.",
    });
  }

  if (!websiteChecks.hasSchemaMarkup) {
    recs.push({
      priority: "medium",
      title: "Add Schema Markup for Rich Results",
      description:
        "Your website is missing structured data (schema markup). Adding LocalBusiness schema helps Google display your business info directly in search results.",
    });
  }

  if (!websiteChecks.hasMobileViewport) {
    recs.push({
      priority: "high",
      title: "Fix Mobile Responsiveness",
      description:
        "Your website may not be mobile-friendly. Over 60% of local searches happen on mobile devices. A non-responsive site loses leads.",
    });
  }

  if (!websiteChecks.isFastLoading) {
    recs.push({
      priority: "medium",
      title: "Improve Page Load Speed",
      description:
        "Your website took over 3 seconds to load. 53% of mobile users abandon sites that take longer than 3 seconds. Speed optimization is critical.",
    });
  }

  if (breakdown.competitive < 15) {
    recs.push({
      priority: "high",
      title: "Close the Gap with Competitors",
      description:
        "You are significantly behind your top local competitors in online presence. A targeted review generation and SEO strategy can help you catch up.",
    });
  }

  // Always return 3-5 recs
  if (recs.length < 3) {
    if (!recs.find((r) => r.title.includes("Reviews"))) {
      recs.push({
        priority: "low",
        title: "Keep Building Social Proof",
        description:
          "Continue collecting reviews consistently. Set up an automated follow-up sequence that asks satisfied customers for reviews after each job.",
      });
    }
    recs.push({
      priority: "low",
      title: "Expand Your Digital Footprint",
      description:
        "Claim and optimize profiles on Yelp, BBB, Angi, and other directories. Consistent NAP (Name, Address, Phone) across all platforms boosts local SEO.",
    });
  }

  return recs.slice(0, 5);
}

// ---------------------------------------------------------------------------
// GET handler — fetch a stored audit by ID (for shareable page)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const result = auditById.get(id);
  if (!result) {
    return NextResponse.json({ error: "Audit not found or expired" }, { status: 404 });
  }

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// POST handler — run an instant audit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "instant-audit", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Parse & validate
  let body: z.infer<typeof requestSchema>;
  try {
    const raw = await request.json();
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Check cache
  const ck = cacheKey(body.businessName, body.city, body.state);
  const cached = auditCache.get(ck);
  if (cached && Date.now() - cached.timestamp < 86_400_000) {
    return NextResponse.json(cached.result);
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Audit service is not configured" },
      { status: 503 }
    );
  }

  try {
    // 1. Search for the business on Google Maps
    const query = `${body.businessName} ${body.city} ${body.state}`;
    const places = await searchGoogleMaps(query, apiKey);

    if (places.length === 0) {
      return NextResponse.json(
        { error: "Could not find this business on Google Maps. Please verify the name and location." },
        { status: 404 }
      );
    }

    const business = places[0];

    // 2. Analyze their website (if found)
    const websiteChecks = business.website
      ? await analyzeWebsite(business.website)
      : {
          hasSSL: false,
          hasMobileViewport: false,
          hasChatWidget: false,
          hasSchemaMarkup: false,
          isFastLoading: false,
        };

    // 3. Find competitors (same vertical, same city)
    const compQuery = `${body.vertical} ${body.city} ${body.state}`;
    const compPlaces = await searchGoogleMaps(compQuery, apiKey);
    const competitors: CompetitorInfo[] = compPlaces
      .filter(
        (p) =>
          p.title?.toLowerCase() !== business.title?.toLowerCase() &&
          p.rating !== undefined
      )
      .slice(0, 3)
      .map((p) => ({
        name: p.title || "Unknown",
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
      }));

    // 4. Calculate scores
    const { breakdown, score } = calculateScores(
      business,
      websiteChecks,
      competitors
    );

    // 5. Generate recommendations
    const recommendations = generateRecommendations(
      breakdown,
      websiteChecks,
      business,
      competitors
    );

    // 6. Build result
    const id = generateId();
    const result: InstantAuditResult = {
      id,
      businessName: body.businessName,
      city: body.city,
      state: body.state,
      vertical: body.vertical,
      score,
      breakdown,
      businessData: {
        rating: business.rating ?? 0,
        reviewCount: business.reviews ?? 0,
        website: business.website ?? null,
        address: business.address ?? null,
      },
      websiteChecks,
      competitors,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    // 7. Cache
    auditCache.set(ck, { result, timestamp: Date.now() });
    auditById.set(id, result);

    return NextResponse.json(result);
  } catch (err) {
    logger.errorWithCause("[instant-audit] Error:", err);
    return NextResponse.json(
      { error: "Failed to run audit. Please try again." },
      { status: 500 }
    );
  }
}
