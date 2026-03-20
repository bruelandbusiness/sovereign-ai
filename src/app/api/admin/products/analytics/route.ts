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

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      products,
      allPurchases,
      recentPurchases,
      totalPublished,
    ] = await Promise.all([
      prisma.digitalProduct.findMany({
        select: {
          id: true,
          name: true,
          tier: true,
          price: true,
          salesCount: true,
          rating: true,
          reviewCount: true,
          isPublished: true,
        },
        orderBy: { salesCount: "desc" },
        take: 100,
      }),
      prisma.productPurchase.findMany({
        select: {
          amount: true,
          createdAt: true,
          product: {
            select: { tier: true },
          },
        },
        take: 100,
      }),
      prisma.productPurchase.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
      prisma.digitalProduct.count({ where: { isPublished: true } }),
    ]);

    // Revenue by tier
    const revenueByTier: Record<string, { revenue: number; sales: number }> = {};
    for (const purchase of allPurchases) {
      const tier = purchase.product.tier ?? "unknown";
      if (!revenueByTier[tier]) {
        revenueByTier[tier] = { revenue: 0, sales: 0 };
      }
      revenueByTier[tier].revenue += purchase.amount;
      revenueByTier[tier].sales += 1;
    }

    // Top selling products (top 10)
    const topSelling = products
      .filter((p) => p.salesCount > 0)
      .slice(0, 10)
      .map((p) => ({
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
    // This is a simplified metric — real conversion would need page views
    const totalSales = allPurchases.length;
    const conversionRate =
      totalPublished > 0
        ? Math.round((totalSales / totalPublished) * 100) / 100
        : 0;

    return NextResponse.json({
      revenueByTier,
      topSelling,
      revenueOverTime: Object.entries(revenueOverTime).map(
        ([date, data]) => ({
          date,
          revenue: data.revenue,
          sales: data.sales,
        })
      ),
      conversionRate,
      summary: {
        totalRevenue: allPurchases.reduce((sum, p) => sum + p.amount, 0),
        totalSales,
        totalPublished,
        avgOrderValue:
          totalSales > 0
            ? Math.round(
                allPurchases.reduce((sum, p) => sum + p.amount, 0) / totalSales
              )
            : 0,
      },
    });
  } catch (error) {
    console.error("Product analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
