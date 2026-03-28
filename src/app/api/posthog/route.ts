import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIP } from "@/lib/rate-limit";

const POSTHOG_INGEST_URL = "https://us.i.posthog.com";

/** Maximum request body size for PostHog events (1 MB). */
const MAX_BODY_SIZE = 1_048_576;

/**
 * Proxy endpoint for PostHog event ingestion.
 * Routing events through a first-party endpoint avoids ad-blocker interference.
 *
 * NOTE: This is a transparent proxy — it forwards raw event data to PostHog
 * without Zod validation because PostHog defines the event schema, not us.
 * We enforce rate limiting and a body-size cap to prevent abuse.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit: 200 analytics events per IP per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "posthog-proxy", 200);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const body = await request.text();

    // Guard against oversized payloads
    if (body.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "application/json";

    const response = await fetch(`${POSTHOG_INGEST_URL}/e/`, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body,
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to proxy event to PostHog" },
      { status: 500 },
    );
  }
}
