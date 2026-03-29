import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Default snapshot lifetime: 7 days. */
const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// POST — Generate a new dashboard snapshot
// ---------------------------------------------------------------------------

export async function POST() {
  try {
    const { clientId } = await requireClient();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        businessName: true,
        city: true,
        state: true,
        vertical: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 },
      );
    }

    // Gather current KPI data in parallel
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      leadsThisMonth,
      reviewAgg,
      activeServices,
      revenueAgg,
      serviceList,
    ] = await Promise.all([
      prisma.lead.count({
        where: { clientId, createdAt: { gte: startOfMonth } },
      }),
      prisma.reviewCampaign.aggregate({
        where: { clientId, rating: { not: null } },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.clientService.count({
        where: { clientId, status: "active" },
      }),
      prisma.revenueEvent.aggregate({
        where: { clientId, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.clientService.findMany({
        where: { clientId, status: "active" },
        select: { serviceId: true },
      }),
    ]);

    const totalLeads = leadsThisMonth;
    const avgReview = reviewAgg._avg.rating
      ? Number(reviewAgg._avg.rating.toFixed(1))
      : 0;
    const reviewCount = reviewAgg._count;
    const monthlyRevenue = (revenueAgg._sum.amount ?? 0) / 100;
    const conversionRate =
      totalLeads > 0 ? Math.round((reviewCount / totalLeads) * 100) : 0;

    const snapshotData = {
      businessName: client.businessName,
      city: client.city,
      state: client.state,
      vertical: client.vertical,
      snapshotDate: now.toISOString(),
      kpis: {
        leadsThisMonth: totalLeads,
        monthlyRevenue,
        avgReviewScore: avgReview,
        reviewCount,
        activeServices,
        conversionRate,
      },
      activeServiceIds: serviceList.map((s) => s.serviceId),
    };

    const token = randomUUID();
    const expiresAt = new Date(now.getTime() + SNAPSHOT_TTL_MS);

    const snapshot = await prisma.dashboardSnapshot.create({
      data: {
        clientId,
        token,
        businessName: client.businessName,
        expiresAt,
        data: JSON.stringify(snapshotData),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.sovereignai.co";
    const shareUrl = `${baseUrl}/snapshots/dashboard/${snapshot.token}`;

    return NextResponse.json({
      id: snapshot.id,
      token: snapshot.token,
      shareUrl,
      expiresAt: snapshot.expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[dashboard-snapshots] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET — List active snapshots for the authenticated client
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const snapshots = await prisma.dashboardSnapshot.findMany({
      where: {
        clientId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        token: true,
        businessName: true,
        snapshotDate: true,
        expiresAt: true,
        viewCount: true,
        createdAt: true,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.sovereignai.co";
    const items = snapshots.map((s) => ({
      id: s.id,
      token: s.token,
      businessName: s.businessName,
      snapshotDate: s.snapshotDate.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      viewCount: s.viewCount,
      shareUrl: `${baseUrl}/snapshots/dashboard/${s.token}`,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ snapshots: items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[dashboard-snapshots] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to list snapshots" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — Revoke a snapshot by ID
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const { clientId } = await requireClient();

    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json(
        { error: "Missing snapshot id" },
        { status: 400 },
      );
    }

    const snapshot = await prisma.dashboardSnapshot.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!snapshot || snapshot.clientId !== clientId) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 },
      );
    }

    await prisma.dashboardSnapshot.update({
      where: { id },
      data: { revoked: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    Sentry.captureException(error);
    logger.errorWithCause("[dashboard-snapshots] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to revoke snapshot" },
      { status: 500 },
    );
  }
}
