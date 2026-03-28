import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KB_ARTICLES, KB_CATEGORIES } from "@/lib/knowledge-base";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * GET /api/knowledge
 *
 * Returns knowledge base articles, optionally filtered by category or search.
 * If no articles exist in the database, seeds them from the KB_ARTICLES constant.
 */
export async function GET(request: NextRequest) {
  try {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "knowledge-list", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  // Auto-seed if the knowledge base is empty (batch insert to avoid N+1)
  const count = await prisma.knowledgeArticle.count();
  if (count === 0) {
    await prisma.knowledgeArticle.createMany({
      data: KB_ARTICLES.map((a) => ({
        slug: a.slug,
        category: a.category,
        title: a.title,
        content: a.content,
        order: a.order,
      })),
      skipDuplicates: true,
    });
  }

  const where: Record<string, unknown> = {};

  if (
    category &&
    KB_CATEGORIES.some((c) => c.id === category)
  ) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const articles = await prisma.knowledgeArticle.findMany({
    where,
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      category: true,
      title: true,
      order: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 500,
  });

  // Group by category for convenience
  const categories = KB_CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.id),
  }));

  const response = NextResponse.json({ articles, categories });

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=600"
  );

  return response;
  } catch (error) {
    logger.error("GET /api/knowledge failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
