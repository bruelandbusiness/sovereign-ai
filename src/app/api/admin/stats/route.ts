import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const [totalClients, activeServices, subscriptions, recentClients] =
    await Promise.all([
      prisma.client.count(),
      prisma.clientService.count({ where: { status: "active" } }),
      prisma.subscription.findMany({
        where: { status: "active" },
        select: { monthlyAmount: true, bundleId: true },
      }),
      prisma.client.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          account: { select: { email: true } },
          subscription: {
            select: { bundleId: true, monthlyAmount: true, status: true },
          },
        },
      }),
    ]);

  const mrr = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const avgRevenue = totalClients > 0 ? Math.round(mrr / totalClients) : 0;

  // Bundle breakdown
  const bundleBreakdown: Record<string, number> = {};
  for (const sub of subscriptions) {
    const key = sub.bundleId || "custom";
    bundleBreakdown[key] = (bundleBreakdown[key] || 0) + 1;
  }

  return NextResponse.json({
    totalClients,
    mrr,
    activeServices,
    avgRevenue,
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
  });
}
