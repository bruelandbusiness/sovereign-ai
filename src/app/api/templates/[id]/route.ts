import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * GET /api/templates/[id] — Get template detail including full content.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "templates-detail", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
  } catch (error) {
    logger.error("GET /api/templates/[id] failed", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
