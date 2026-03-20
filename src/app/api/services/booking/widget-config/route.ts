import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

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

// ---------------------------------------------------------------------------
// GET — public widget configuration for the embeddable booking widget
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "booking-widget-config", 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const requestOrigin = request.headers.get("origin");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId query parameter is required" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      businessName: true,
      phone: true,
      vertical: true,
      website: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Get booking service config
  const clientService = await prisma.clientService.findFirst({
    where: { clientId, serviceId: "booking" },
  });

  let config: Record<string, unknown> = {};
  if (clientService?.config) {
    try {
      config = JSON.parse(clientService.config);
    } catch {
      // Use defaults
    }
  }

  // Build CORS headers restricted to the client's registered domain
  const allowedOrigins = getAllowedOrigins(client.website);
  const corsHeaders = buildCorsHeaders(requestOrigin, allowedOrigins);

  return NextResponse.json(
    {
      businessName: client.businessName,
      phone: client.phone,
      vertical: client.vertical,
      slotDuration: (config.slotDuration as number) || 60,
      primaryColor: (config.widgetPrimaryColor as string) || "#4c85ff",
      buttonText: (config.widgetButtonText as string) || "Book Now",
      timezone: (config.timezone as string) || "America/New_York",
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const headers = buildCorsHeaders(origin, [appUrl, origin || ""]);
  return new Response(null, { status: 204, headers });
}
