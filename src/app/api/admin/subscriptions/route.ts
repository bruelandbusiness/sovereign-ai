import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const subscriptionUpdateSchema = z.object({
  id: z.string().min(1, "id is required"),
  bundleId: z.string().max(100).nullable().optional(),
  monthlyAmount: z.number().int().min(0).max(100_000_00).optional(),
  status: z.enum(["active", "past_due", "canceled", "trialing"]).optional(),
});

// ---------------------------------------------------------------------------
// GET — List subscriptions with client info, MRR breakdown (paginated)
// ---------------------------------------------------------------------------

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
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          client: {
            select: {
              id: true,
              businessName: true,
              ownerName: true,
              account: { select: { email: true } },
            },
          },
        },
      }),
      prisma.subscription.count(),
    ]);

    // MRR breakdown — use aggregate + groupBy instead of loading all records into memory
    const [mrrAggregate, mrrByBundleGroups] = await Promise.all([
      prisma.subscription.aggregate({
        where: { status: "active" },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.subscription.groupBy({
        by: ["bundleId"],
        where: { status: "active" },
        _sum: { monthlyAmount: true },
      }),
    ]);

    const totalMRR = mrrAggregate._sum.monthlyAmount || 0;
    const mrrByBundle: Record<string, number> = {};
    for (const group of mrrByBundleGroups) {
      const key = group.bundleId || "custom";
      mrrByBundle[key] = group._sum.monthlyAmount || 0;
    }

    return NextResponse.json({
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        businessName: s.client.businessName,
        ownerName: s.client.ownerName,
        email: s.client.account.email,
        bundleId: s.bundleId,
        monthlyAmount: s.monthlyAmount,
        status: s.status,
        stripeSubId: s.stripeSubId,
        stripeCustId: s.stripeCustId,
        currentPeriodEnd: s.currentPeriodEnd,
        createdAt: s.createdAt,
      })),
      mrr: {
        total: totalMRR,
        byBundle: mrrByBundle,
        activeCount: mrrAggregate._count,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.errorWithCause("[admin/subscriptions] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Modify subscription (change bundleId, monthlyAmount, status)
// ---------------------------------------------------------------------------

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = subscriptionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id, bundleId, monthlyAmount, status } = parsed.data;

  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (bundleId !== undefined) {
      changes.bundleId = { from: existing.bundleId, to: bundleId };
      updateData.bundleId = bundleId;
    }
    if (monthlyAmount !== undefined) {
      changes.monthlyAmount = { from: existing.monthlyAmount, to: monthlyAmount };
      updateData.monthlyAmount = monthlyAmount;
    }
    if (status !== undefined) {
      changes.status = { from: existing.status, to: status };
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        clientId: true,
        bundleId: true,
        monthlyAmount: true,
        status: true,
        stripeSubId: true,
        stripeCustId: true,
        currentPeriodEnd: true,
        createdAt: true,
      },
    });

    await logAudit({
      accountId,
      action: "update",
      resource: "subscription",
      resourceId: id,
      metadata: { changes },
    });

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    logger.errorWithCause("[api/admin/subscriptions] PUT failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
