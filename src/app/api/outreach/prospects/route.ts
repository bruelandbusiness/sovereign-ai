import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const TAG = "[api/outreach/prospects]";

// ---------------------------------------------------------------------------
// GET — list scraped prospects with filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "outreach-prospects", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get("vertical");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const status = searchParams.get("status");
    const minScore = searchParams.get("minScore");
    const cursor = searchParams.get("cursor");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 50),
    );

    const where: Record<string, unknown> = {
      source: "scrape",
    };

    if (vertical) where.vertical = vertical;
    if (city) where.city = city;
    if (state) where.state = state;
    if (status) where.status = status;
    if (minScore) {
      where.score = { gte: Number(minScore) };
    }

    // When a cursor is provided, use cursor-based pagination.
    // Otherwise fall back to offset-based pagination.
    const skip = cursor ? 1 : (page - 1) * limit;

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip,
        ...(cursor ? { cursor: { id: cursor } } : {}),
      }),
      prisma.prospect.count({ where }),
    ]);

    return NextResponse.json({
      prospects,
      total,
      nextCursor:
        prospects.length === limit
          ? prospects[prospects.length - 1].id
          : null,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} GET failed`, error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 },
    );
  }
}
