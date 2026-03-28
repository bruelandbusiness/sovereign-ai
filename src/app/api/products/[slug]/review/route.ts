import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  title: z.string().max(200).optional().nullable(),
  content: z.string().max(5000).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit: 20 review submissions per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "product-review", 20);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const product = await prisma.digitalProduct.findUnique({
      where: { slug },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify the user has purchased this product
    const purchase = await prisma.productPurchase.findUnique({
      where: {
        productId_accountId: {
          productId: product.id,
          accountId: session.account.id,
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "You must purchase this product before reviewing it" },
        { status: 403 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.productReview.findUnique({
      where: {
        productId_accountId: {
          productId: product.id,
          accountId: session.account.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { rating, title, content } = parsed.data;

    // Create the review — catch unique constraint violation (P2002) to handle
    // the race condition where the check above passed but another request
    // inserted first.
    let review;
    try {
      review = await prisma.productReview.create({
        data: {
          productId: product.id,
          accountId: session.account.id,
          rating,
          title: title?.trim() || null,
          content: content?.trim() || null,
        },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
        return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
      }
      throw err;
    }

    // Atomically update product rating and review count using a single SQL
    // statement to avoid read-modify-write race conditions when two reviews
    // are submitted simultaneously.
    await prisma.$executeRaw`
      UPDATE "DigitalProduct"
      SET
        "rating" = ROUND((
          SELECT AVG("rating")::numeric
          FROM "ProductReview"
          WHERE "productId" = ${product.id}
        ), 1),
        "reviewCount" = (
          SELECT COUNT(*)::int
          FROM "ProductReview"
          WHERE "productId" = ${product.id}
        ),
        "updatedAt" = NOW()
      WHERE "id" = ${product.id}
    `;

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    logger.errorWithCause("Product review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
