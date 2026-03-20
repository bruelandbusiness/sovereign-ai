import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
  category: z.string().max(100).optional(),
  features: z.array(z.string().max(500)).max(30).optional(),
  imageUrl: z.string().max(1000).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    const { id } = await params;

    const product = await prisma.digitalProduct.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { createdAt: "desc" },
          include: {
            account: {
              select: { id: true, email: true, name: true },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            account: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin get product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify product exists
    const existing = await prisma.digitalProduct.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.digitalProduct.findUnique({
        where: { slug: body.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data — only include fields that were sent
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "slug", "name", "tagline", "description", "tier", "category",
      "price", "comparePrice", "imageUrl", "previewUrl",
      "deliveryType", "deliveryUrl", "deliveryNotes",
      "features", "techStack", "includes",
      "isPublished", "isFeatured",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

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
    console.error("Admin update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

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

    await prisma.digitalProduct.delete({
      where: { id },
    });

    await logAudit({
      accountId,
      action: "delete",
      resource: "product",
      resourceId: id,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
