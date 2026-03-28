import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { generateReviewResponse } from "@/lib/ai-review-response";
import {
  checkGoogleReviews,
  checkYelpReviews,
} from "@/lib/integrations/reputation";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Build a stable dedup key from review content.
 * Uses a hash of the full review text to avoid collisions from truncation
 * while keeping the key compact.
 */
function reviewDedupKey(platform: string, reviewerName: string, reviewText: string): string {
  const textHash = createHash("sha256").update(reviewText).digest("hex").substring(0, 16);
  return `${platform}:${reviewerName}:${textHash}`;
}

export const maxDuration = 300;

// GET: Auto-generate AI responses for new reviews that don't have responses yet
export const GET = withCronErrorHandler("cron/review-responses", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    // Find all active clients with the reputation service
    const activeServices = await prisma.clientService.findMany({
      where: {
        serviceId: "reputation",
        status: "active",
      },
      include: {
        client: { select: { businessName: true, vertical: true } },
      },
      take: 100,
    });

    if (activeServices.length === 0) {
      return NextResponse.json({
        success: true,
        clientsProcessed: 0,
        responsesGenerated: 0,
        message: "No clients with active reputation service",
      });
    }

    // Batch 1: Fetch all existing review responses for all active reputation clients in one query
    const allClientIds = activeServices.map((s) => s.clientId);
    const [allExistingResponses, allAccounts] = await Promise.all([
      prisma.reviewResponse.findMany({
        where: { clientId: { in: allClientIds } },
        select: { clientId: true, reviewerName: true, platform: true, reviewText: true },
        take: 10000,
      }),
      // Batch 2: Pre-fetch all accounts for these clients (for notifications later)
      prisma.account.findMany({
        where: { client: { id: { in: allClientIds } } },
        select: { id: true, client: { select: { id: true } } },
        take: 500,
      }),
    ]);

    // Group existing responses by clientId
    const responsesByClient = new Map<string, typeof allExistingResponses>();
    for (const r of allExistingResponses) {
      const existing = responsesByClient.get(r.clientId);
      if (existing) {
        existing.push(r);
      } else {
        responsesByClient.set(r.clientId, [r]);
      }
    }

    // Map clientId -> accountId for notifications
    const accountByClientId = new Map<string, string>();
    for (const acc of allAccounts) {
      if (acc.client) {
        accountByClientId.set(acc.client.id, acc.id);
      }
    }

    let generated = 0;
    const errors: string[] = [];
    // Collect all new review responses and notifications for batching
    const newReviewResponses: Array<{
      clientId: string;
      platform: string;
      reviewerName: string;
      rating: number;
      reviewText: string;
      responseText: string;
      status: string;
    }> = [];

    for (const service of activeServices) {
      try {
        let config: { googlePlaceId?: string; yelpBusinessId?: string } = {};
        if (service.config) {
          try {
            config = JSON.parse(service.config) as {
              googlePlaceId?: string;
              yelpBusinessId?: string;
            };
          } catch {
            // use defaults
          }
        }

        // Fetch current reviews — only for configured platforms.
        // Skip platforms without a configured ID instead of falling back to mock data,
        // which would cause phantom review responses in production.
        const fetchResults = await Promise.allSettled([
          config.googlePlaceId
            ? checkGoogleReviews(config.googlePlaceId)
            : Promise.resolve([]),
          config.yelpBusinessId
            ? checkYelpReviews(config.yelpBusinessId)
            : Promise.resolve([]),
        ]);

        const googleReviews = fetchResults[0].status === "fulfilled" ? fetchResults[0].value : [];
        const yelpReviews = fetchResults[1].status === "fulfilled" ? fetchResults[1].value : [];

        if (fetchResults[0].status === "rejected") {
          errors.push(`Google fetch failed for client ${service.clientId}: ${fetchResults[0].reason instanceof Error ? fetchResults[0].reason.message : "Unknown error"}`);
        }
        if (fetchResults[1].status === "rejected") {
          errors.push(`Yelp fetch failed for client ${service.clientId}: ${fetchResults[1].reason instanceof Error ? fetchResults[1].reason.message : "Unknown error"}`);
        }

        const allReviews = [...googleReviews, ...yelpReviews];

        // Use the pre-fetched responses instead of querying per client
        const existingResponses = responsesByClient.get(service.clientId) || [];

        // Build a set of dedup keys for existing responses using a stable hash
        const existingKeys = new Set(
          existingResponses.map(
            (r) => reviewDedupKey(r.platform, r.reviewerName, r.reviewText || "")
          )
        );

        // Generate responses for new reviews
        let clientGenerated = 0;
        for (const review of allReviews) {
          const key = reviewDedupKey(review.platform, review.author, review.text);
          if (existingKeys.has(key)) continue;

          // Add the key to the set immediately so we don't generate duplicate
          // responses for the same review within this cron run
          existingKeys.add(key);

          const responseText = await generateReviewResponse({
            rating: review.rating,
            reviewerName: review.author,
            reviewText: review.text,
            businessName: service.client.businessName,
            vertical: service.client.vertical || undefined,
            clientId: service.clientId,
          });

          newReviewResponses.push({
            clientId: service.clientId,
            platform: review.platform,
            reviewerName: review.author,
            rating: review.rating,
            reviewText: review.text,
            responseText,
            status: "draft",
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          clientGenerated++;
          generated++;
        }

        // Notification batching is handled below after all clients are processed
      } catch (err) {
        errors.push(
          `Failed for client ${service.clientId}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Batch 3: Create all review responses and notifications in a single transaction
    if (newReviewResponses.length > 0) {
      // Group generated counts by clientId for notifications
      const generatedByClient = new Map<string, number>();
      for (const r of newReviewResponses) {
        generatedByClient.set(r.clientId, (generatedByClient.get(r.clientId) || 0) + 1);
      }

      const notificationData: Array<{
        accountId: string;
        type: string;
        title: string;
        message: string;
        actionUrl: string;
      }> = [];
      for (const [clientId, count] of generatedByClient) {
        const accountId = accountByClientId.get(clientId);
        if (accountId) {
          notificationData.push({
            accountId,
            type: "review",
            title: "New review responses ready",
            message: `${count} new AI-generated review responses are waiting for your approval.`,
            actionUrl: "/dashboard/services/reviews",
          });
        }
      }

      await prisma.$transaction([
        prisma.reviewResponse.createMany({ data: newReviewResponses }),
        ...(notificationData.length > 0
          ? [prisma.notification.createMany({ data: notificationData })]
          : []),
      ]);
    }

    return NextResponse.json({
      success: true,
      clientsProcessed: activeServices.length,
      responsesGenerated: generated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    logger.errorWithCause("[cron/review-responses] Fatal error", err);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
});
