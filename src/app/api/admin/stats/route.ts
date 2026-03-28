import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
  // Calculate churn: subscriptions canceled in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const statsData = await cache.wrap("admin:stats", 30, async () => {
  const [
    totalClients,
    activeServices,
    subscriptions,
    recentClients,
    canceledLast30,
    activeStart30DaysAgo,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.clientService.count({ where: { status: "active" } }),
    prisma.subscription.findMany({
      where: { status: "active" },
      select: { monthlyAmount: true, bundleId: true },
    }),
    prisma.client.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        createdAt: true,
        account: { select: { email: true } },
        subscription: {
          select: { bundleId: true, monthlyAmount: true, status: true },
        },
      },
    }),
    // Canceled subscriptions in the last 30 days
    prisma.subscription.count({
      where: {
        status: "canceled",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    // Subscriptions that were active at the start of the period
    // (currently active + recently canceled)
    prisma.subscription.count({
      where: {
        OR: [
          { status: "active" },
          {
            status: "canceled",
            updatedAt: { gte: thirtyDaysAgo },
          },
        ],
      },
    }),
  ]);

  const mrr = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const avgRevenue = totalClients > 0 ? Math.round(mrr / totalClients) : 0;
  const churnRate =
    activeStart30DaysAgo > 0
      ? Math.round((canceledLast30 / activeStart30DaysAgo) * 1000) / 10
      : 0;

  // Bundle breakdown
  const bundleBreakdown: Record<string, number> = {};
  for (const sub of subscriptions) {
    const key = sub.bundleId || "custom";
    bundleBreakdown[key] = (bundleBreakdown[key] || 0) + 1;
  }

  return {
    totalClients,
    mrr,
    activeServices,
    avgRevenue,
    churnRate,
    bundleBreakdown,
    recentClients: recentClients.map((c) => ({
      id: c.id,
      businessName: c.businessName,
      ownerName: c.ownerName,
      email: c.account.email,
      createdAt: c.createdAt,
      subscription: c.subscription
        ? {
            bundleId: c.subscription.bundleId,
            monthlyAmount: c.subscription.monthlyAmount,
            status: c.subscription.status,
          }
        : null,
    })),
  };
  });

  const response = NextResponse.json(statsData);
  response.headers.set("Cache-Control", "private, max-age=30");
  return response;
  } catch (error) {
    logger.errorWithCause("[admin/stats] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
