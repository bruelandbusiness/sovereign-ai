import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/templates/[id] — Get template detail including full content.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const template = await prisma.template.findUnique({ where: { id } });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const response = NextResponse.json(template);

  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  return response;
}
