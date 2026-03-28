import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { scoreLead, getLeadStage } from "@/lib/lead-scoring";
import { rateLimitByIP } from "@/lib/rate-limit";
import { sanitizeForPrompt, handleAnthropicError, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST — AI Photo Estimate Analysis
//
// Accepts multipart form data with:
//   - image: File (the photo to analyze)
//   - clientId: string
//   - vertical: string (hvac | plumbing | roofing | electrical)
//   - customerName: string (optional)
//   - customerEmail: string (optional)
//   - customerPhone: string (optional)
//
// Returns the AI analysis with estimate range.
// ---------------------------------------------------------------------------


// CORS helpers for embed widget (mirrors chatbot/chat pattern)

function getAllowedOrigins(clientWebsite: string | null): string[] {
  const origins: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  origins.push(appUrl);

  if (clientWebsite) {
    try {
      const url = clientWebsite.startsWith("http")
        ? clientWebsite
        : `https://${clientWebsite}`;
      const parsed = new URL(url);
      origins.push(parsed.origin);
      if (parsed.hostname.startsWith("www.")) {
        origins.push(`${parsed.protocol}//${parsed.hostname.slice(4)}`);
      } else {
        origins.push(`${parsed.protocol}//www.${parsed.hostname}`);
      }
    } catch {
      // Ignore malformed URL
    }
  }

  return origins;
}

function buildEstimateCorsHeaders(
  requestOrigin: string | null,
  allowedOrigins: string[]
): Record<string, string> {
  const origin =
    requestOrigin && allowedOrigins.some((o) => o === requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Pre-client-lookup fallback CORS (for preflight and early validation errors)
function fallbackCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return buildEstimateCorsHeaders(requestOrigin, [appUrl, requestOrigin || ""]);
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: fallbackCorsHeaders(origin) });
}

interface ParsedAnalysis {
  category: string;
  description: string;
  estimateLow: number;
  estimateHigh: number;
  confidence: "high" | "medium" | "low";
  fullAnalysis: string;
}

function parseAIResponse(text: string): ParsedAnalysis {
  // Try to parse structured JSON from the response
  try {
    // Look for JSON block in the response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || "general_repair",
        description: parsed.description || text,
        estimateLow: Math.round((parsed.estimate_low || 0) * 100), // convert dollars to cents
        estimateHigh: Math.round((parsed.estimate_high || 0) * 100),
        confidence: parsed.confidence || "medium",
        fullAnalysis: text,
      };
    }
  } catch {
    // Fall back to regex parsing
  }

  // Fallback: extract dollar amounts from the text
  const priceMatches = text.match(/\$[\d,]+/g);
  let estimateLow = 0;
  let estimateHigh = 0;

  if (priceMatches && priceMatches.length >= 2) {
    const amounts = priceMatches.map((p) =>
      parseInt(p.replace(/[$,]/g, ""), 10)
    );
    amounts.sort((a, b) => a - b);
    estimateLow = amounts[0] * 100;
    estimateHigh = amounts[amounts.length - 1] * 100;
  } else if (priceMatches && priceMatches.length === 1) {
    const amount = parseInt(priceMatches[0].replace(/[$,]/g, ""), 10);
    estimateLow = Math.round(amount * 0.8) * 100;
    estimateHigh = Math.round(amount * 1.2) * 100;
  }

  return {
    category: "general_repair",
    description: text.slice(0, 200),
    estimateLow,
    estimateHigh,
    confidence: "medium",
    fullAnalysis: text,
  };
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "estimate-analyze", 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: fallbackCorsHeaders(requestOrigin) }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image") as File | null;

    // Validate and sanitize string fields from formData with Zod
    const estimateFieldsSchema = z.object({
      clientId: z.string().min(1).max(100),
      vertical: z.string().min(1).max(100),
      customerName: z.string().max(200).optional(),
      customerEmail: z.string().email().max(320).optional(),
      customerPhone: z.string().max(30).optional(),
    });

    const fieldsResult = estimateFieldsSchema.safeParse({
      clientId: formData.get("clientId") || undefined,
      vertical: formData.get("vertical") || undefined,
      customerName: formData.get("customerName") || undefined,
      customerEmail: formData.get("customerEmail") || undefined,
      customerPhone: formData.get("customerPhone") || undefined,
    });

    if (!fieldsResult.success || !image) {
      return NextResponse.json(
        {
          error: "image, clientId, and vertical are required",
          details: fieldsResult.success ? undefined : fieldsResult.error.flatten().fieldErrors,
        },
        { status: 400, headers: fallbackCorsHeaders(requestOrigin) }
      );
    }

    const { clientId, vertical, customerName, customerEmail, customerPhone } = fieldsResult.data;

    // Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image file size must be under 5MB" },
        { status: 400, headers: fallbackCorsHeaders(requestOrigin) }
      );
    }

    // Validate MIME type by checking actual file content (magic bytes)
    const headerBytes = new Uint8Array(await image.slice(0, 12).arrayBuffer());
    function detectMimeFromBytes(bytes: Uint8Array): string | null {
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg";
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "image/png";
      // GIF: 47 49 46 38
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
      // WEBP: 52 49 46 46 ... 57 45 42 50
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
      return null;
    }
    const detectedMime = detectMimeFromBytes(headerBytes);
    if (!detectedMime) {
      return NextResponse.json(
        { error: "Invalid image file. Supported formats: JPEG, PNG, GIF, WebP" },
        { status: 400, headers: fallbackCorsHeaders(requestOrigin) }
      );
    }

    // Validate the client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, vertical: true, accountId: true, website: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404, headers: fallbackCorsHeaders(requestOrigin) }
      );
    }

    // Build CORS headers restricted to the client's registered domain
    const estimateAllowedOrigins = getAllowedOrigins(client.website);
    const corsHeaders = buildEstimateCorsHeaders(requestOrigin, estimateAllowedOrigins);

    // Convert image to base64 for storage and Claude Vision
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    // Use the server-side detected MIME type (from magic bytes) instead of trusting the header
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validMediaTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ] as const;
    type MediaType = (typeof validMediaTypes)[number];
    const mediaType: MediaType = detectedMime as MediaType;

    const imageDataUrl = `data:${mediaType};base64,${imageBase64}`;

    // Build the system prompt
    const safeVertical = sanitizeForPrompt(vertical, 100);
    const systemPrompt = `You are an expert home services estimator specializing in the ${safeVertical} industry. Analyze this photo of a home repair issue.

Your task:
1. Identify what the issue/damage is
2. Categorize it (e.g., "ac_repair", "water_heater_replacement", "roof_leak", "electrical_panel", "pipe_burst", etc.)
3. Describe what you see in plain language a homeowner would understand
4. Provide a realistic price estimate range for the repair in the US market

IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
{
  "category": "issue_category_snake_case",
  "description": "A clear 2-3 sentence description of the issue visible in the photo and what repair work would be needed.",
  "estimate_low": 150,
  "estimate_high": 450,
  "confidence": "medium"
}

For the estimate, use realistic US market prices. The confidence should be:
- "high" if the issue is clearly visible and well-defined
- "medium" if you can identify the issue but some details are unclear
- "low" if the photo is ambiguous or the issue could vary significantly

Do NOT include any text before or after the JSON object.`;

    // Call Claude Vision API with governance budget check
    let response;
    try {
      response = await guardedAnthropicCall({
        clientId,
        action: "estimate.analyze",
        description: `AI photo estimate analysis for ${safeVertical}`,
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: imageBase64,
                  },
                },
                {
                  type: "text",
                  text: `This is a ${safeVertical} issue. Please analyze this photo and provide your estimate.`,
                },
              ],
            },
          ],
        },
      });
    } catch (err) {
      if (err instanceof GovernanceBlockedError) {
        return NextResponse.json(
          { error: `Estimate analysis blocked: ${err.reason}` },
          { status: 429, headers: corsHeaders }
        );
      }
      throw err;
    }

    const rawAnalysis = extractTextContent(
      response,
      '{"category":"unknown","description":"Unable to analyze the image.","estimate_low":0,"estimate_high":0,"confidence":"low"}'
    );

    const analysis = parseAIResponse(rawAnalysis);

    // Wrap all DB writes in a transaction so estimate, lead, activity, and
    // notification are created atomically (prevents orphaned estimates on
    // partial failure or duplicate leads on retry).
    const { estimateId, leadId: resultLeadId } = await prisma.$transaction(async (tx) => {
      // Create the PhotoEstimate record
      const estimate = await tx.photoEstimate.create({
        data: {
          clientId,
          customerName: (customerName || "Unknown") as string,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          imageUrl: imageDataUrl,
          vertical,
          issueCategory: analysis.category,
          issueDescription: analysis.description,
          estimateLow: analysis.estimateLow,
          estimateHigh: analysis.estimateHigh,
          confidence: (analysis.confidence === "high" ? 0.9 : analysis.confidence === "medium" ? 0.7 : 0.4) as number,
          status: "analyzed",
        },
      });

      // Create a Lead record if we have customer contact info
      let txLeadId: string | null = null;
      if (customerName && (customerEmail || customerPhone)) {
        const lead = await tx.lead.create({
          data: {
            clientId,
            name: customerName,
            email: customerEmail || null,
            phone: customerPhone || null,
            source: "website",
            status: "new",
            notes: `AI Photo Estimate: ${analysis.description}. Estimate: $${(analysis.estimateLow / 100).toFixed(0)} - $${(analysis.estimateHigh / 100).toFixed(0)}`,
            value: analysis.estimateHigh,
          },
        });

        txLeadId = lead.id;

        // Score the lead
        const score = scoreLead({
          email: customerEmail || null,
          phone: customerPhone || null,
          source: "website",
          status: "new",
          createdAt: lead.createdAt,
        });
        const stage = getLeadStage(score);

        await tx.lead.update({
          where: { id: lead.id },
          data: { score, stage },
        });

        // Update the estimate with the lead reference
        await tx.photoEstimate.update({
          where: { id: estimate.id },
          data: { leadId: txLeadId },
        });

        // Create activity event
        await tx.activityEvent.create({
          data: {
            clientId,
            type: "lead_captured",
            title: "Photo Estimate Lead Captured",
            description: `New lead from AI Photo Estimate: ${customerName} - ${analysis.category} (${analysis.confidence} confidence)`,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            accountId: client.accountId,
            type: "lead",
            title: "New Photo Estimate Request",
            message: `${customerName} submitted a photo for a ${vertical} estimate. AI analysis: ${analysis.description.slice(0, 100)}`,
            actionUrl: "/dashboard/leads",
          },
        });
      }

      return { estimateId: estimate.id, leadId: txLeadId };
    });

    const leadId = resultLeadId;

    return NextResponse.json(
      {
        id: estimateId,
        issueCategory: analysis.category,
        issueDescription: analysis.description,
        estimateLow: analysis.estimateLow,
        estimateHigh: analysis.estimateHigh,
        confidence: analysis.confidence,
        aiAnalysis: analysis.fullAnalysis,
        leadId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    logger.errorWithCause("[estimate/analyze] Error:", error);
    const aiError = handleAnthropicError(error);
    return NextResponse.json(
      { error: aiError.message, retryable: aiError.retryable },
      { status: aiError.status, headers: fallbackCorsHeaders(requestOrigin) }
    );
  }
}
