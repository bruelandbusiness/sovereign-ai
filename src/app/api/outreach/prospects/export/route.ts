import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import type { ExportedProspect } from "@/lib/outreach/types";
import { z } from "zod";

export const dynamic = "force-dynamic";
const TAG = "[api/outreach/prospects/export]";

// ---------------------------------------------------------------------------
// POST — export prospects as JSON array ready for campaign import
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exportSchema = z.object({
      vertical: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      status: z.string().max(50).optional(),
      minScore: z.number().min(0).max(100).optional(),
      hasEmail: z.boolean().optional(),
    });

    const body = await request.json();
    const parsed = exportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { vertical, city, state, status, minScore, hasEmail } = parsed.data;

    const where: Record<string, unknown> = {
      source: "scrape",
    };

    if (vertical) where.vertical = vertical;
    if (city) where.city = city;
    if (state) where.state = state;
    if (status) where.status = status;
    if (minScore) {
      where.score = { gte: minScore };
    }
    if (hasEmail) {
      where.email = { not: null };
    }

    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 1000, // reasonable export cap
      select: {
        businessName: true,
        ownerName: true,
        email: true,
        emailVerified: true,
        phone: true,
        website: true,
        address: true,
        vertical: true,
        city: true,
        state: true,
        rating: true,
        reviewCount: true,
        googleMapsUrl: true,
        score: true,
        status: true,
        source: true,
      },
    });

    const exported: ExportedProspect[] = prospects.map((p) => ({
      businessName: p.businessName,
      ownerName: p.ownerName,
      email: p.email,
      emailVerified: p.emailVerified,
      phone: p.phone,
      website: p.website,
      address: p.address,
      vertical: p.vertical,
      city: p.city,
      state: p.state,
      rating: p.rating,
      reviewCount: p.reviewCount,
      googleMapsUrl: p.googleMapsUrl,
      score: p.score,
      status: p.status,
      source: p.source,
    }));

    logger.info(`${TAG} Exported prospects`, { count: exported.length });

    return NextResponse.json({
      count: exported.length,
      prospects: exported,
    });
  } catch (error) {
    logger.errorWithCause(`${TAG} POST failed`, error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 },
    );
  }
}
