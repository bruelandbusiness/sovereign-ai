import { NextResponse } from "next/server";
import { z } from "zod";
import { trackPageView } from "@/lib/integrations/retargeting";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const trackSchema = z.object({
  clientId: z.string().min(1).max(100),
  visitorId: z.string().min(1).max(200),
  url: z.string().url().max(2048),
  referrer: z.string().url().max(2048).optional().or(z.literal("")),
  userAgent: z.string().max(1000).optional(),
  timestamp: z.string().max(100).optional(),
});

// CORS headers for cross-origin tracking
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS: Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// POST: Record page view / event from the pixel script
export async function POST(request: Request) {
  try {
    // Rate limit: 120 requests per hour per IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "retargeting-track", 120);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const result = trackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid tracking data" },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = result.data;

    trackPageView(
      data.clientId,
      data.url,
      data.visitorId,
      data.referrer,
      data.userAgent
    );

    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
  } catch {
    // Tracking should never fail publicly - silently accept
    return NextResponse.json(
      { success: true },
      { status: 200, headers: corsHeaders }
    );
  }
}
