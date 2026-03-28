import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

function safeJsonParse(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: 60 requests per hour per IP (public product detail)
    const ip = _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "product-detail", 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { slug } = await params;

    const product = await prisma.digitalProduct.findUnique({
      where: { slug },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            account: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const parsed = {
      ...product,
      features: safeJsonParse(product.features),
      techStack: safeJsonParse(product.techStack),
      includes: safeJsonParse(product.includes),
    };

    const response = NextResponse.json({ product: parsed });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    logger.errorWithCause("Product detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
