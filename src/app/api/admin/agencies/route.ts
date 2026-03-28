import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const createAgencySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  customDomain: z.string().optional().or(z.literal("")),
  starterPrice: z.number().int().min(0).optional(),
  growthPrice: z.number().int().min(0).optional(),
  empirePrice: z.number().int().min(0).optional(),
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  try {
    const [agencies, total] = await Promise.all([
      prisma.agency.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.agency.count(),
    ]);

    // Look up owner accounts separately (Agency has no direct relation)
    const ownerAccountIds = [...new Set(agencies.map((a) => a.ownerAccountId))];
    const ownerAccounts = await prisma.account.findMany({
      where: { id: { in: ownerAccountIds } },
      select: { id: true, email: true, name: true },
    });
    const ownerMap = new Map(ownerAccounts.map((o) => [o.id, o]));

    return NextResponse.json({
      agencies: agencies.map((a) => {
        const owner = ownerMap.get(a.ownerAccountId);
        return {
          id: a.id,
          name: a.name,
          slug: a.slug,
          ownerEmail: owner?.email ?? null,
          ownerName: owner?.name ?? null,
          logoUrl: a.logoUrl,
          primaryColor: a.primaryColor,
          accentColor: a.accentColor,
          customDomain: a.customDomain,
          starterPrice: a.starterPrice,
          growthPrice: a.growthPrice,
          empirePrice: a.empirePrice,
          stripeAccountId: a.stripeAccountId,
          clientCount: 0,
          createdAt: a.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.errorWithCause("[admin/agencies] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const parsed = createAgencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, logoUrl, primaryColor, accentColor, customDomain, starterPrice, growthPrice, empirePrice } =
      parsed.data;

    // Check slug uniqueness
    const existing = await prisma.agency.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }

    const agency = await prisma.agency.create({
      data: {
        name,
        slug,
        ownerAccountId: accountId,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || "#4c85ff",
        accentColor: accentColor || "#22d3a1",
        customDomain: customDomain || null,
        starterPrice: starterPrice ?? 349700,
        growthPrice: growthPrice ?? 699700,
        empirePrice: empirePrice ?? 1299700,
      },
    });

    await logAudit({
      accountId,
      action: "create",
      resource: "agency",
      resourceId: agency.id,
      metadata: { name, slug },
    });

    return NextResponse.json(
      {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        primaryColor: agency.primaryColor,
        accentColor: agency.accentColor,
        createdAt: agency.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    logger.errorWithCause("[api/admin/agencies] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
