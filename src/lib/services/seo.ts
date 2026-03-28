import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractTextContent,
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetaTagsResult {
  titleTag: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  h1Suggestion: string;
}

export interface LocalSeoContentResult {
  pageTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  bodyContent: string; // markdown
  faqItems: Array<{ question: string; answer: string }>;
}

export interface KeywordAnalysisResult {
  primaryKeywords: Array<{
    keyword: string;
    intent: "transactional" | "informational" | "navigational";
    difficulty: "low" | "medium" | "high";
    priority: "high" | "medium" | "low";
  }>;
  longTailKeywords: string[];
  contentIdeas: string[];
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the SEO tracking service for a client.
 * Seeds initial keywords based on their vertical and location.
 */
export async function provisionSeo(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.sEOKeyword.findFirst({
    where: { clientId },
  });

  if (!existing) {
    const vertical = client.vertical ?? "home service";
    const city = client.city ?? "";
    const seedKeywords = [
      `${vertical} near me`,
      `best ${vertical} ${city}`.trim(),
      `${vertical} services ${city}`.trim(),
      `${client.businessName}`,
      `${vertical} reviews ${city}`.trim(),
    ].filter(Boolean);

    await prisma.sEOKeyword.createMany({
      data: seedKeywords.map((keyword) => ({
        clientId,
        keyword,
        trackedAt: new Date(),
      })),
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "SEO tracking activated",
      description: `Keyword tracking has been set up for ${client.businessName}. Initial seed keywords have been added — rankings will be tracked weekly.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateMetaTags — optimized title tags and meta descriptions
// ---------------------------------------------------------------------------

/**
 * Generate SEO-optimized meta tags for a given page.
 *
 * Uses Claude to analyze the page content (or URL context) and produce:
 * - Title tag (50-60 chars, includes primary keyword + location)
 * - Meta description (150-160 chars, compelling with CTA)
 * - Open Graph title and description
 * - Suggested H1 heading
 *
 * @param clientId    - The client who owns the page
 * @param pageUrl     - The URL of the page (for context)
 * @param pageContent - The existing page content or description
 */
export async function generateMetaTags(
  clientId: string,
  pageUrl: string,
  pageContent: string
): Promise<MetaTagsResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safePageUrl = sanitizeForPrompt(pageUrl, 500);
  const safePageContent = sanitizeForPrompt(pageContent, 3000);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are a local SEO expert specializing in ${safeVertical} businesses. You write meta tags that drive clicks from search results while accurately representing page content.`;

  const userPrompt = `Generate SEO-optimized meta tags for this page:

Business: ${safeBusinessName}
Vertical: ${safeVertical}
Location: ${safeLocation || "N/A"}
Page URL: ${safePageUrl}
Page Content/Description: ${safePageContent}

Requirements:
- Title tag: 50-60 characters, include primary keyword and location if space allows, include business name
- Meta description: 150-160 characters, compelling copy that drives clicks, include a CTA
- Open Graph tags: slightly different from meta tags — more engaging/social-friendly
- H1 suggestion: clear, keyword-rich heading for the page

Return a JSON object with:
- "titleTag": the optimized title tag
- "metaDescription": the meta description
- "ogTitle": Open Graph title
- "ogDescription": Open Graph description
- "h1Suggestion": suggested H1 heading`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "seo.metatags",
      description: `Generate meta tags for ${safePageUrl}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<MetaTagsResult>>(response, {});

    const result: MetaTagsResult = {
      titleTag:
        parsed.titleTag ||
        `${safeVertical} Services${safeLocation ? ` in ${safeLocation}` : ""} | ${safeBusinessName}`,
      metaDescription:
        parsed.metaDescription ||
        `Professional ${safeVertical} services from ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}. Call today for a free estimate.`,
      ogTitle:
        parsed.ogTitle ||
        parsed.titleTag ||
        `${safeBusinessName} - Professional ${safeVertical} Services`,
      ogDescription:
        parsed.ogDescription ||
        parsed.metaDescription ||
        `Trusted ${safeVertical} services${safeLocation ? ` in ${safeLocation}` : ""}. Licensed, insured, and committed to quality.`,
      h1Suggestion:
        parsed.h1Suggestion ||
        `Professional ${safeVertical} Services${safeLocation ? ` in ${safeLocation}` : ""}`,
    };

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: "Meta tags generated",
        description: `SEO-optimized meta tags generated for ${pageUrl}.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[seo] Meta tag generation failed:", error);

    // Fallback: generate reasonable defaults without AI
    return {
      titleTag: `${safeVertical} Services${safeLocation ? ` in ${safeLocation}` : ""} | ${safeBusinessName}`,
      metaDescription: `Professional ${safeVertical} services from ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}. Licensed & insured. Call today for a free estimate.`,
      ogTitle: `${safeBusinessName} - Trusted ${safeVertical} Services`,
      ogDescription: `${safeBusinessName} provides professional ${safeVertical} services${safeLocation ? ` in ${safeLocation}` : ""}. Quality work, fair prices, satisfied customers.`,
      h1Suggestion: `Professional ${safeVertical} Services${safeLocation ? ` in ${safeLocation}` : ""}`,
    };
  }
}

// ---------------------------------------------------------------------------
// generateLocalSeoContent — location-specific landing page content
// ---------------------------------------------------------------------------

/**
 * Generate a full location-specific landing page for a service + area
 * combination. These pages target "[service] in [city]" searches.
 *
 * Returns structured content that can be rendered into a landing page
 * template: headline, body content, and FAQ schema items.
 *
 * @param clientId    - The client to generate content for
 * @param serviceArea - The target geographic area (e.g., "North Austin, TX")
 * @param service     - The specific service to feature (e.g., "AC Repair")
 */
export async function generateLocalSeoContent(
  clientId: string,
  serviceArea: string,
  service: string
): Promise<LocalSeoContentResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeServiceArea = sanitizeForPrompt(serviceArea, 200);
  const safeService = sanitizeForPrompt(service, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);

  const systemPrompt = `You are a local SEO content strategist for ${safeVertical} businesses. You create location-specific landing pages that rank for "[service] in [city]" keywords while genuinely helping potential customers.`;

  const userPrompt = `Create a location-specific landing page for:

Business: ${safeBusinessName} (owner: ${safeOwnerName})
Service: ${safeService}
Service Area: ${safeServiceArea}
Industry: ${safeVertical}

Generate the following (return as a JSON object):
- "pageTitle": SEO title tag (60 chars max, format: "${safeService} in ${safeServiceArea} | ${safeBusinessName}")
- "metaDescription": compelling meta description (155 chars max)
- "heroHeadline": main H1 heading that includes the service and location
- "heroSubheadline": supporting text under the headline (1-2 sentences)
- "bodyContent": 400-600 words of unique, location-specific content in markdown. Include:
  * Why ${safeServiceArea} residents choose ${safeBusinessName}
  * Specific challenges/needs in the ${safeServiceArea} area related to ${safeService}
  * What makes ${safeBusinessName}'s ${safeService} service different
  * Clear call-to-action sections
  * Natural keyword usage for "${safeService} ${safeServiceArea}" and variations
- "faqItems": array of 4-5 FAQ objects ({"question": "...", "answer": "..."}) related to ${safeService} in ${safeServiceArea}. These will be used for FAQ schema markup.

Important:
- Content must be unique and specific to this location — no generic filler
- Write for humans first, search engines second
- Include natural local references where possible
- FAQ answers should be concise (2-3 sentences each)`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "seo.localcontent",
      description: `Generate local SEO content: ${safeService} in ${safeServiceArea}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<LocalSeoContentResult>>(
      response,
      {}
    );

    const result: LocalSeoContentResult = {
      pageTitle:
        parsed.pageTitle ||
        `${service} in ${serviceArea} | ${client.businessName}`,
      metaDescription:
        parsed.metaDescription ||
        `Professional ${service} in ${serviceArea} by ${client.businessName}. Licensed, insured, and trusted by your neighbors. Call for a free estimate.`,
      heroHeadline:
        parsed.heroHeadline ||
        `Professional ${service} in ${serviceArea}`,
      heroSubheadline:
        parsed.heroSubheadline ||
        `${client.businessName} delivers reliable ${service} services to homeowners and businesses throughout ${serviceArea}.`,
      bodyContent:
        parsed.bodyContent || extractTextContent(response, ""),
      faqItems: Array.isArray(parsed.faqItems)
        ? parsed.faqItems
        : [
            {
              question: `How much does ${service} cost in ${serviceArea}?`,
              answer: `Pricing varies based on the scope of work. Contact ${client.businessName} for a free, no-obligation estimate tailored to your specific needs.`,
            },
            {
              question: `Is ${client.businessName} licensed and insured?`,
              answer: `Yes, ${client.businessName} is fully licensed and insured to provide ${service} services in ${serviceArea} and surrounding areas.`,
            },
            {
              question: `How quickly can you start ${service} work?`,
              answer: `We typically respond within 24 hours for estimates and can schedule work within the week, depending on availability. Emergency services may also be available.`,
            },
          ],
    };

    // Track as a content job
    await prisma.contentJob.create({
      data: {
        clientId,
        type: "service_page",
        title: result.pageTitle,
        content: result.bodyContent,
        keywords: `${service} ${serviceArea}, ${service} near me, ${serviceArea} ${client.vertical || "home service"}`,
        status: "published",
        publishAt: new Date(),
      },
    });

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: `Local SEO page created: ${service} in ${serviceArea}`,
        description: `Location-specific landing page generated for "${service} in ${serviceArea}" with FAQ schema.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[seo] Local SEO content generation failed:", error);

    return {
      pageTitle: `${service} in ${serviceArea} | ${client.businessName}`,
      metaDescription: `Professional ${service} in ${serviceArea} by ${client.businessName}. Call for a free estimate today.`,
      heroHeadline: `Professional ${service} in ${serviceArea}`,
      heroSubheadline: `Trusted ${service} services for homes and businesses in ${serviceArea}.`,
      bodyContent: "",
      faqItems: [],
    };
  }
}

// ---------------------------------------------------------------------------
// analyzeKeywords — AI-powered keyword research and suggestions
// ---------------------------------------------------------------------------

/**
 * Use Claude to suggest high-value keywords for a client to target
 * based on their vertical, location, and competitive landscape.
 *
 * Returns categorized keywords with intent classification, difficulty
 * estimates, and content ideas for each keyword cluster.
 *
 * @param clientId - The client to analyze for
 * @param vertical - The business vertical (e.g., "HVAC", "plumbing")
 * @param city     - The target city/area
 */
export async function analyzeKeywords(
  clientId: string,
  vertical?: string,
  city?: string
): Promise<KeywordAnalysisResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const effectiveVertical = vertical || client.vertical || "home service";
  const effectiveCity = city || client.city || "";
  const state = client.state || "";

  const safeVertical = sanitizeForPrompt(effectiveVertical, 100);
  const safeCity = sanitizeForPrompt(effectiveCity, 100);
  const safeState = sanitizeForPrompt(state, 50);
  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const location = [safeCity, safeState].filter(Boolean).join(", ");

  const systemPrompt = `You are a local SEO keyword strategist with deep expertise in ${safeVertical} marketing. You understand search intent, local search patterns, and how home service businesses win in organic search.`;

  const userPrompt = `Conduct a keyword analysis for ${safeBusinessName}, a ${safeVertical} business${location ? ` in ${location}` : ""}.

Generate keyword recommendations organized as follows:

1. **Primary Keywords** (10-15): The most valuable keywords to target. For each, provide:
   - The keyword phrase
   - Search intent: "transactional" (ready to buy), "informational" (researching), or "navigational" (looking for a brand)
   - Estimated difficulty: "low" (easy to rank), "medium", or "high" (very competitive)
   - Priority: "high" (target immediately), "medium", or "low" (long-term)

2. **Long-tail Keywords** (15-20): Specific, lower-competition phrases that capture qualified traffic. Focus on:
   - "[service] in [neighborhood]" patterns
   - Question-based queries ("how much does [service] cost in [city]")
   - Comparison queries ("best [service] company [city]")
   - Emergency/urgent intent ("[service] emergency [city]")

3. **Content Ideas** (5-8): Blog post or page ideas that would help rank for these keywords.

Return a JSON object with:
- "primaryKeywords": array of objects with "keyword", "intent", "difficulty", "priority"
- "longTailKeywords": array of keyword strings
- "contentIdeas": array of content topic strings`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "seo.keywords",
      description: `Keyword analysis for ${safeVertical} in ${location || "local area"}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<KeywordAnalysisResult>>(
      response,
      {}
    );

    const result: KeywordAnalysisResult = {
      primaryKeywords: Array.isArray(parsed.primaryKeywords)
        ? parsed.primaryKeywords
        : generateFallbackPrimaryKeywords(effectiveVertical, effectiveCity),
      longTailKeywords: Array.isArray(parsed.longTailKeywords)
        ? parsed.longTailKeywords
        : generateFallbackLongTailKeywords(effectiveVertical, effectiveCity),
      contentIdeas: Array.isArray(parsed.contentIdeas)
        ? parsed.contentIdeas
        : [],
    };

    // Optionally add the primary keywords to tracking
    const keywordsToTrack = result.primaryKeywords
      .filter((kw) => kw.priority === "high")
      .map((kw) => kw.keyword);

    if (keywordsToTrack.length > 0) {
      for (const keyword of keywordsToTrack) {
        try {
          await prisma.sEOKeyword.upsert({
            where: { clientId_keyword: { clientId, keyword } },
            create: {
              clientId,
              keyword,
              trackedAt: new Date(),
            },
            update: {
              trackedAt: new Date(),
            },
          });
        } catch {
          // Ignore individual keyword tracking failures
        }
      }
    }

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: "Keyword analysis completed",
        description: `AI analyzed ${result.primaryKeywords.length} primary keywords and ${result.longTailKeywords.length} long-tail keywords for ${effectiveVertical} in ${location || "your area"}.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[seo] Keyword analysis failed:", error);

    return {
      primaryKeywords: generateFallbackPrimaryKeywords(
        effectiveVertical,
        effectiveCity
      ),
      longTailKeywords: generateFallbackLongTailKeywords(
        effectiveVertical,
        effectiveCity
      ),
      contentIdeas: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackPrimaryKeywords(
  vertical: string,
  city: string
): KeywordAnalysisResult["primaryKeywords"] {
  const keywords = [
    { keyword: `${vertical} near me`, intent: "transactional" as const, difficulty: "high" as const, priority: "high" as const },
    { keyword: `best ${vertical} ${city}`.trim(), intent: "transactional" as const, difficulty: "medium" as const, priority: "high" as const },
    { keyword: `${vertical} services ${city}`.trim(), intent: "transactional" as const, difficulty: "medium" as const, priority: "high" as const },
    { keyword: `${vertical} cost ${city}`.trim(), intent: "informational" as const, difficulty: "low" as const, priority: "medium" as const },
    { keyword: `${vertical} reviews ${city}`.trim(), intent: "navigational" as const, difficulty: "low" as const, priority: "medium" as const },
  ];
  return keywords;
}

function generateFallbackLongTailKeywords(
  vertical: string,
  city: string
): string[] {
  return [
    `how much does ${vertical} cost in ${city}`.trim(),
    `emergency ${vertical} ${city}`.trim(),
    `affordable ${vertical} services ${city}`.trim(),
    `${vertical} company with good reviews ${city}`.trim(),
    `licensed ${vertical} contractor ${city}`.trim(),
  ];
}
