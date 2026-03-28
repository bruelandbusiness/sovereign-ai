import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  tagline: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  tier: z.string().min(1).max(50),
  category: z.string().min(1).max(100),
  price: z.number().min(0),
  comparePrice: z.number().min(0).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  previewUrl: z.string().max(2000).nullable().optional(),
  deliveryType: z.string().min(1).max(50),
  deliveryUrl: z.string().max(2000).nullable().optional(),
  deliveryNotes: z.string().max(5000).nullable().optional(),
  features: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  includes: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const updateProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  tagline: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  tier: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  comparePrice: z.number().min(0).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  previewUrl: z.string().max(2000).nullable().optional(),
  deliveryType: z.string().min(1).max(50).optional(),
  deliveryUrl: z.string().max(2000).nullable().optional(),
  deliveryNotes: z.string().max(5000).nullable().optional(),
  features: z.array(z.string().max(500)).max(30).optional(),
  techStack: z.array(z.string().max(200)).max(20).optional(),
  includes: z.array(z.string().max(500)).max(30).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { tier: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, totalProducts, aggregates] = await Promise.all([
      prisma.digitalProduct.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          _count: { select: { purchases: true, reviews: true } },
        },
      }),
      prisma.digitalProduct.count(),
      prisma.productPurchase.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Calculate average rating across all products with reviews
    const publishedProducts = await prisma.digitalProduct.findMany({
      where: { isPublished: true },
      select: { rating: true, reviewCount: true },
      take: 100,
    });
    const totalReviews = publishedProducts.reduce(
      (sum, p) => sum + p.reviewCount,
      0
    );
    const avgRating =
      totalReviews > 0
        ? publishedProducts.reduce(
            (sum, p) => sum + p.rating * p.reviewCount,
            0
          ) / totalReviews
        : 0;

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        tier: p.tier,
        category: p.category,
        price: p.price,
        comparePrice: p.comparePrice,
        imageUrl: p.imageUrl,
        previewUrl: p.previewUrl,
        deliveryType: p.deliveryType,
        deliveryUrl: p.deliveryUrl,
        deliveryNotes: p.deliveryNotes,
        features: p.features,
        techStack: p.techStack,
        includes: p.includes,
        isPublished: p.isPublished,
        isFeatured: p.isFeatured,
        salesCount: p.salesCount,
        rating: p.rating,
        reviewCount: p._count.reviews,
        purchaseCount: p._count.purchases,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      stats: {
        totalProducts,
        totalRevenue: aggregates._sum.amount || 0,
        totalSales: aggregates._count,
        avgRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (error) {
    logger.errorWithCause("Admin products list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const body = await request.json();

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      slug,
      name,
      tagline,
      description,
      tier,
      category,
      price,
      comparePrice,
      imageUrl,
      previewUrl,
      deliveryType,
      deliveryUrl,
      deliveryNotes,
      features,
      techStack,
      includes: productIncludes,
      isPublished,
      isFeatured,
    } = parsed.data;

    const existing = await prisma.digitalProduct.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await prisma.digitalProduct.create({
      data: {
        slug,
        name,
        tagline,
        description: description || "",
        tier,
        category,
        price: typeof price === "number" ? price : parseInt(price, 10),
        comparePrice: comparePrice
          ? typeof comparePrice === "number"
            ? comparePrice
            : parseInt(comparePrice, 10)
          : null,
        imageUrl: imageUrl || null,
        previewUrl: previewUrl || null,
        deliveryType,
        deliveryUrl: deliveryUrl || null,
        deliveryNotes: deliveryNotes || null,
        features: JSON.stringify(features || []),
        techStack: JSON.stringify(techStack || []),
        includes: JSON.stringify(productIncludes || []),
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
      },
    });

    await logAudit({
      accountId,
      action: "create",
      resource: "product",
      resourceId: product.id,
      metadata: { name, slug },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    logger.errorWithCause("Admin create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const body = await request.json();

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    // Check slug uniqueness if slug is being updated
    if (data.slug) {
      const existing = await prisma.digitalProduct.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.tagline !== undefined) updateData.tagline = data.tagline;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.price !== undefined)
      updateData.price =
        typeof data.price === "number" ? data.price : parseInt(String(data.price), 10);
    if (data.comparePrice !== undefined)
      updateData.comparePrice = data.comparePrice
        ? typeof data.comparePrice === "number"
          ? data.comparePrice
          : parseInt(String(data.comparePrice), 10)
        : null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.previewUrl !== undefined) updateData.previewUrl = data.previewUrl || null;
    if (data.deliveryType !== undefined) updateData.deliveryType = data.deliveryType;
    if (data.deliveryUrl !== undefined) updateData.deliveryUrl = data.deliveryUrl || null;
    if (data.deliveryNotes !== undefined) updateData.deliveryNotes = data.deliveryNotes || null;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.techStack !== undefined) updateData.techStack = data.techStack;
    if (data.includes !== undefined) updateData.includes = data.includes;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    const product = await prisma.digitalProduct.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      accountId,
      action: "update",
      resource: "product",
      resourceId: id,
      metadata: { changes: Object.keys(updateData) },
    });

    return NextResponse.json({ product });
  } catch (error) {
    logger.errorWithCause("Admin update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    // Safety check: verify the product exists
    const existing = await prisma.digitalProduct.findUnique({
      where: { id },
      include: { _count: { select: { purchases: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Safety: warn if product has purchases (destructive operation)
    if (existing._count.purchases > 0) {
      const confirmParam = searchParams.get("confirm");
      if (confirmParam !== "true") {
        return NextResponse.json(
          {
            error: "Product has active purchases. Pass ?confirm=true to force delete.",
            purchaseCount: existing._count.purchases,
          },
          { status: 409 }
        );
      }
    }

    await prisma.digitalProduct.delete({ where: { id } });

    await logAudit({
      accountId,
      action: "delete",
      resource: "product",
      resourceId: id,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("Admin delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
