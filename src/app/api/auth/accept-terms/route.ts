import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

const acceptTermsSchema = z.object({
  version: z.string().min(1).max(50),
});

/**
 * POST /api/auth/accept-terms
 *
 * Records that the authenticated user has accepted the terms of service
 * at a specific version. Creates an audit log entry for compliance.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "auth-accept-terms", 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { accountId, clientId } = await requireClient();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const parsed = acceptTermsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. You must provide a terms version." },
        { status: 400 },
      );
    }

    const { version } = parsed.data;
    const now = new Date();

    // Record the terms acceptance in the audit log
    await prisma.auditLog.create({
      data: {
        accountId,
        action: "terms_accepted",
        resource: "account",
        resourceId: accountId,
        metadata: JSON.stringify({
          clientId,
          version,
          acceptedAt: now.toISOString(),
          userAgent:
            request.headers.get("user-agent")?.slice(0, 512) ?? null,
        }),
      },
    });

    logger.info("[accept-terms] Terms accepted", {
      accountId,
      version,
    });

    return NextResponse.json({
      success: true,
      version,
      acceptedAt: now.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[accept-terms] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to record terms acceptance" },
      { status: 500 },
    );
  }
}
