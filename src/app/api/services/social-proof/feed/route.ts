import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

// Public endpoint — no auth required
// Returns recent social proof events for a client
// CORS-enabled for cross-origin embedding

interface SocialProofEvent {
  type: "booking" | "review" | "lead";
  title: string;
  subtitle: string;
  rating?: number;
  timestamp: string;
}

// --- CORS helpers (mirrors chatbot/chat pattern) ---

function getAllowedOrigins(clientWebsite: string | null): string[] {
  const origins: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  origins.push(appUrl);

  if (clientWebsite) {
    try {
      const url = clientWebsite.startsWith("http")
        ? clientWebsite
        : `https://${clientWebsite}`;
      const parsed = new URL(url);
      origins.push(parsed.origin);
      if (parsed.hostname.startsWith("www.")) {
        origins.push(`${parsed.protocol}//${parsed.hostname.slice(4)}`);
      } else {
        origins.push(`${parsed.protocol}//www.${parsed.hostname}`);
      }
    } catch {
      // Ignore malformed URL
    }
  }

  return origins;
}

function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOrigins: string[]
): Record<string, string> {
  const origin =
    requestOrigin && allowedOrigins.some((o) => o === requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Fallback CORS for early errors before client is known
function fallbackCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return buildCorsHeaders(requestOrigin, [appUrl, requestOrigin || ""]);
}

export async function GET(request: Request) {
  const requestOrigin = request.headers.get("origin");

  // Rate limit: 120 requests per hour per IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "social-proof-feed", 120);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: fallbackCorsHeaders(requestOrigin) }
    );
  }

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId is required" },
      { status: 400, headers: fallbackCorsHeaders(requestOrigin) }
    );
  }

  try {
    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, city: true, website: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404, headers: fallbackCorsHeaders(requestOrigin) }
      );
    }

    // Build CORS headers restricted to the client's registered domain
    const spAllowedOrigins = getAllowedOrigins(client.website);
    const corsHeaders = buildCorsHeaders(requestOrigin, spAllowedOrigins);

    const events: SocialProofEvent[] = [];

    // Recent bookings (anonymized: first name + city)
    const recentBookings = await prisma.booking.findMany({
      where: {
        clientId,
        status: { in: ["confirmed", "completed"] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        serviceType: true,
        createdAt: true,
      },
    });

    for (const booking of recentBookings) {
      const city = client.city || "the area";
      const label = `Someone from ${city}`;
      events.push({
        type: "booking",
        title: `${label} just booked a service`,
        subtitle: booking.serviceType
          ? `Booked: ${booking.serviceType}`
          : "Just booked an appointment",
        timestamp: booking.createdAt.toISOString(),
      });
    }

    // Recent review campaigns that completed with high ratings
    const recentReviews = await prisma.reviewCampaign.findMany({
      where: {
        clientId,
        status: "completed",
        rating: { gte: 4 },
        completedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        rating: true,
        completedAt: true,
      },
    });

    for (const review of recentReviews) {
      const city = client.city || "the area";
      const label = `Someone from ${city}`;
      events.push({
        type: "review",
        title: `${label} left a ${review.rating}-star review`,
        subtitle: `New ${review.rating}-star review`,
        rating: review.rating || undefined,
        timestamp: review.completedAt?.toISOString() || new Date().toISOString(),
      });
    }

    // Recent leads (anonymized)
    const recentLeads = await prisma.lead.findMany({
      where: {
        clientId,
        createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        source: true,
        createdAt: true,
      },
    });

    for (const lead of recentLeads) {
      const city = client.city || "the area";
      const label = `Someone from ${city}`;
      events.push({
        type: "lead",
        title: `${label} just requested a quote`,
        subtitle: `Via ${lead.source}`,
        timestamp: lead.createdAt.toISOString(),
      });
    }

    // If no real events, provide some mock data so the widget has something to show
    if (events.length === 0) {
      const city = client.city || "your area";
      const label = `Someone from ${city}`;
      events.push(
        {
          type: "booking",
          title: `${label} just booked a service`,
          subtitle: "Just booked an appointment",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: "review",
          title: `${label} left a 5-star review`,
          subtitle: "New 5-star review",
          rating: 5,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: "lead",
          title: `${label} just requested a quote`,
          subtitle: "Via website",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: "booking",
          title: `${label} just booked a service`,
          subtitle: "Just booked an appointment",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: "review",
          title: `${label} left a 5-star review`,
          subtitle: "New 5-star review",
          rating: 5,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }
      );
    }

    // Sort by timestamp descending
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(
      { events: events.slice(0, 10) },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  } catch (err) {
    console.error("[social-proof/feed] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch social proof feed" },
      { status: 500, headers: fallbackCorsHeaders(requestOrigin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const headers = buildCorsHeaders(origin, [appUrl, origin || ""]);
  return new Response(null, { status: 204, headers });
}
