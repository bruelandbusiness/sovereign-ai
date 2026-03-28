import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractTextContent, handleAnthropicError, sanitizeForPrompt } from "@/lib/ai-utils";
import { z } from "zod";
import { rateLimitByIP } from "@/lib/rate-limit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 email generations per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "email-generate", 20);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const client = session.account.client;

  const emailGenerateSchema = z.object({
    campaignType: z.string().max(100).optional(),
    topic: z.string().max(500).optional(),
  });

  let body: { campaignType?: string; topic?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = emailGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const campaignType = parsed.data.campaignType || "broadcast";
  const topic = parsed.data.topic || "Monthly Newsletter";
  const vertical = client.vertical || "home service";
  const businessName = client.businessName;
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

  const safeBusiness = sanitizeForPrompt(businessName, 200);
  const safeVertical = sanitizeForPrompt(vertical, 100);
  const safeTopic = sanitizeForPrompt(topic, 200);
  const safeCampaignType = sanitizeForPrompt(campaignType, 50);
  const safeLocation = sanitizeForPrompt(location, 200);

  try {
    const response = await guardedAnthropicCall({
      clientId: client.id,
      action: "email.generate",
      description: `Generate ${safeCampaignType} email about ${safeTopic}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: `You are an email marketing expert. Write compelling email copy for a ${safeVertical} business called ${safeBusiness}.`,
        messages: [
          {
            role: "user",
            content: `Write a ${safeCampaignType} email about "${safeTopic}" for ${safeBusiness}, a ${safeVertical} business in ${safeLocation}.

Return ONLY a JSON object with two fields:
- "subject": a compelling email subject line
- "body": the full email body as HTML (use <h2>, <p>, <ul>, <li> tags for structure)

The email should be professional, engaging, and include a call-to-action. Do not include any text outside the JSON object.`,
          },
        ],
      },
    });

    const rawText = extractTextContent(response, "{}");

    // Parse the JSON response from Claude
    let subject: string;
    let emailBody: string;

    try {
      const parsed = JSON.parse(rawText);
      subject = parsed.subject;
      emailBody = parsed.body;
    } catch {
      // Fallback: if Claude didn't return valid JSON, use the raw text
      subject = `${topic} - ${businessName}`;
      emailBody = rawText;
    }

    return NextResponse.json({ subject, body: emailBody });
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: `Email generation blocked: ${error.reason}` },
        { status: 429 }
      );
    }
    logger.errorWithCause("Email generation failed:", error);
    const aiError = handleAnthropicError(error);
    return NextResponse.json(
      { error: aiError.message, retryable: aiError.retryable },
      { status: aiError.status }
    );
  }
}
