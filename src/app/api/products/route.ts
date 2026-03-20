import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 60 requests per hour per IP (public catalog)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "products-list", 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort") || "popular";
    const featured = searchParams.get("featured");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Build where clause — only published products for public endpoint
    const where: Record<string, unknown> = { isPublished: true };

    if (tier) {
      where.tier = tier;
    }
    if (category) {
      where.category = category;
    }
    if (featured === "true") {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { tagline: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order clause
    let orderBy: Record<string, string>;
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "popular":
      default:
        orderBy = { salesCount: "desc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.digitalProduct.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          tier: true,
          category: true,
          price: true,
          comparePrice: true,
          imageUrl: true,
          deliveryType: true,
          features: true,
          isPublished: true,
          isFeatured: true,
          salesCount: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
        },
      }),
      prisma.digitalProduct.count({ where }),
    ]);

    const response = NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
