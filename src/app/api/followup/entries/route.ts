import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError } from "@/lib/require-client";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const TAG = "[api/followup/entries]";

// ---------------------------------------------------------------------------
// GET — list follow-up entries for the authenticated client
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "followup-entries-get", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { clientId } = await requireClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const cursor = searchParams.get("cursor");

    const entries = await prisma.followUpEntry.findMany({
      where: {
        clientId,
        ...(status ? { status } : {}),
      },
      include: {
        sequence: {
          select: { id: true, name: true, triggerType: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor },
          }
        : {}),
    });

    const response = NextResponse.json({
      entries,
      nextCursor: entries.length === 50 ? entries[entries.length - 1].id : null,
    });
    response.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=15");
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} GET failed`, error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 },
    );
  }
}
