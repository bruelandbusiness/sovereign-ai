import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TEMPLATE_SEEDS } from "@/lib/templates";

/**
 * GET /api/templates — List templates with optional filters.
 * Query params: vertical, category
 *
 * On first call, if the Template table is empty the static seeds are
 * automatically inserted so the library is pre-populated.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vertical = searchParams.get("vertical");
  const category = searchParams.get("category");

  // Auto-seed if table is empty
  const count = await prisma.template.count();
  if (count === 0) {
    await prisma.template.createMany({
      data: TEMPLATE_SEEDS.map((t) => ({
        category: t.category,
        vertical: t.vertical,
        name: t.name,
        description: t.description,
        content: t.content,
        tags: Array.isArray(t.tags) ? JSON.stringify(t.tags) : t.tags,
      })),
    });
  }

  const where: Record<string, string> = {};
  if (vertical) where.vertical = vertical;
  if (category) where.category = category;

  const templates = await prisma.template.findMany({
    where,
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      category: true,
      vertical: true,
      name: true,
      description: true,
      tags: true,
      usageCount: true,
      createdAt: true,
    },
  });

  const response = NextResponse.json(templates);

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  return response;
}
