import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

// GET: Calculate and return AEO score, stats, and citation trend
export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Fetch all data in parallel
    const [allContent, allQueries, allStrategies] = await Promise.all([
      prisma.aEOContent.findMany({
        where: { clientId },
        select: { type: true, status: true },
        take: 500,
      }),
      prisma.aEOQuery.findMany({
        where: { clientId },
        select: {
          isCited: true,
          platform: true,
          checkedAt: true,
          position: true,
        },
        take: 500,
      }),
      prisma.aEOStrategy.findMany({
        where: { clientId },
        select: { status: true },
        take: 200,
      }),
    ]);

    // ── Content-based scoring (50 points) ──────────────────
    const contentCounts = {
      faqSchema: allContent.filter((c) => c.type === "faq_schema").length,
      localBusinessSchema: allContent.filter(
        (c) => c.type === "local_business_schema"
      ).length,
      howToSchema: allContent.filter((c) => c.type === "how_to_schema").length,
      servicePage: allContent.filter((c) => c.type === "service_page").length,
      knowledgePanel: allContent.filter(
        (c) => c.type === "knowledge_panel"
      ).length,
    };

    const contentScore = {
      faqSchema: Math.min(15, contentCounts.faqSchema * 5),
      localBusinessSchema: contentCounts.localBusinessSchema > 0 ? 10 : 0,
      howToSchema: Math.min(10, contentCounts.howToSchema * 5),
      contentOptimization: Math.min(10, contentCounts.servicePage * 3),
      knowledgePanel: contentCounts.knowledgePanel > 0 ? 5 : 0,
    };

    const contentTotal =
      contentScore.faqSchema +
      contentScore.localBusinessSchema +
      contentScore.howToSchema +
      contentScore.contentOptimization +
      contentScore.knowledgePanel;

    // ── Citation-based scoring (50 points) ──────────────────
    const totalQueries = allQueries.length;
    const citedQueries = allQueries.filter((q) => q.isCited).length;
    const citationRate =
      totalQueries > 0 ? Math.round((citedQueries / totalQueries) * 100) : 0;

    // Citation rate contributes up to 30 points
    const citationRateScore = Math.min(
      30,
      Math.round((citationRate / 100) * 30)
    );

    // Platform coverage contributes up to 20 points (5 per platform)
    const platforms = new Set(allQueries.map((q) => q.platform));
    const platformCoverageScore = Math.min(20, platforms.size * 5);

    const citationTotal = citationRateScore + platformCoverageScore;

    // ── Overall AEO score ──────────────────────────────────
    const score = Math.min(100, contentTotal + citationTotal);

    // ── Strategies stats ───────────────────────────────────
    const pendingStrategies = allStrategies.filter(
      (s) => s.status === "pending"
    ).length;
    const inProgressStrategies = allStrategies.filter(
      (s) => s.status === "in_progress"
    ).length;

    // ── Citation trend (last 8 weeks) ──────────────────────
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const recentQueries = allQueries.filter(
      (q) => new Date(q.checkedAt) >= eightWeeksAgo
    );

    const weekBuckets: Array<{ week: string; cited: number; total: number }> =
      [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i - 1) * 7);

      const weekQueries = recentQueries.filter((q) => {
        const checked = new Date(q.checkedAt);
        return checked >= weekStart && checked < weekEnd;
      });

      weekBuckets.push({
        week: weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        cited: weekQueries.filter((q) => q.isCited).length,
        total: weekQueries.length,
      });
    }

    // ── Recommendations ────────────────────────────────────
    const recommendations: string[] = [];

    if (contentScore.faqSchema < 15) {
      recommendations.push(
        "Add more FAQ schema markup to answer common customer questions"
      );
    }
    if (contentScore.localBusinessSchema === 0) {
      recommendations.push(
        "Add LocalBusiness schema markup for better local search visibility"
      );
    }
    if (contentScore.howToSchema < 10) {
      recommendations.push(
        "Create HowTo schema for your service processes to appear in step-by-step results"
      );
    }
    if (contentScore.contentOptimization < 10) {
      recommendations.push(
        "Optimize more service pages with AI-friendly content structure"
      );
    }
    if (contentScore.knowledgePanel === 0) {
      recommendations.push(
        "Create a knowledge panel entry to establish your business as an authority"
      );
    }
    if (totalQueries === 0) {
      recommendations.push(
        "Start tracking queries to monitor your AI citation visibility"
      );
    }
    if (citationRate < 50 && totalQueries > 0) {
      recommendations.push(
        `Your citation rate is ${citationRate}%. Create targeted content for uncited queries to improve.`
      );
    }
    if (platforms.size < 3) {
      recommendations.push(
        "Track queries across more platforms (ChatGPT, Perplexity, Google AI, Gemini)"
      );
    }

    return NextResponse.json({
      score,
      breakdown: {
        faqSchema: contentScore.faqSchema,
        localBusinessSchema: contentScore.localBusinessSchema,
        howToSchema: contentScore.howToSchema,
        contentOptimization: contentScore.contentOptimization,
        knowledgePanel: contentScore.knowledgePanel,
        citationRate: citationRateScore,
        platformCoverage: platformCoverageScore,
      },
      recommendations,
      stats: {
        totalContent: allContent.length,
        totalQueries,
        citedQueries,
        citationRate,
        platformsMonitored: platforms.size,
        pendingActions: pendingStrategies + inProgressStrategies,
      },
      trend: weekBuckets,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[aeo/score] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to calculate AEO score" },
      { status: 500 }
    );
  }
}
