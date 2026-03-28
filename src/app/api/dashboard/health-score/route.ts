import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { cache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { SERVICES } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface FactorScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  tip: string;
}

interface HealthScoreResponse {
  overall: number;
  label: string;
  factors: FactorScore[];
  suggestions: string[];
}

function getLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function GET() {
  try {
    const { clientId, accountId } = await requireClient();

    const result = await cache.wrap(
      `health-score:${clientId}`,
      60,
      async (): Promise<HealthScoreResponse> => {
        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const startOf2MonthsAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          1,
        );

        const [
          leadsThisMonth,
          leadsLastMonth,
          reviewAgg,
          activeServices,
          totalAvailableServices,
          revenueThisMonth,
          revenueLastMonth,
          avgResponseTime,
          recentLogins,
        ] = await Promise.all([
          prisma.lead.count({
            where: { clientId, createdAt: { gte: startOfMonth } },
          }),
          prisma.lead.count({
            where: {
              clientId,
              createdAt: { gte: startOfLastMonth, lt: startOfMonth },
            },
          }),
          prisma.reviewCampaign.aggregate({
            where: { clientId, rating: { not: null } },
            _avg: { rating: true },
            _count: true,
          }),
          prisma.clientService.count({
            where: { clientId, status: "active" },
          }),
          Promise.resolve(
            SERVICES.filter((s) => s.id !== "custom").length,
          ),
          prisma.revenueEvent.aggregate({
            where: {
              clientId,
              createdAt: { gte: startOfMonth },
            },
            _sum: { amount: true },
          }),
          prisma.revenueEvent.aggregate({
            where: {
              clientId,
              createdAt: {
                gte: startOfLastMonth,
                lt: startOfMonth,
              },
            },
            _sum: { amount: true },
          }),
          prisma.lead.findMany({
            where: {
              clientId,
              createdAt: { gte: startOf2MonthsAgo },
              lastContactedAt: { not: null },
            },
            select: {
              createdAt: true,
              lastContactedAt: true,
            },
            take: 200,
            orderBy: { createdAt: "desc" },
          }),
          prisma.auditLog.count({
            where: {
              accountId,
              action: "login",
              createdAt: { gte: startOfLastMonth },
            },
          }),
        ]);

        // --- Factor 1: Lead Volume Trend (20%) ---
        let leadTrendScore = 50;
        if (leadsLastMonth > 0) {
          const growthPct =
            ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100;
          leadTrendScore = clampScore(50 + growthPct);
        } else if (leadsThisMonth > 0) {
          leadTrendScore = 80;
        } else {
          leadTrendScore = 20;
        }

        // --- Factor 2: Response Time (20%) ---
        let responseTimeScore = 50;
        if (avgResponseTime.length > 0) {
          const responseTimes = avgResponseTime
            .filter(
              (l): l is typeof l & { lastContactedAt: Date } =>
                l.lastContactedAt !== null,
            )
            .map((l) => {
              const diffHours =
                (l.lastContactedAt.getTime() - l.createdAt.getTime()) /
                (1000 * 60 * 60);
              return Math.max(0, diffHours);
            });

          if (responseTimes.length > 0) {
            const avgHours =
              responseTimes.reduce((a, b) => a + b, 0) /
              responseTimes.length;
            if (avgHours <= 1) responseTimeScore = 100;
            else if (avgHours <= 4) responseTimeScore = 85;
            else if (avgHours <= 12) responseTimeScore = 70;
            else if (avgHours <= 24) responseTimeScore = 50;
            else if (avgHours <= 48) responseTimeScore = 30;
            else responseTimeScore = 15;
          }
        }

        // --- Factor 3: Review Score (15%) ---
        const avgRating = reviewAgg._avg.rating ?? 0;
        const reviewCount = reviewAgg._count;
        let reviewScore = 30;
        if (reviewCount > 0 && avgRating > 0) {
          reviewScore = clampScore((avgRating / 5) * 100);
          if (reviewCount < 5) {
            reviewScore = Math.min(reviewScore, 70);
          }
        }

        // --- Factor 4: Service Utilization (15%) ---
        const utilizationRatio =
          totalAvailableServices > 0
            ? activeServices / totalAvailableServices
            : 0;
        const serviceScore = clampScore(utilizationRatio * 100);

        // --- Factor 5: Revenue Trend (15%) ---
        const revThis = revenueThisMonth._sum.amount ?? 0;
        const revLast = revenueLastMonth._sum.amount ?? 0;
        let revenueScore = 50;
        if (revLast > 0) {
          const revGrowth = ((revThis - revLast) / revLast) * 100;
          revenueScore = clampScore(50 + revGrowth);
        } else if (revThis > 0) {
          revenueScore = 80;
        } else {
          revenueScore = 20;
        }

        // --- Factor 6: Engagement (15%) ---
        let engagementScore = 30;
        if (recentLogins >= 20) engagementScore = 100;
        else if (recentLogins >= 12) engagementScore = 85;
        else if (recentLogins >= 6) engagementScore = 65;
        else if (recentLogins >= 2) engagementScore = 45;
        else if (recentLogins >= 1) engagementScore = 30;
        else engagementScore = 10;

        const factors: FactorScore[] = [
          {
            key: "leadTrend",
            label: "Lead Volume Trend",
            score: leadTrendScore,
            weight: 0.2,
            tip:
              leadTrendScore >= 70
                ? "Your lead volume is growing nicely."
                : "Increase lead generation with more campaigns.",
          },
          {
            key: "responseTime",
            label: "Response Time",
            score: responseTimeScore,
            weight: 0.2,
            tip:
              responseTimeScore >= 70
                ? "Great response times keep leads engaged."
                : "Respond to new leads within 1 hour for best results.",
          },
          {
            key: "reviewScore",
            label: "Review Score",
            score: reviewScore,
            weight: 0.15,
            tip:
              reviewScore >= 70
                ? "Strong reviews build trust with prospects."
                : "Ask happy customers to leave a Google review.",
          },
          {
            key: "serviceUtilization",
            label: "Service Utilization",
            score: serviceScore,
            weight: 0.15,
            tip:
              serviceScore >= 50
                ? "You are using a solid mix of AI services."
                : "Activate more services to maximize your ROI.",
          },
          {
            key: "revenueTrend",
            label: "Revenue Trend",
            score: revenueScore,
            weight: 0.15,
            tip:
              revenueScore >= 70
                ? "Revenue is trending in the right direction."
                : "Focus on converting qualified leads to boost revenue.",
          },
          {
            key: "engagement",
            label: "Engagement",
            score: engagementScore,
            weight: 0.15,
            tip:
              engagementScore >= 60
                ? "Consistent dashboard usage drives better results."
                : "Log in weekly to review leads and monitor performance.",
          },
        ];

        const overall = clampScore(
          factors.reduce((sum, f) => sum + f.score * f.weight, 0),
        );

        // Build top 3 suggestions from lowest-scoring factors
        const suggestions = [...factors]
          .sort((a, b) => a.score - b.score)
          .slice(0, 3)
          .map((f) => {
            switch (f.key) {
              case "leadTrend":
                return "Launch an AI Lead Generation campaign to increase monthly lead volume.";
              case "responseTime":
                return "Enable the AI Voice Agent or Chatbot to respond to leads instantly, 24/7.";
              case "reviewScore":
                return "Set up an automated Review Campaign to collect more 5-star Google reviews.";
              case "serviceUtilization":
                return "Explore the Marketplace to activate additional AI services and grow faster.";
              case "revenueTrend":
                return "Use the CRM to follow up on qualified leads and close more deals this month.";
              case "engagement":
                return "Check your dashboard at least once a week to stay on top of new leads and performance.";
              default:
                return "Review your dashboard regularly for optimization opportunities.";
            }
          });

        return {
          overall,
          label: getLabel(overall),
          factors,
          suggestions,
        };
      },
    );

    const response = NextResponse.json(result);
    response.headers.set(
      "Cache-Control",
      "private, max-age=3600, stale-while-revalidate=600",
    );
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause("[health-score] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to compute health score" },
      { status: 500 },
    );
  }
}
