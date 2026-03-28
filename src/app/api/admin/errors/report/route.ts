import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureError } from "@/lib/monitoring/error-logger";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/admin/errors/report
//
// Receives client-side error reports from the error boundary or any
// front-end code. No auth required (errors can happen for unauthenticated
// users), but the payload is validated and rate-limited by IP.
// ---------------------------------------------------------------------------

const errorReportSchema = z.object({
  message: z.string().min(1).max(5000),
  stack: z.string().max(5000).optional(),
  componentStack: z.string().max(5000).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
  digest: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit: 30 error reports per hour per IP to prevent abuse
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "error-report", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  try {
    const raw = await request.json();
    const parsed = errorReportSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 },
      );
    }

    const body = parsed.data;

    const combinedStack = [body.stack, body.componentStack]
      .filter(Boolean)
      .join("\n--- Component Stack ---\n");

    const syntheticError = new Error(body.message);
    if (combinedStack) {
      syntheticError.stack = combinedStack;
    }

    await captureError(syntheticError, {
      severity: "error",
      url: body.url ?? request.headers.get("referer") ?? undefined,
      userAgent:
        body.userAgent ?? request.headers.get("user-agent") ?? undefined,
      source: "client-error-boundary",
      extra: body.digest ? { digest: body.digest } : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.errorWithCause(
      "[api/admin/errors/report] Failed to process client error report",
      err,
    );
    return NextResponse.json(
      { error: "Failed to record error" },
      { status: 500 },
    );
  }
}
