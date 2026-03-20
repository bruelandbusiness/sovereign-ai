import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — Dashboard KPIs for AI Photo Estimating
//
// Returns:
//   estimatesToday, totalEstimates, avgEstimateValue,
//   conversionRate (estimate -> booked), totalRevenue,
//   confidenceBreakdown, statusBreakdown
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const [allEstimates, estimatesTodayCount] = await Promise.all([
      prisma.photoEstimate.findMany({
        where: { clientId },
        select: {
          estimateLow: true,
          estimateHigh: true,
          confidence: true,
          status: true,
          createdAt: true,
        },
        take: 5000,
      }),
      prisma.photoEstimate.count({
        where: {
          clientId,
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    const totalEstimates = allEstimates.length;

    // Average estimate value (midpoint of low-high range)
    const estimatesWithValues = allEstimates.filter(
      (e) => e.estimateLow && e.estimateHigh
    );
    const avgEstimateValue =
      estimatesWithValues.length > 0
        ? Math.round(
            estimatesWithValues.reduce(
              (sum, e) =>
                sum + ((e.estimateLow || 0) + (e.estimateHigh || 0)) / 2,
              0
            ) / estimatesWithValues.length
          )
        : 0;

    // Conversion rate (analyzed -> booked)
    const analyzedCount = allEstimates.filter(
      (e) => e.status !== "pending"
    ).length;
    const bookedCount = allEstimates.filter(
      (e) => e.status === "booked"
    ).length;
    const conversionRate =
      analyzedCount > 0
        ? Math.round((bookedCount / analyzedCount) * 100)
        : 0;

    // Total estimated revenue (sum of midpoints for booked estimates)
    const bookedEstimates = allEstimates.filter(
      (e) => e.status === "booked"
    );
    const totalRevenue = bookedEstimates.reduce(
      (sum, e) =>
        sum + ((e.estimateLow || 0) + (e.estimateHigh || 0)) / 2,
      0
    );

    // Confidence breakdown
    const confidenceBreakdown = {
      high: allEstimates.filter((e) => e.confidence != null && e.confidence >= 0.8).length,
      medium: allEstimates.filter((e) => e.confidence != null && e.confidence >= 0.5 && e.confidence < 0.8).length,
      low: allEstimates.filter((e) => e.confidence != null && e.confidence < 0.5).length,
    };

    // Status breakdown
    const statusBreakdown = {
      pending: allEstimates.filter((e) => e.status === "pending").length,
      analyzed: allEstimates.filter((e) => e.status === "analyzed").length,
      quoted: allEstimates.filter((e) => e.status === "quoted").length,
      booked: allEstimates.filter((e) => e.status === "booked").length,
      expired: allEstimates.filter((e) => e.status === "expired").length,
    };

    return NextResponse.json({
      estimatesToday: estimatesTodayCount,
      totalEstimates,
      avgEstimateValue,
      conversionRate,
      totalRevenue: Math.round(totalRevenue),
      confidenceBreakdown,
      statusBreakdown,
    });
  } catch (error) {
    console.error("[services/estimate/stats] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load estimate stats" },
      { status: 500 }
    );
  }
}
