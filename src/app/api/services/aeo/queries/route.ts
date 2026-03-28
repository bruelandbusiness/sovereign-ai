import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: List all tracked AEO queries for the client
export async function GET(request: Request) {
  try {
    const { clientId } = await requireClient();

    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");

    const where: Record<string, unknown> = { clientId };
    if (platform) {
      where.platform = platform;
    }

    const queries = await prisma.aEOQuery.findMany({
      where,
      orderBy: { checkedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ queries });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[aeo/queries] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch AEO queries" },
      { status: 500 }
    );
  }
}

// Maximum tracked queries per client
const MAX_AEO_QUERIES_PER_CLIENT = 100;

// POST: Add a new query to track
const addQuerySchema = z.object({
  query: z.string().min(3).max(500),
  platform: z.enum(["chatgpt", "perplexity", "google_ai", "gemini"]),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, addQuerySchema);
    if (!validation.success) {
      return validation.response;
    }

    const { query, platform } = validation.data;

    // Enforce per-client query cap
    const existingCount = await prisma.aEOQuery.count({
      where: { clientId },
    });
    if (existingCount >= MAX_AEO_QUERIES_PER_CLIENT) {
      return NextResponse.json(
        {
          error: `Query limit reached (${MAX_AEO_QUERIES_PER_CLIENT}). Remove some tracked queries before adding new ones.`,
        },
        { status: 400 }
      );
    }

    const aeoQuery = await prisma.aEOQuery.create({
      data: {
        clientId,
        query,
        platform,
        isCited: false,
        checkedAt: new Date(),
      },
    });

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: "AEO query added for tracking",
        description: `Now tracking "${query}" on ${platform}`,
      },
    });

    return NextResponse.json({ query: aeoQuery });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[aeo/queries] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to add AEO query" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a tracked query
const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, deleteSchema);
    if (!validation.success) {
      return validation.response;
    }

    const existing = await prisma.aEOQuery.findFirst({
      where: { id: validation.data.id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    await prisma.aEOQuery.delete({ where: { id: validation.data.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[aeo/queries] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete AEO query" },
      { status: 500 }
    );
  }
}
