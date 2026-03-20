import { NextRequest, NextResponse } from "next/server";
import { generatePixelScript } from "@/lib/integrations/retargeting";
import { rateLimitByIP } from "@/lib/rate-limit";

// GET: Returns JavaScript that tracks page views for the client
export async function GET(request: NextRequest) {
  // Rate limit: 120 requests per hour per IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "retargeting-pixel", 120);
  if (!allowed) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json(
      { error: "clientId query parameter is required" },
      { status: 400 }
    );
  }

  const script = generatePixelScript(clientId);

  // Return as JavaScript content
  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
