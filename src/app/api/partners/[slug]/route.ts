import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limit: 60 requests per hour per IP (public endpoint)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "partners-slug", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  try {
    const { slug } = await params;

    const partner = await prisma.affiliatePartner.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        company: true,
        slug: true,
        status: true,
      },
    });

    if (!partner || partner.status !== "active") {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ partner });
  } catch (error) {
    logger.errorWithCause("[partners/slug] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    );
  }
}
