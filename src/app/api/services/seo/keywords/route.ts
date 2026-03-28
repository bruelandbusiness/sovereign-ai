import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trackKeywordRankings, isDataForSEOConfigured } from "@/lib/integrations/seo";
import { z } from "zod";

export const dynamic = "force-dynamic";
const keywordsSchema = z.object({
  keywords: z.array(z.string().max(200)).min(1).max(50),
});

// Maximum total keywords a single client can track
const MAX_KEYWORDS_PER_CLIENT = 200;

// GET: List tracked keywords with current/previous position, search volume, difficulty
export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const keywords = await prisma.sEOKeyword.findMany({
    where: { clientId },
    orderBy: { position: "asc" },
    take: 200,
  });

  const response = NextResponse.json({
    keywords: keywords.map((kw) => ({
      id: kw.id,
      keyword: kw.keyword,
      position: kw.position,
      prevPosition: kw.prevPosition,
      searchVolume: kw.searchVolume,
      difficulty: kw.difficulty,
      url: kw.url,
      trend:
        kw.position !== null && kw.prevPosition !== null
          ? kw.prevPosition - kw.position // positive = improved
          : null,
      trackedAt: kw.trackedAt.toISOString(),
      createdAt: kw.createdAt.toISOString(),
    })),
    isMock: !isDataForSEOConfigured(),
  });
  response.headers.set(
    "Cache-Control",
    "private, max-age=300, stale-while-revalidate=120"
  );
  return response;
}

// POST: Add keywords to track
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = keywordsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { keywords } = parsed.data;

  // Enforce per-client keyword cap
  const existingCount = await prisma.sEOKeyword.count({
    where: { clientId },
  });
  if (existingCount + keywords.length > MAX_KEYWORDS_PER_CLIENT) {
    const remaining = Math.max(0, MAX_KEYWORDS_PER_CLIENT - existingCount);
    return NextResponse.json(
      {
        error: `Keyword limit exceeded. You are tracking ${existingCount} keywords and can add up to ${remaining} more (max ${MAX_KEYWORDS_PER_CLIENT}).`,
      },
      { status: 400 }
    );
  }

  // Fetch initial rankings
  const rankings = await trackKeywordRankings(clientId, keywords);

  // Batch all keyword upserts in a single transaction to avoid N sequential queries
  const results = await prisma.$transaction(
    rankings.map((ranking) =>
      prisma.sEOKeyword.upsert({
        where: { clientId_keyword: { clientId, keyword: ranking.keyword } },
        create: {
          clientId,
          keyword: ranking.keyword,
          position: ranking.position,
          prevPosition: null,
          searchVolume: ranking.searchVolume,
          difficulty: ranking.difficulty,
          url: ranking.url,
          trackedAt: new Date(),
        },
        update: {
          prevPosition: undefined, // Keep existing prevPosition on first add
          position: ranking.position,
          searchVolume: ranking.searchVolume,
          difficulty: ranking.difficulty,
          url: ranking.url,
          trackedAt: new Date(),
        },
      })
    )
  );

  const formattedResults = results.map((keyword) => ({
    id: keyword.id,
    keyword: keyword.keyword,
    position: keyword.position,
    prevPosition: keyword.prevPosition,
    searchVolume: keyword.searchVolume,
    difficulty: keyword.difficulty,
    url: keyword.url,
    trackedAt: keyword.trackedAt.toISOString(),
    createdAt: keyword.createdAt.toISOString(),
  }));

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: `${keywords.length} keywords added for tracking`,
      description: `Now tracking: ${keywords.slice(0, 5).join(", ")}${keywords.length > 5 ? ` and ${keywords.length - 5} more` : ""}`,
    },
  });

  return NextResponse.json({ keywords: formattedResults }, { status: 201 });
}

// DELETE: Remove keyword tracking
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const { searchParams } = new URL(request.url);
  const keywordId = searchParams.get("keywordId");
  const keyword = searchParams.get("keyword");

  if (!keywordId && !keyword) {
    return NextResponse.json(
      { error: "keywordId or keyword query param is required" },
      { status: 400 }
    );
  }

  if (keywordId) {
    const existing = await prisma.sEOKeyword.findUnique({
      where: { id: keywordId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    if (existing.clientId !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.sEOKeyword.delete({ where: { id: keywordId } });
    return NextResponse.json({ success: true, deletedId: keywordId });
  }

  // Delete by keyword text
  const existing = await prisma.sEOKeyword.findUnique({
    where: { clientId_keyword: { clientId, keyword: keyword! } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Keyword not found" },
      { status: 404 }
    );
  }

  await prisma.sEOKeyword.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true, deletedKeyword: keyword });
}
