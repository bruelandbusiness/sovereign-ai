import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      topSelling,
      revenueByTierRaw,
      recentPurchases,
      totalPublished,
      totalRevenueAgg,
      totalSalesCount,
    ] = await Promise.all([
      // Top 10 selling products (already sorted by salesCount in DB)
      prisma.digitalProduct.findMany({
        where: { salesCount: { gt: 0 } },
        select: {
          id: true,
          name: true,
          tier: true,
          price: true,
          salesCount: true,
          rating: true,
          reviewCount: true,
        },
        orderBy: { salesCount: "desc" },
        take: 10,
      }),
      // Revenue by tier via groupBy on purchases joined with product
      prisma.productPurchase.groupBy({
        by: ["productId"],
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Recent purchases for time series (last 30 days)
      prisma.productPurchase.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      // Total published products
      prisma.digitalProduct.count({ where: { isPublished: true } }),
      // Total revenue aggregate
      prisma.productPurchase.aggregate({
        _sum: { amount: true },
      }),
      // Total sales count
      prisma.productPurchase.count(),
    ]);

    // For revenue by tier, we need to map productId -> tier.
    // Fetch only the tiers for products that have purchases.
    const productIds = revenueByTierRaw.map((r) => r.productId);
    const productTiers =
      productIds.length > 0
        ? await prisma.digitalProduct.findMany({
            where: { id: { in: productIds } },
            select: { id: true, tier: true },
          })
        : [];
    const tierMap = new Map(productTiers.map((p) => [p.id, p.tier ?? "unknown"]));

    const revenueByTier: Record<string, { revenue: number; sales: number }> = {};
    for (const row of revenueByTierRaw) {
      const tier = tierMap.get(row.productId) ?? "unknown";
      if (!revenueByTier[tier]) {
        revenueByTier[tier] = { revenue: 0, sales: 0 };
      }
      revenueByTier[tier].revenue += row._sum.amount ?? 0;
      revenueByTier[tier].sales += row._count.id;
    }

    // Top selling with computed revenue
    const topSellingResult = topSelling.map((p) => ({
      id: p.id,
      name: p.name,
      tier: p.tier,
      price: p.price,
      salesCount: p.salesCount,
      revenue: p.salesCount * p.price,
      rating: p.rating,
      reviewCount: p.reviewCount,
    }));

    // Revenue over time (last 30 days, grouped by day)
    const revenueOverTime: Record<string, { revenue: number; sales: number }> =
      {};
    // Pre-fill all 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      revenueOverTime[key] = { revenue: 0, sales: 0 };
    }
    for (const purchase of recentPurchases) {
      const key = purchase.createdAt.toISOString().split("T")[0];
      if (revenueOverTime[key]) {
        revenueOverTime[key].revenue += purchase.amount;
        revenueOverTime[key].sales += 1;
      }
    }

    // Conversion rate estimate: total purchases / total published products
    const conversionRate =
      totalPublished > 0
        ? Math.round((totalSalesCount / totalPublished) * 100) / 100
        : 0;

    const totalRevenue = totalRevenueAgg._sum.amount ?? 0;

    return NextResponse.json({
      revenueByTier,
      topSelling: topSellingResult,
      revenueOverTime: Object.entries(revenueOverTime).map(
        ([date, data]) => ({
          date,
          revenue: data.revenue,
          sales: data.sales,
        })
      ),
      conversionRate,
      summary: {
        totalRevenue,
        totalSales: totalSalesCount,
        totalPublished,
        avgOrderValue:
          totalSalesCount > 0
            ? Math.round(totalRevenue / totalSalesCount)
            : 0,
      },
    });
  } catch (error) {
    logger.errorWithCause("Product analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
