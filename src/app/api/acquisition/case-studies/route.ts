import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "case-studies-list", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const vertical = searchParams.get("vertical")?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (vertical) where.vertical = vertical;

  try {
    const caseStudies = await prisma.caseStudy.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      select: {
        id: true,
        clientId: true,
        vertical: true,
        title: true,
        narrative: true,
        metrics: true,
        generatedAt: true,
      },
    });

    const response = NextResponse.json({ caseStudies });
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return response;
  } catch (err) {
    logger.errorWithCause(
      "[api/acquisition/case-studies] Failed to list case studies",
      err
    );
    return NextResponse.json(
      { error: "Failed to list case studies" },
      { status: 500 }
    );
  }
}
