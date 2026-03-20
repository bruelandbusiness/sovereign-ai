import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";
import { z } from "zod";
import { validateBody } from "@/lib/validate";
import { sanitizeForPrompt, extractTextContent, handleAnthropicError } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

export const maxDuration = 60;

// GET: List all AEO strategies for the client
export async function GET(request: Request) {
  try {
    const { clientId } = await requireClient();

    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = { clientId };
    if (status) {
      where.status = status;
    }

    const strategies = await prisma.aEOStrategy.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { priority: "asc" },
        { createdAt: "desc" },
      ],
      take: 50,
    });

    return NextResponse.json({ strategies });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[aeo/strategies] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch AEO strategies" },
      { status: 500 }
    );
  }
}

// POST: Generate new strategies using Claude AI
const generateSchema = z.object({
  action: z.literal("generate"),
});

export async function POST(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, generateSchema);
    if (!validation.success) {
      return validation.response;
    }

    // Get client details
    const client = await prisma.client.findUniqueOrThrow({
      where: { id: clientId },
    });

    // Get existing queries and content for context
    const [existingQueries, existingContent, existingStrategies] =
      await Promise.all([
        prisma.aEOQuery.findMany({
          where: { clientId },
          take: 20,
        }),
        prisma.aEOContent.findMany({
          where: { clientId },
          select: { type: true, targetQuery: true, status: true },
        }),
        prisma.aEOStrategy.findMany({
          where: { clientId, status: { not: "completed" } },
          select: { title: true },
        }),
      ]);

    const citedCount = existingQueries.filter((q) => q.isCited).length;
    const uncitedQueries = existingQueries
      .filter((q) => !q.isCited)
      .map((q) => q.query);

    const strategies = await generateAEOStrategies({
      clientId,
      businessName: client.businessName,
      vertical: client.vertical || "home services",
      city: client.city || undefined,
      state: client.state || undefined,
      trackedQueries: existingQueries.length,
      citedCount,
      uncitedQueries: uncitedQueries.slice(0, 10),
      existingContentTypes: existingContent.map((c) => c.type),
      existingStrategyTitles: existingStrategies.map((s) => s.title),
    });

    // Save strategies to database
    const created = await prisma.$transaction(
      strategies.map((s) =>
        prisma.aEOStrategy.create({
          data: {
            clientId,
            title: s.title,
            description: s.description,
            priority: s.priority,
            status: "pending",
            impact: s.impact,
            contentType: s.contentType,
          },
        })
      )
    );

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: `${created.length} new AEO strategies generated`,
        description: `AI analyzed your AEO profile and recommended ${created.length} actions to improve citation visibility.`,
      },
    });

    return NextResponse.json({ strategies: created });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: `AEO strategy generation blocked: ${err.reason}` },
        { status: 429 }
      );
    }
    console.error("[aeo/strategies] POST failed:", err);
    const aiError = handleAnthropicError(err);
    return NextResponse.json(
      { error: aiError.message, retryable: aiError.retryable },
      { status: aiError.status }
    );
  }
}

// PUT: Update strategy status
const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "in_progress", "completed"]),
});

export async function PUT(request: Request) {
  try {
    const { clientId } = await requireClient();

    const validation = await validateBody(request, updateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { id, status } = validation.data;

    const existing = await prisma.aEOStrategy.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.aEOStrategy.update({
      where: { id },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    return NextResponse.json({ strategy: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[aeo/strategies] PUT failed:", err);
    return NextResponse.json(
      { error: "Failed to update AEO strategy" },
      { status: 500 }
    );
  }
}

// ── AI Strategy Generation ──────────────────────────────────

interface StrategyInput {
  clientId: string;
  businessName: string;
  vertical: string;
  city?: string;
  state?: string;
  trackedQueries: number;
  citedCount: number;
  uncitedQueries: string[];
  existingContentTypes: string[];
  existingStrategyTitles: string[];
}

interface GeneratedStrategy {
  title: string;
  description: string;
  priority: string;
  impact: string;
  contentType: string;
}

async function generateAEOStrategies(
  input: StrategyInput
): Promise<GeneratedStrategy[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback strategies when no API key
    return getTemplateStrategies(input);
  }

  const safeBusinessName = sanitizeForPrompt(input.businessName, 200);
  const safeVertical = sanitizeForPrompt(input.vertical, 100);
  const safeCity = input.city ? sanitizeForPrompt(input.city, 100) : "";
  const safeState = input.state ? sanitizeForPrompt(input.state, 50) : "";
  const safeUncitedQueries = input.uncitedQueries.map((q) => sanitizeForPrompt(q, 200)).join(", ");
  const safeContentTypes = input.existingContentTypes.map((t) => sanitizeForPrompt(t, 50)).join(", ");
  const safeStrategyTitles = input.existingStrategyTitles.map((t) => sanitizeForPrompt(t, 100)).join(", ");

  const message = await guardedAnthropicCall({
    clientId: input.clientId,
    action: "aeo.generate_strategies",
    description: `Generate AEO strategies for ${input.businessName}`,
    params: {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are an Answer Engine Optimization (AEO) strategist. Analyze this business profile and generate 3-5 actionable strategies to improve their visibility in AI-generated answers (ChatGPT, Perplexity, Google AI Overviews).

Business: ${safeBusinessName}
Industry: ${safeVertical}
${safeCity ? `Location: ${safeCity}, ${safeState}` : ""}
Tracked queries: ${input.trackedQueries}
Currently cited in: ${input.citedCount} queries
Uncited queries: ${safeUncitedQueries || "none tracked yet"}
Existing content types: ${safeContentTypes || "none"}
Existing strategies (skip these): ${safeStrategyTitles || "none"}

For each strategy, return a JSON array with objects containing:
- title: short actionable title (max 60 chars)
- description: 2-3 sentence explanation of the strategy
- priority: "high", "medium", or "low"
- impact: brief impact statement (e.g., "High — targets 5 uncited queries")
- contentType: one of "faq", "blog", "schema_markup", "gbp_post", "citation"

Return ONLY the JSON array, no other text.`,
        },
      ],
    },
  });

  const text = extractTextContent(message, "[]");

  try {
    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as GeneratedStrategy[];
      return parsed.slice(0, 5).map((s) => ({
        title: String(s.title || "").slice(0, 60),
        description: String(s.description || ""),
        priority: ["high", "medium", "low"].includes(s.priority)
          ? s.priority
          : "medium",
        impact: String(s.impact || ""),
        contentType: [
          "faq",
          "blog",
          "schema_markup",
          "gbp_post",
          "citation",
        ].includes(s.contentType)
          ? s.contentType
          : "blog",
      }));
    }
  } catch {
    console.error("[aeo/strategies] Failed to parse AI response");
  }

  return getTemplateStrategies(input);
}

function getTemplateStrategies(input: StrategyInput): GeneratedStrategy[] {
  const strategies: GeneratedStrategy[] = [];

  if (!input.existingContentTypes.includes("faq_schema")) {
    strategies.push({
      title: `Create FAQ page for common ${input.vertical} questions`,
      description: `Build a comprehensive FAQ page answering the top questions homeowners ask about ${input.vertical} services in ${input.city || "your area"}. Structure it with FAQPage schema markup so AI models can easily parse and cite your answers.`,
      priority: "high",
      impact: `High — FAQ pages are the #1 content type cited by AI assistants`,
      contentType: "faq",
    });
  }

  if (!input.existingContentTypes.includes("local_business_schema")) {
    strategies.push({
      title: "Add LocalBusiness structured data to your website",
      description:
        "Implement Schema.org LocalBusiness markup with complete business details including services, hours, and service area. This helps AI models identify and cite your business for local queries.",
      priority: "high",
      impact: "High — essential for local AI search visibility",
      contentType: "schema_markup",
    });
  }

  if (input.uncitedQueries.length > 0) {
    strategies.push({
      title: `Create targeted content for uncited queries`,
      description: `Write detailed, factual content addressing: "${input.uncitedQueries.slice(0, 3).join('", "')}". Use clear, concise language that AI models prefer to cite.`,
      priority: "high",
      impact: `High — directly targets ${input.uncitedQueries.length} uncited queries`,
      contentType: "blog",
    });
  }

  strategies.push({
    title: "Optimize Google Business Profile for AI visibility",
    description: `Ensure your GBP listing has complete details, high-quality photos, and regular posts. AI models cross-reference GBP data when generating answers about local ${input.vertical} businesses.`,
    priority: "medium",
    impact: "Medium — improves local citation likelihood across all platforms",
    contentType: "gbp_post",
  });

  strategies.push({
    title: "Build citation presence on authority sites",
    description:
      "Get listed on industry-specific directories, Yelp, BBB, and niche review sites. AI models trust businesses that appear across multiple authoritative sources.",
    priority: "medium",
    impact: "Medium — strengthens overall citation authority",
    contentType: "citation",
  });

  return strategies.slice(0, 5);
}
