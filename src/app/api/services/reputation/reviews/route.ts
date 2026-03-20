import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import {
  checkGoogleReviews,
  checkYelpReviews,
  generateReviewResponse,
} from "@/lib/integrations/reputation";
import type { Review } from "@/lib/integrations/reputation";
import { z } from "zod";
import { validateBody } from "@/lib/validate";
import { dispatchWebhook } from "@/lib/webhooks";

// GET: Fetch all reviews across platforms for the client
export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Get reputation config for this client
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
    // failing doesn't prevent showing data from the other.
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

    const allReviews: Review[] = [...googleReviews, ...yelpReviews].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      reviews: allReviews,
      totalCount: allReviews.length,
      platforms: {
        google: googleReviews.length,
        yelp: yelpReviews.length,
      },
      ...(platformErrors.length > 0 && {
        warnings: [`Failed to fetch reviews from: ${platformErrors.join(", ")}. Results may be incomplete.`],
      }),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reputation/reviews] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: Generate and post AI response to a review
const responseSchema = z.object({
  reviewId: z.string().min(1).max(200),
  reviewText: z.string().min(1).max(10000),
  reviewAuthor: z.string().min(1).max(200),
  reviewRating: z.number().int().min(1).max(5),
  platform: z.enum(["google", "yelp"]),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, responseSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;

    // Get client's business name
    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
    });

    const review: Review = {
      id: body.reviewId,
      platform: body.platform,
      author: body.reviewAuthor,
      rating: body.reviewRating,
      text: body.reviewText,
      date: new Date().toISOString(),
    };

    // Check for duplicate: avoid generating a response for the same review twice
    const existingResponse = await prisma.reviewResponse.findFirst({
      where: {
        clientId,
        platform: body.platform,
        reviewerName: body.reviewAuthor,
        reviewText: body.reviewText,
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        {
          error: "A response for this review already exists",
          existingResponseId: existingResponse.id,
          status: existingResponse.status,
        },
        { status: 409 }
      );
    }

    // Generate AI response
    const responseText = await generateReviewResponse(
      review,
      client.businessName,
      clientId
    );

    // Save as draft — AI responses must be reviewed by a human before publishing.
    // The client can approve/edit/publish via the PATCH /reputation/responses/[id] endpoint.
    const reviewResponse = await prisma.reviewResponse.create({
      data: {
        clientId,
        platform: body.platform,
        reviewerName: body.reviewAuthor,
        rating: body.reviewRating,
        reviewText: body.reviewText,
        responseText,
        status: "draft",
      },
    });

    // Log the response activity
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "review_response",
        title: `AI response drafted for ${body.platform} review`,
        description: `Generated draft response to ${body.reviewAuthor}'s ${body.reviewRating}-star review on ${body.platform}. Awaiting approval.`,
      },
    });

    // Dispatch webhook for review received (non-blocking) — note: response is draft, not published
    dispatchWebhook(clientId, "review.received", {
      reviewId: body.reviewId,
      platform: body.platform,
      author: body.reviewAuthor,
      rating: body.reviewRating,
      text: body.reviewText,
      responseId: reviewResponse.id,
      responseStatus: "draft",
    }).catch((err) => console.error("[reviews] Webhook dispatch failed:", err instanceof Error ? err.message : err));

    return NextResponse.json({
      reviewId: body.reviewId,
      responseId: reviewResponse.id,
      responseText,
      status: "draft",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reputation/reviews] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to generate review response" },
      { status: 500 }
    );
  }
}
