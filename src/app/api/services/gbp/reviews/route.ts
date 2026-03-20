import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { getGBPReviews, respondToReview } from "@/lib/integrations/gbp";
import { generateReviewResponse } from "@/lib/ai-review-response";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

// GET: Fetch GBP reviews
export async function GET() {
  try {
    await requireClient();

    const reviews = await getGBPReviews();

    return NextResponse.json({ reviews });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[gbp/reviews] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch GBP reviews" },
      { status: 500 }
    );
  }
}

// POST: Generate AI response and optionally post to GBP
const respondSchema = z.object({
  reviewId: z.string().min(1),
  reviewerName: z.string().min(1),
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(1),
  publish: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, respondSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;

    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
    });

    // Generate AI response
    const responseText = await generateReviewResponse({
      rating: body.rating,
      reviewerName: body.reviewerName,
      reviewText: body.reviewText,
      businessName: client.businessName,
      vertical: client.vertical || undefined,
    });

    // Optionally publish directly to GBP
    let published = false;
    if (body.publish) {
      const result = await respondToReview(body.reviewId, responseText);
      published = result.success;
    }

    // Save to our database
    await prisma.reviewResponse.create({
      data: {
        clientId,
        platform: "google",
        reviewerName: body.reviewerName,
        rating: body.rating,
        reviewText: body.reviewText,
        responseText,
        status: published ? "published" : "draft",
        publishedAt: published ? new Date() : null,
      },
    });

    return NextResponse.json({
      responseText,
      published,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[gbp/reviews] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    );
  }
}
