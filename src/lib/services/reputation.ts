import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReputationScore {
  overallScore: number; // 0-100
  avgRating: number;
  totalReviews: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platformBreakdown: Array<{
    platform: string;
    avgRating: number;
    count: number;
  }>;
  trend: "improving" | "stable" | "declining";
  summary: string;
}

export interface ReputationStrategyResult {
  currentState: string;
  strategies: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    timeline: string;
    expectedOutcome: string;
  }>;
  immediateActions: string[];
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the reputation management service for a client.
 * Sets up monitoring config and seeds initial review campaign data.
 */
export async function provisionReputation(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const defaultConfig = {
    googlePlaceId: null,
    yelpBusinessId: null,
    alertOnNegative: true,
    autoRespondPositive: false,
    monitoringEnabled: true,
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "reputation" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(defaultConfig) },
    });
  }

  const existingCampaign = await prisma.reviewCampaign.findFirst({
    where: { clientId },
  });

  if (!existingCampaign) {
    await prisma.reviewCampaign.create({
      data: {
        clientId,
        name: "Welcome Campaign",
        customerName: "Sample Customer",
        customerEmail: "sample@example.com",
        status: "completed",
        rating: 5,
        completedAt: new Date(),
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "review_received",
      title: "Reputation management activated",
      description: `Brand monitoring is now active for ${client.businessName}. Connect your Google Business and Yelp profiles to start tracking reviews.`,
    },
  });
}

// ---------------------------------------------------------------------------
// monitorReputation — aggregate review data and generate reputation score
// ---------------------------------------------------------------------------

/**
 * Aggregate review scores, sentiment trends, and generate a reputation score.
 *
 * Pulls all review data from ReviewResponse and ReviewCampaign records,
 * calculates platform-level breakdowns, and uses Claude to generate a
 * sentiment analysis and trend assessment.
 *
 * @param clientId - The client to monitor
 */
export async function monitorReputation(
  clientId: string
): Promise<ReputationScore> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Gather all review data
  const [reviewResponses, reviewCampaigns] = await Promise.all([
    prisma.reviewResponse.findMany({
      where: { clientId },
      select: { platform: true, rating: true, reviewText: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reviewCampaign.findMany({
      where: { clientId, rating: { not: null } },
      select: { rating: true, completedAt: true },
    }),
  ]);

  // Combine all ratings
  const allRatings = [
    ...reviewResponses.map((r) => ({ platform: r.platform, rating: r.rating, text: r.reviewText })),
    ...reviewCampaigns
      .filter((c) => c.rating != null)
      .map((c) => ({ platform: "direct", rating: c.rating as number, text: null as string | null })),
  ];

  const totalReviews = allRatings.length;
  const avgRating =
    totalReviews > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  // Sentiment breakdown
  const positive = allRatings.filter((r) => r.rating >= 4).length;
  const neutral = allRatings.filter((r) => r.rating === 3).length;
  const negative = allRatings.filter((r) => r.rating <= 2).length;

  // Platform breakdown
  const platformMap: Record<string, { totalRating: number; count: number }> = {};
  for (const review of allRatings) {
    if (!platformMap[review.platform]) {
      platformMap[review.platform] = { totalRating: 0, count: 0 };
    }
    platformMap[review.platform].totalRating += review.rating;
    platformMap[review.platform].count++;
  }

  const platformBreakdown = Object.entries(platformMap).map(([platform, data]) => ({
    platform,
    avgRating: Math.round((data.totalRating / data.count) * 10) / 10,
    count: data.count,
  }));

  // Calculate trend from recent vs older reviews
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentReviews = reviewResponses.filter((r) => r.createdAt >= thirtyDaysAgo);
  const olderReviews = reviewResponses.filter((r) => r.createdAt < thirtyDaysAgo);

  const recentAvg =
    recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : avgRating;
  const olderAvg =
    olderReviews.length > 0
      ? olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length
      : avgRating;

  let trend: "improving" | "stable" | "declining" = "stable";
  if (recentAvg > olderAvg + 0.3) trend = "improving";
  else if (recentAvg < olderAvg - 0.3) trend = "declining";

  // Overall score: weighted combination of avg rating, volume, and sentiment
  const ratingScore = (avgRating / 5) * 60; // max 60 points
  const volumeScore = Math.min(totalReviews / 50, 1) * 20; // max 20 points for 50+ reviews
  const sentimentScore = totalReviews > 0 ? (positive / totalReviews) * 20 : 0; // max 20 points
  const overallScore = Math.round(ratingScore + volumeScore + sentimentScore);

  // Use Claude to generate a narrative summary
  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);

  const recentReviewTexts = reviewResponses
    .slice(0, 10)
    .map((r) => `${r.platform} (${r.rating}/5): ${r.reviewText || "No text"}`)
    .join("\n");

  let summary: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "reputation.monitor",
      description: `Generate reputation summary for ${safeBusinessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are a reputation management analyst. Write concise, actionable summaries.`,
        messages: [
          {
            role: "user",
            content: `Summarize the online reputation for ${safeBusinessName}:
- Overall score: ${overallScore}/100
- Average rating: ${avgRating}/5 across ${totalReviews} reviews
- Sentiment: ${positive} positive, ${neutral} neutral, ${negative} negative
- Trend: ${trend}
- Recent reviews:\n${recentReviewTexts || "No recent review text available."}

Write a 2-3 sentence summary of their reputation status and the most important thing to focus on. Return only the summary text.`,
          },
        ],
      },
    });

    const text = response.content.find((b) => b.type === "text");
    summary =
      text && text.type === "text"
        ? text.text
        : `${safeBusinessName} has a ${avgRating}/5 average rating across ${totalReviews} reviews. Reputation is ${trend}.`;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[reputation] Monitor summary generation failed:", error);
    summary = `${safeBusinessName} has a ${avgRating}/5 average rating across ${totalReviews} reviews with a reputation trend that is ${trend}. ${negative > 0 ? `There are ${negative} negative reviews that need attention.` : "Sentiment is predominantly positive."}`;
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "review_received",
      title: "Reputation monitoring report generated",
      description: `Reputation score: ${overallScore}/100 | Avg rating: ${avgRating}/5 | Trend: ${trend}`,
    },
  });

  return {
    overallScore,
    avgRating,
    totalReviews,
    sentimentBreakdown: { positive, neutral, negative },
    platformBreakdown,
    trend,
    summary,
  };
}

// ---------------------------------------------------------------------------
// generateReputationStrategy — AI-powered improvement strategy
// ---------------------------------------------------------------------------

/**
 * Generate an AI-powered strategy for improving the client's online reputation.
 *
 * Analyzes current review data and generates specific, actionable strategies
 * tailored to the client's situation.
 *
 * @param clientId - The client to generate strategy for
 */
export async function generateReputationStrategy(
  clientId: string
): Promise<ReputationStrategyResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Get current reputation data
  const reputationScore = await monitorReputation(clientId);

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are an online reputation management strategist for local ${safeVertical} businesses. You create practical, implementable strategies that improve review ratings, increase review volume, and protect brand reputation.`;

  const userPrompt = `Create a reputation improvement strategy for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Current reputation data:
- Overall score: ${reputationScore.overallScore}/100
- Average rating: ${reputationScore.avgRating}/5
- Total reviews: ${reputationScore.totalReviews}
- Positive: ${reputationScore.sentimentBreakdown.positive}, Neutral: ${reputationScore.sentimentBreakdown.neutral}, Negative: ${reputationScore.sentimentBreakdown.negative}
- Trend: ${reputationScore.trend}
- Platforms: ${reputationScore.platformBreakdown.map((p) => `${p.platform}: ${p.avgRating}/5 (${p.count} reviews)`).join(", ") || "No platform data"}

Generate a comprehensive reputation strategy. Return a JSON object with:
- "currentState": 2-3 sentence assessment of where they stand
- "strategies": Array of 4-6 strategy objects with "title", "description" (2-3 sentences), "priority" ("high"/"medium"/"low"), "timeline" (e.g., "1-2 weeks"), "expectedOutcome"
- "immediateActions": Array of 3-5 things they can do right now (brief action items)

Focus on:
- Increasing review volume on the most impactful platforms
- Responding to negative reviews professionally
- Building a systematic review request process
- Leveraging positive reviews in marketing
- Monitoring and early warning for reputation issues`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "reputation.strategy",
      description: `Generate reputation strategy for ${safeBusinessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<ReputationStrategyResult>>(response, {});

    const result: ReputationStrategyResult = {
      currentState:
        parsed.currentState ||
        `${safeBusinessName} has a ${reputationScore.avgRating}/5 average rating across ${reputationScore.totalReviews} reviews. The reputation trend is ${reputationScore.trend}.`,
      strategies: Array.isArray(parsed.strategies)
        ? parsed.strategies
        : generateFallbackStrategies(reputationScore),
      immediateActions: Array.isArray(parsed.immediateActions)
        ? parsed.immediateActions
        : generateFallbackActions(reputationScore),
    };

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "review_received",
        title: "Reputation strategy generated",
        description: `AI-powered reputation improvement strategy created with ${result.strategies.length} strategies and ${result.immediateActions.length} immediate actions.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[reputation] Strategy generation failed:", error);

    return {
      currentState: `${safeBusinessName} has a ${reputationScore.avgRating}/5 average rating across ${reputationScore.totalReviews} reviews. The reputation trend is ${reputationScore.trend}.`,
      strategies: generateFallbackStrategies(reputationScore),
      immediateActions: generateFallbackActions(reputationScore),
    };
  }
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackStrategies(score: ReputationScore) {
  const strategies: ReputationStrategyResult["strategies"] = [
    {
      title: "Systematic Review Request Process",
      description: "Implement an automated review request system that sends a personalized message to every customer 24 hours after service completion. Make it easy with a direct link to your Google Business Profile.",
      priority: "high",
      timeline: "1-2 weeks",
      expectedOutcome: "2-3x increase in review volume within 60 days.",
    },
    {
      title: "Respond to All Reviews Within 24 Hours",
      description: "Set up alerts for new reviews and respond to every single one — positive and negative. Positive reviews get a thank-you; negative reviews get a professional resolution offer.",
      priority: "high",
      timeline: "Immediate",
      expectedOutcome: "Improved customer perception and 15-20% higher conversion from review readers.",
    },
  ];

  if (score.sentimentBreakdown.negative > 0) {
    strategies.push({
      title: "Negative Review Recovery Program",
      description: `You have ${score.sentimentBreakdown.negative} negative reviews that need attention. Reach out to each reviewer privately to resolve their concerns, then politely ask if they'd update their review.`,
      priority: "high",
      timeline: "1-2 weeks",
      expectedOutcome: "30-50% of negative reviewers may update their reviews after resolution.",
    });
  }

  strategies.push({
    title: "Showcase Reviews in Marketing",
    description: "Feature your best reviews on your website, social media, and email campaigns. Social proof is one of the most powerful conversion tools for local businesses.",
    priority: "medium",
    timeline: "2-4 weeks",
    expectedOutcome: "10-15% improvement in website and ad conversion rates.",
  });

  return strategies;
}

function generateFallbackActions(score: ReputationScore): string[] {
  const actions = [
    "Respond to all unanswered reviews on Google and Yelp today.",
    "Send review requests to your last 10 happy customers.",
    "Claim and optimize your Google Business Profile if not already done.",
  ];

  if (score.sentimentBreakdown.negative > 0) {
    actions.push("Contact your most recent negative reviewer to resolve their issue privately.");
  }

  actions.push("Add a review link to your email signature and invoices.");

  return actions;
}
