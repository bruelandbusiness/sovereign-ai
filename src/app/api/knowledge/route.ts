import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KB_ARTICLES, KB_CATEGORIES } from "@/lib/knowledge-base";
import { rateLimitByIP } from "@/lib/rate-limit";

/**
 * GET /api/knowledge
 *
 * Returns knowledge base articles, optionally filtered by category or search.
 * If no articles exist in the database, seeds them from the KB_ARTICLES constant.
 */
export async function GET(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "knowledge-list", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  // Auto-seed if the knowledge base is empty
  const count = await prisma.knowledgeArticle.count();
  if (count === 0) {
    for (const a of KB_ARTICLES) {
      await prisma.knowledgeArticle.create({
        data: {
          slug: a.slug,
          category: a.category,
          title: a.title,
          content: a.content,
          order: a.order,
        },
      });
    }
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
  });

  // Group by category for convenience
  const categories = KB_CATEGORIES.map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.id),
  }));

  const response = NextResponse.json({ articles, categories });

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  return response;
}
