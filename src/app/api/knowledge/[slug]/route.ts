import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KB_ARTICLES } from "@/lib/knowledge-base";
import { rateLimitByIP } from "@/lib/rate-limit";

/**
 * GET /api/knowledge/[slug]
 *
 * Returns a single knowledge base article by slug.
 * If no articles exist in the database, seeds them first.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const forwarded = _request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "knowledge-get", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { slug } = await params;

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

  const article = await prisma.knowledgeArticle.findUnique({
    where: { slug },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Get related articles in the same category
  const relatedArticles = await prisma.knowledgeArticle.findMany({
    where: {
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      title: true,
      order: true,
    },
  });

  const response = NextResponse.json({
    article: {
      id: article.id,
      slug: article.slug,
      category: article.category,
      title: article.title,
      content: article.content,
      order: article.order,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    },
    relatedArticles,
  });

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  return response;
}
