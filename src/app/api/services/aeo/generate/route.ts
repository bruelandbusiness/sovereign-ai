import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { generateAEOContent } from "@/lib/aeo";
import { z } from "zod";
import { validateBody } from "@/lib/validate";
import { handleAnthropicError } from "@/lib/ai-utils";
import { GovernanceBlockedError } from "@/lib/governance/ai-guard";

// POST: AI generates AEO content for a target query
const generateSchema = z.object({
  targetQuery: z.string().min(3),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, generateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { targetQuery } = validation.data;

    // Get client details for context
    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
    });

    // Generate AEO content using AI
    const result = await generateAEOContent(
      {
        name: client.businessName,
        phone: client.phone || undefined,
        website: client.website || undefined,
        city: client.city || undefined,
        state: client.state || undefined,
        vertical: client.vertical || undefined,
      },
      targetQuery,
      clientId
    );

    // Save to database
    const content = await prisma.aEOContent.create({
      data: {
        clientId,
        type: result.type,
        title: result.title,
        content: result.content,
        targetQuery,
        status: "draft",
      },
    });

    // Log activity
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: "AEO content generated",
        description: `Generated ${result.type} content targeting: "${targetQuery}"`,
      },
    });

    return NextResponse.json({ content });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: `AEO content generation blocked: ${err.reason}` },
        { status: 429 }
      );
    }
    console.error("[aeo/generate] POST failed:", err);
    const aiError = handleAnthropicError(err);
    return NextResponse.json(
      { error: aiError.message, retryable: aiError.retryable },
      { status: aiError.status }
    );
  }
}
