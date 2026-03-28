import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { logger } from "@/lib/logger";
import {
  checkGoogleReviews,
  checkYelpReviews,
  getReputationScore,
} from "@/lib/integrations/reputation";

export const dynamic = "force-dynamic";

// GET: Calculate and return reputation metrics
export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Get reputation config
    const clientService = await prisma.clientService.findFirst({
      where: { clientId, serviceId: "reputation" },
    });

    let config: { googlePlaceId?: string; yelpBusinessId?: string } = {};
    if (clientService?.config) {
      try {
        config = JSON.parse(clientService.config) as {
          googlePlaceId?: string;
          yelpBusinessId?: string;
        };
      } catch {
        // use defaults
      }
    }

    // Fetch reviews from both platforms using allSettled so one platform
    // failing doesn't prevent us from showing data from the other.
    const results = await Promise.allSettled([
      config.googlePlaceId
        ? checkGoogleReviews(config.googlePlaceId)
        : Promise.resolve([]),
      config.yelpBusinessId
        ? checkYelpReviews(config.yelpBusinessId)
        : Promise.resolve([]),
    ]);

    const googleReviews = results[0].status === "fulfilled" ? results[0].value : [];
    const yelpReviews = results[1].status === "fulfilled" ? results[1].value : [];
    const platformErrors: string[] = [];
    if (results[0].status === "rejected") platformErrors.push("google");
    if (results[1].status === "rejected") platformErrors.push("yelp");

    const allReviews = [...googleReviews, ...yelpReviews];

    // Calculate score
    const score = getReputationScore(allReviews);

    // Also include review campaign stats from the database
    const reviewCampaigns = await prisma.reviewCampaign.findMany({
      where: { clientId },
      select: { status: true, rating: true },
      take: 500,
    });

    const campaignStats = {
      totalCampaigns: reviewCampaigns.length,
      sent: reviewCampaigns.filter((c) => c.status !== "pending").length,
      completed: reviewCampaigns.filter((c) => c.status === "completed").length,
      averageCampaignRating:
        reviewCampaigns.filter((c) => c.rating != null).length > 0
          ? Math.round(
              (reviewCampaigns
                .filter((c) => c.rating != null)
                .reduce((sum, c) => sum + (c.rating || 0), 0) /
                reviewCampaigns.filter((c) => c.rating != null).length) *
                10
            ) / 10
          : 0,
    };

    return NextResponse.json({
      score,
      campaigns: campaignStats,
      lastUpdated: new Date().toISOString(),
      ...(platformErrors.length > 0 && {
        warnings: [`Failed to fetch reviews from: ${platformErrors.join(", ")}. Scores may be incomplete.`],
      }),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[reputation/score] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to calculate reputation score" },
      { status: 500 }
    );
  }
}
