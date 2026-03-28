import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api/outreach/prospects]";

// ---------------------------------------------------------------------------
// GET — list scraped prospects with filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
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
    const limit = Math.min(
      Number(searchParams.get("limit")) || 50,
      200,
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

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: limit,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
    });

    const total = await prisma.prospect.count({ where });

    return NextResponse.json({
      prospects,
      total,
      nextCursor:
        prospects.length === limit
          ? prospects[prospects.length - 1].id
          : null,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} GET failed`, error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: 500 },
    );
  }
}
