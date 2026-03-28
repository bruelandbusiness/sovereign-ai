import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdCopyResult {
  headlines: string[];
  descriptions: string[];
  callToAction: string;
  displayUrl: string;
  campaignId: string;
}

export interface AdStrategyResult {
  totalBudget: number; // cents
  allocation: Array<{
    platform: string;
    budgetPercent: number;
    budgetAmount: number; // cents
    campaignType: string;
    targetAudience: string;
    expectedCPL: string;
    rationale: string;
  }>;
  recommendations: string[];
  expectedOutcome: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the ad management service for a client.
 * Creates a starter draft campaign so the client can see the dashboard immediately.
 */
export async function provisionAds(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.adCampaign.findFirst({
    where: { clientId },
  });

  if (!existing) {
    await prisma.adCampaign.create({
      data: {
        clientId,
        platform: "google",
        name: `${client.businessName} — Search Campaign`,
        status: "draft",
        budget: 2000, // $20/day default
        targeting: JSON.stringify({
          location:
            client.city && client.state
              ? `${client.city}, ${client.state}`
              : undefined,
          keywords: client.vertical
            ? [
                `${client.vertical} near me`,
                `best ${client.vertical}`,
                `${client.vertical} services`,
              ]
            : ["local services near me"],
        }),
        adCopy: JSON.stringify({
          headline: `${client.businessName} — Trusted Pros`,
          description: `Professional ${client.vertical ?? "home service"} in ${client.city ?? "your area"}. Free quotes. Licensed & insured.`,
          callToAction: "Get Free Quote",
        }),
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "ad_optimized",
      title: "Ad management activated",
      description: `A starter Google Ads campaign draft has been created for ${client.businessName}. Review and launch it from your dashboard.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateAdCopy — platform-specific ad copy
// ---------------------------------------------------------------------------

/**
 * Generate optimized ad copy for a specific platform and campaign goal.
 *
 * Supports Google Ads (search, display), Facebook/Instagram ads, and
 * generates multiple headline/description variations for A/B testing.
 *
 * Creates an AdCampaign record in "draft" status.
 *
 * @param clientId     - The client to generate ads for
 * @param platform     - "google" | "facebook" | "instagram"
 * @param campaignGoal - "leads" | "calls" | "traffic" | "awareness" | "bookings"
 */
export async function generateAdCopy(
  clientId: string,
  platform: string,
  campaignGoal: string
): Promise<AdCopyResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safePlatform = sanitizeForPrompt(platform.toLowerCase(), 50);
  const safeGoal = sanitizeForPrompt(campaignGoal.toLowerCase(), 50);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const platformSpecs: Record<string, string> = {
    google: `Google Ads specifications:
- 3 headlines (max 30 characters each) — include primary keyword, location, and USP
- 2 descriptions (max 90 characters each) — include benefits, CTA, and trust signals
- Display URL path suggestions (2 segments, max 15 chars each)
- Focus on high-intent search keywords`,

    facebook: `Facebook Ads specifications:
- 3 headline variations (max 40 characters) — attention-grabbing, benefit-focused
- 2 primary text variations (max 125 characters for feed) — emotional hook + value proposition
- Clear CTA button text suggestion
- Focus on visual storytelling and social proof`,

    instagram: `Instagram Ads specifications:
- 3 headline variations (max 40 characters) — punchy, scroll-stopping
- 2 caption variations (max 125 characters) — conversational, aspirational
- CTA that feels native to the platform
- Focus on visual appeal and lifestyle messaging`,
  };

  const specs = platformSpecs[safePlatform] || platformSpecs["google"];

  const systemPrompt = `You are a performance marketing expert specializing in ${safeVertical} ad campaigns. You write ad copy that drives high-quality leads at the lowest possible cost. Every word matters — be concise, compelling, and conversion-focused.`;

  const userPrompt = `Create ad copy for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Platform: ${safePlatform}
Campaign Goal: ${safeGoal}
Industry: ${safeVertical}

${specs}

Important:
- Include trust signals (licensed, insured, rated, years of experience)
- Create urgency where appropriate (limited time, book today, free estimate)
- Respect character limits strictly
- Write for the campaign goal: ${safeGoal}

Return a JSON object with:
- "headlines": array of 3 headline strings
- "descriptions": array of 2 description strings
- "callToAction": the CTA text
- "displayUrl": suggested display URL path (e.g., "${safeVertical.replace(/\s+/g, "-")}/free-quote")`;

  let headlines: string[];
  let descriptions: string[];
  let callToAction: string;
  let displayUrl: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "ads.copy",
      description: `Generate ${safePlatform} ad copy for ${safeGoal} campaign`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<AdCopyResult>>(response, {});

    headlines = Array.isArray(parsed.headlines)
      ? parsed.headlines
      : generateFallbackHeadlines(client.businessName, client.vertical || "home service", location);
    descriptions = Array.isArray(parsed.descriptions)
      ? parsed.descriptions
      : generateFallbackDescriptions(client.businessName, client.vertical || "home service");
    callToAction = parsed.callToAction || "Get Free Quote";
    displayUrl = parsed.displayUrl || `${(client.vertical || "services").replace(/\s+/g, "-")}/free-quote`;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[ads] Ad copy generation failed:", error);
    headlines = generateFallbackHeadlines(client.businessName, client.vertical || "home service", location);
    descriptions = generateFallbackDescriptions(client.businessName, client.vertical || "home service");
    callToAction = "Get Free Quote";
    displayUrl = `${(client.vertical || "services").replace(/\s+/g, "-")}/free-quote`;
  }

  // Create an AdCampaign record
  const campaign = await prisma.adCampaign.create({
    data: {
      clientId,
      platform: platform.toLowerCase(),
      name: `${client.businessName} — ${formatGoal(campaignGoal)} (${platform})`,
      status: "draft",
      budget: 0,
      targeting: JSON.stringify({
        location: location || undefined,
        goal: campaignGoal,
      }),
      adCopy: JSON.stringify({ headlines, descriptions, callToAction, displayUrl }),
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "ad_optimized",
      title: `${platform} ad copy generated`,
      description: `${headlines.length} headline variations and ${descriptions.length} description variations created for ${campaignGoal} campaign on ${platform}.`,
    },
  });

  return {
    headlines,
    descriptions,
    callToAction,
    displayUrl,
    campaignId: campaign.id,
  };
}

// ---------------------------------------------------------------------------
// generateAdStrategy — AI-powered budget allocation strategy
// ---------------------------------------------------------------------------

/**
 * Generate an AI-powered ad spend allocation strategy across platforms.
 *
 * Analyzes the client's existing campaign performance data and recommends
 * how to allocate budget across Google, Facebook, and Instagram for
 * maximum ROI.
 *
 * @param clientId - The client to generate strategy for
 * @param budget   - Total monthly ad budget in cents
 */
export async function generateAdStrategy(
  clientId: string,
  budget: number
): Promise<AdStrategyResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Gather existing campaign performance data
  const campaigns = await prisma.adCampaign.findMany({
    where: { clientId },
    select: {
      platform: true,
      status: true,
      budget: true,
      spent: true,
      impressions: true,
      clicks: true,
      conversions: true,
      costPerLead: true,
    },
  });

  const leads = await prisma.lead.findMany({
    where: { clientId },
    select: { source: true, status: true, value: true },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const campaignSummary = campaigns.length > 0
    ? campaigns.map((c) =>
        `${c.platform}: spent $${(c.spent / 100).toFixed(2)}, ${c.impressions} impressions, ${c.clicks} clicks, ${c.conversions} conversions, CPL $${(c.costPerLead / 100).toFixed(2)}`
      ).join("\n")
    : "No previous campaign data available.";

  const leadSources: Record<string, number> = {};
  for (const lead of leads) {
    leadSources[lead.source] = (leadSources[lead.source] || 0) + 1;
  }

  const systemPrompt = `You are a paid advertising strategist for local ${safeVertical} businesses. You optimize ad spend to maximize lead quality and minimize cost per acquisition. Base your recommendations on data when available, and industry benchmarks when not.`;

  const userPrompt = `Create an ad spend allocation strategy for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Monthly Ad Budget: $${(budget / 100).toFixed(2)}
Industry: ${safeVertical}

Previous campaign performance:
${campaignSummary}

Lead sources: ${JSON.stringify(leadSources)}

Create an allocation strategy. Return a JSON object with:
- "allocation": Array of platform allocations with:
  - "platform": "google" | "facebook" | "instagram"
  - "budgetPercent": percentage of total budget (all should sum to 100)
  - "budgetAmount": amount in cents
  - "campaignType": type of campaign to run (e.g., "Search - High Intent Keywords", "Lookalike Audience")
  - "targetAudience": who to target
  - "expectedCPL": expected cost per lead range (e.g., "$25-40")
  - "rationale": 1-2 sentence explanation of why this allocation
- "recommendations": Array of 3-5 optimization tips specific to this budget and business
- "expectedOutcome": 1-2 sentence summary of expected results from this strategy`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "ads.strategy",
      description: `Generate ad strategy for $${(budget / 100).toFixed(0)}/mo budget`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<AdStrategyResult>>(response, {});

    const result: AdStrategyResult = {
      totalBudget: budget,
      allocation: Array.isArray(parsed.allocation)
        ? parsed.allocation
        : generateFallbackAllocation(budget),
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [
            "Start with search campaigns targeting high-intent keywords before expanding to social.",
            "Set up conversion tracking before launching any campaigns.",
            "Test 3-5 ad variations per campaign and pause underperformers weekly.",
          ],
      expectedOutcome:
        parsed.expectedOutcome ||
        `With a $${(budget / 100).toFixed(0)}/month budget, expect 15-30 qualified leads per month at $${Math.round(budget / 100 / 20)}-${Math.round(budget / 100 / 15)} cost per lead.`,
    };

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "ad_optimized",
        title: "Ad strategy generated",
        description: `AI-powered ad allocation strategy created for $${(budget / 100).toFixed(0)}/mo budget across ${result.allocation.length} platforms.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[ads] Strategy generation failed:", error);

    return {
      totalBudget: budget,
      allocation: generateFallbackAllocation(budget),
      recommendations: [
        "Start with Google Search campaigns targeting high-intent local keywords.",
        "Allocate 60% to search, 25% to Facebook, and 15% to Instagram retargeting.",
        "Set up conversion tracking before launching any campaigns.",
      ],
      expectedOutcome: `With a $${(budget / 100).toFixed(0)}/month budget, expect 15-30 qualified leads per month.`,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers & Fallbacks
// ---------------------------------------------------------------------------

function formatGoal(goal: string): string {
  const labels: Record<string, string> = {
    leads: "Lead Generation",
    calls: "Call Campaign",
    traffic: "Traffic Campaign",
    awareness: "Brand Awareness",
    bookings: "Booking Campaign",
  };
  return labels[goal.toLowerCase()] || goal;
}

function generateFallbackHeadlines(
  businessName: string,
  vertical: string,
  location: string
): string[] {
  const loc = location ? ` ${location.split(",")[0]}` : "";
  return [
    `${businessName} — Trusted${loc}`,
    `Top ${vertical} Services${loc}`,
    `Free ${vertical} Estimate Today`,
  ];
}

function generateFallbackDescriptions(businessName: string, vertical: string): string[] {
  return [
    `Professional ${vertical} by ${businessName}. Licensed & insured. Call for your free estimate today.`,
    `Trusted by homeowners for quality ${vertical} services. 5-star rated. Book your appointment now.`,
  ];
}

function generateFallbackAllocation(budget: number): AdStrategyResult["allocation"] {
  return [
    {
      platform: "google",
      budgetPercent: 60,
      budgetAmount: Math.round(budget * 0.6),
      campaignType: "Search - High Intent Keywords",
      targetAudience: "Homeowners searching for services in your area",
      expectedCPL: "$25-50",
      rationale: "Google Search captures the highest-intent prospects actively looking for your services.",
    },
    {
      platform: "facebook",
      budgetPercent: 25,
      budgetAmount: Math.round(budget * 0.25),
      campaignType: "Lead Form - Lookalike Audience",
      targetAudience: "Homeowners similar to your existing customers",
      expectedCPL: "$15-35",
      rationale: "Facebook's targeting lets you reach homeowners who match your ideal customer profile.",
    },
    {
      platform: "instagram",
      budgetPercent: 15,
      budgetAmount: Math.round(budget * 0.15),
      campaignType: "Retargeting - Website Visitors",
      targetAudience: "People who visited your website but didn't convert",
      expectedCPL: "$10-25",
      rationale: "Retargeting keeps your business top-of-mind for warm prospects at a low cost per lead.",
    },
  ];
}
