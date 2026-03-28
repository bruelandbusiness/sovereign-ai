import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { z } from "zod";

export const dynamic = "force-dynamic";
const prospectCreateSchema = z.object({
  businessName: z.string().min(1).max(300),
  ownerName: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().max(500).optional(),
  vertical: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  estimatedRevenue: z.number().int().min(0).optional(),
  employeeCount: z.number().int().min(0).optional(),
  source: z.string().max(50).optional(),
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
  const status = searchParams.get("status")?.trim() || undefined;
  const vertical = searchParams.get("vertical")?.trim() || undefined;
  const cursor = searchParams.get("cursor")?.trim() || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (vertical) where.vertical = vertical;

  try {
    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { score: "desc" },
      take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        email: true,
        phone: true,
        website: true,
        vertical: true,
        city: true,
        state: true,
        estimatedRevenue: true,
        employeeCount: true,
        source: true,
        score: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = NextResponse.json({
      prospects,
      nextCursor:
        prospects.length === 50 ? prospects[prospects.length - 1].id : null,
    });
    response.headers.set("Cache-Control", "private, max-age=60");
    return response;
  } catch (err) {
    logger.errorWithCause("[api/acquisition/prospects] Failed to list prospects", err);
    return NextResponse.json(
      { error: "Failed to list prospects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = prospectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    // Score the prospect using the scoring function
    const { scoreProspect } = await import("@/lib/acquisition");
    const score = scoreProspect({
      ...data,
      painSignals: [],
      budgetSignals: [],
    });

    const prospect = await prisma.prospect.create({
      data: {
        businessName: data.businessName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        website: data.website,
        vertical: data.vertical,
        city: data.city,
        state: data.state,
        estimatedRevenue: data.estimatedRevenue,
        employeeCount: data.employeeCount,
        source: data.source ?? "manual",
        score,
        status: "new",
      },
    });

    logger.info("[api/acquisition/prospects] Prospect created manually", {
      prospectId: prospect.id,
    });

    return NextResponse.json({ prospect }, { status: 201 });
  } catch (err) {
    logger.errorWithCause("[api/acquisition/prospects] Failed to create prospect", err);
    return NextResponse.json(
      { error: "Failed to create prospect" },
      { status: 500 }
    );
  }
}
