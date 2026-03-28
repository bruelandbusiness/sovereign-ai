import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  // Rate limit: 60 requests per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "products-library-get", 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchases = await prisma.productPurchase.findMany({
      where: { accountId: session.account.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            tier: true,
            category: true,
            price: true,
            imageUrl: true,
            deliveryType: true,
            deliveryNotes: true,
            features: true,
            techStack: true,
            includes: true,
          },
        },
      },
    });

    const response = NextResponse.json({ purchases });
    response.headers.set("Cache-Control", "private, no-cache");
    return response;
  } catch (error) {
    logger.errorWithCause("Product library error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library" },
      { status: 500 }
    );
  }
}
