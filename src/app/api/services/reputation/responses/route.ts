import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { generateReviewResponse } from "@/lib/ai-review-response";
import { z } from "zod";
import { validateBody } from "@/lib/validate";

// GET: List all review responses for the client
export async function GET(request: Request) {
  try {
    const { clientId } = await requireClient();

    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // "draft", "approved", "published", "rejected"

    const where: Record<string, unknown> = { clientId };
    if (status) {
      where.status = status;
    }

    const responses = await prisma.reviewResponse.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ responses });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reputation/responses] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch review responses" },
      { status: 500 }
    );
  }
}

// POST: Generate a new AI review response and save as draft
const generateSchema = z.object({
  platform: z.string().min(1).max(50),
  reviewerName: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().min(1).max(10000),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, generateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;

    // Get client details for context
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
      clientId,
    });

    // Save as draft
    const reviewResponse = await prisma.reviewResponse.create({
      data: {
        clientId,
        platform: body.platform,
        reviewerName: body.reviewerName,
        rating: body.rating,
        reviewText: body.reviewText,
        responseText,
        status: "draft",
      },
    });

    // Log activity
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "review_response",
        title: `AI response drafted for ${body.platform} review`,
        description: `Generated response for ${body.reviewerName}'s ${body.rating}-star review on ${body.platform}.`,
      },
    });

    return NextResponse.json({ reviewResponse });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[reputation/responses] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to generate review response" },
      { status: 500 }
    );
  }
}
