import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { calculateROI } from "@/lib/roi";
import { logger } from "@/lib/logger";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const querySchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  // Rate limit: 60 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "roi-get", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { clientId: routeClientId } = await params;

  // Clients can only access their own ROI data
  if (clientId !== routeClientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = request.nextUrl;
  const parsed = querySchema.safeParse({
    periodStart: url.searchParams.get("periodStart"),
    periodEnd: url.searchParams.get("periodEnd"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const data = await calculateROI(
      clientId,
      parsed.data.periodStart,
      parsed.data.periodEnd,
    );

    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", "private, max-age=120, stale-while-revalidate=60");
    return response;
  } catch (error) {
    logger.errorWithCause("[api/roi] Failed to calculate ROI", error, {
      clientId,
    });
    return NextResponse.json(
      { error: "Failed to calculate ROI" },
      { status: 500 },
    );
  }
}
