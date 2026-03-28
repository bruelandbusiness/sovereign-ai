import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeForPrompt, handleAnthropicError, extractTextContent } from "@/lib/ai-utils";
import { screenContent, sanitizeContent } from "@/lib/content-safety";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const generateSchema = z.object({
  topic: z.string().max(500).optional(),
  platform: z.string().max(50).optional(),
  tone: z.string().max(50).optional(),
  includeHashtags: z.boolean().optional(),
});

export const maxDuration = 60;

// POST: Generate social media content using Claude
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;

  if (!body.topic) {
    return NextResponse.json(
      { error: "topic is required" },
      { status: 400 }
    );
  }

  const platform = body.platform ?? "facebook";
  const tone = body.tone ?? "professional and friendly";
  const includeHashtags = body.includeHashtags ?? true;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  const locationContext = [client?.city, client?.state]
    .filter(Boolean)
    .join(", ");

  const platformInstructions: Record<string, string> = {
    facebook:
      "Write 1-3 paragraphs suitable for Facebook. Include a clear call-to-action. Can be conversational and engaging.",
    instagram:
      "Write a captivating Instagram caption. Use emojis strategically. Keep it scannable with line breaks. End with 10-15 relevant hashtags on a new line.",
    twitter:
      "Write a concise tweet under 280 characters. Make every word count. Be punchy and direct.",
    linkedin:
      "Write a professional LinkedIn post (1-3 paragraphs). Focus on expertise, value, and industry insights. Use a business-appropriate tone.",
    google_business:
      "Write a short Google Business Profile post (150-300 characters). Focus on local relevance, mention the business name, and include a call-to-action.",
  };

  const hashtagInstruction = includeHashtags
    ? "Include 3-5 relevant hashtags at the end of the post (except for Google Business posts)."
    : "Do NOT include any hashtags.";

  const safeBizName = sanitizeForPrompt(client?.businessName ?? "Local Business", 200);
  const safeVertical = sanitizeForPrompt(client?.vertical ?? "home services", 100);
  const safeTopic = sanitizeForPrompt(body.topic, 500);
  const safeTone = sanitizeForPrompt(tone, 100);
  const safeLocation = sanitizeForPrompt(locationContext, 200);

  const prompt = `You are an expert social media content creator for local businesses. Generate a ${platform} post for the following business:

Business: ${safeBizName}
Industry: ${safeVertical}
${safeLocation ? `Location: ${safeLocation}` : ""}
Topic: ${safeTopic}
Tone: ${safeTone}

${platformInstructions[platform] ?? platformInstructions.facebook}

${hashtagInstruction}

Additional guidelines:
- Make the content authentic and engaging
- Include a local angle when possible
- Focus on value for the reader
- Avoid sounding overly promotional or salesy

Return ONLY the post content, no explanations or alternatives.`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "social.generate",
      description: `Generate ${platform} post about "${body.topic}"`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      },
    });

    const rawContent = extractTextContent(response, "");

    // Screen AI output for safety
    const safetyResult = screenContent(rawContent);
    if (!safetyResult.safe) {
      logger.warn(
        `[social/generate] Content failed safety screening`,
        { reasons: safetyResult.reasons }
      );
      return NextResponse.json(
        {
          error: "Generated content did not pass safety review",
          reasons: safetyResult.reasons,
        },
        { status: 422 }
      );
    }

    const generatedContent = sanitizeContent(rawContent).trim();

    return NextResponse.json({
      content: generatedContent,
      platform,
      topic: body.topic,
      tone,
      characterCount: generatedContent.length,
    });
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: `Social content generation blocked: ${error.reason}` },
        { status: 429 }
      );
    }
    logger.errorWithCause("Social content generation failed:", error);
    const aiError = handleAnthropicError(error);
    return NextResponse.json(
      { error: aiError.message, retryable: aiError.retryable },
      { status: aiError.status }
    );
  }
}
