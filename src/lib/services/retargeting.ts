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

export interface AudienceSegment {
  name: string;
  description: string;
  criteria: string;
  estimatedSize: string;
  recommendedPlatform: string;
  priority: "high" | "medium" | "low";
}

export interface RetargetingAudienceResult {
  segments: AudienceSegment[];
  strategy: string;
}

export interface RetargetingAdCopyResult {
  headline: string;
  description: string;
  callToAction: string;
  emotionalHook: string;
  campaignId: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the retargeting service for a client.
 * Sets up pixel configuration and creates a default audience segment.
 */
export async function provisionRetargeting(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const defaultConfig = {
    pixelEnabled: true,
    pixelUrl: `${appUrl}/api/services/retargeting/pixel?clientId=${clientId}`,
    trackingEndpoint: `${appUrl}/api/services/retargeting/track`,
    defaultAudiences: [
      {
        name: "All Website Visitors",
        criteria: { daysActive: 30 },
      },
      {
        name: "High-Intent Visitors",
        criteria: { minVisits: 3, daysActive: 14 },
      },
    ],
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "retargeting" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(defaultConfig) },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "ad_optimized",
      title: "Retargeting pixel activated",
      description: `Retargeting pixel is ready for ${client.businessName}. Install the pixel script on your website to start tracking visitors and building audiences.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateRetargetingAudience — AI-powered audience segmentation
// ---------------------------------------------------------------------------

/**
 * Analyze visitor and lead data to suggest audience segments for retargeting.
 *
 * Uses lead sources, statuses, engagement patterns, and booking data to
 * create targeted audience segments optimized for different retargeting goals.
 *
 * @param clientId - The client to analyze
 */
export async function generateRetargetingAudience(
  clientId: string
): Promise<RetargetingAudienceResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Gather data for audience analysis
  const [leads, bookings, adCampaigns] = await Promise.all([
    prisma.lead.findMany({
      where: { clientId },
      select: { source: true, status: true, stage: true, value: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { clientId },
      select: { status: true, serviceType: true, createdAt: true },
    }),
    prisma.adCampaign.findMany({
      where: { clientId },
      select: { platform: true, conversions: true, clicks: true, impressions: true },
    }),
  ]);

  const leadsBySource: Record<string, number> = {};
  const leadsByStatus: Record<string, number> = {};
  for (const lead of leads) {
    leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
  }

  const serviceTypes = [...new Set(bookings.map((b) => b.serviceType).filter(Boolean))];

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are a retargeting and audience segmentation expert for local ${safeVertical} businesses. You create precise audience segments that maximize retargeting ROI by matching the right message to the right audience at the right time.`;

  const userPrompt = `Create retargeting audience segments for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Available data:
- Total leads: ${leads.length}
- Lead sources: ${JSON.stringify(leadsBySource)}
- Lead statuses: ${JSON.stringify(leadsByStatus)}
- Total bookings: ${bookings.length}
- Service types offered: ${serviceTypes.join(", ") || "General " + safeVertical}
- Ad campaigns running: ${adCampaigns.length}

Create 4-6 retargeting audience segments. For each segment, suggest:
- Who they are and why they're valuable
- What criteria to use (recency, behavior, engagement level)
- Which platform is best for reaching them
- Priority level

Return a JSON object with:
- "strategy": 2-3 sentence overview of the retargeting strategy
- "segments": Array of objects with:
  - "name": segment name
  - "description": who these people are (1-2 sentences)
  - "criteria": targeting criteria description
  - "estimatedSize": relative size estimate ("small", "medium", "large")
  - "recommendedPlatform": "google" | "facebook" | "instagram"
  - "priority": "high" | "medium" | "low"`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "retargeting.audience",
      description: `Generate retargeting audiences for ${safeBusinessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<RetargetingAudienceResult>>(response, {});

    const result: RetargetingAudienceResult = {
      strategy: parsed.strategy || `Retarget ${leads.length} leads and website visitors across multiple platforms to maximize conversions for ${safeBusinessName}.`,
      segments: Array.isArray(parsed.segments) ? parsed.segments : generateFallbackSegments(safeVertical),
    };

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "ad_optimized",
        title: "Retargeting audiences generated",
        description: `${result.segments.length} audience segments created for retargeting campaigns. ${result.segments.filter((s) => s.priority === "high").length} high-priority segments identified.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[retargeting] Audience generation failed:", error);

    return {
      strategy: `Focus retargeting efforts on high-intent website visitors and unconverted leads for ${safeBusinessName}.`,
      segments: generateFallbackSegments(safeVertical),
    };
  }
}

// ---------------------------------------------------------------------------
// generateRetargetingAdCopy — audience-specific retargeting ads
// ---------------------------------------------------------------------------

/**
 * Generate retargeting ad copy tailored to a specific audience segment
 * and platform.
 *
 * Creates an AdCampaign record in "draft" status.
 *
 * @param clientId - The client to generate for
 * @param audience - Description of the target audience segment
 * @param platform - "google" | "facebook" | "instagram"
 */
export async function generateRetargetingAdCopy(
  clientId: string,
  audience: string,
  platform: string
): Promise<RetargetingAdCopyResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeAudience = sanitizeForPrompt(audience, 300);
  const safePlatform = sanitizeForPrompt(platform.toLowerCase(), 50);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are a retargeting ad specialist for local ${safeVertical} businesses. You write ads that re-engage people who already showed interest but didn't convert. Your ads feel personal and relevant, not generic or pushy.`;

  const userPrompt = `Write a retargeting ad for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Target audience: ${safeAudience}
Platform: ${safePlatform}

Retargeting best practices:
- Acknowledge they've visited/interacted before (subtly)
- Address the likely reason they didn't convert (price concern, timing, research phase)
- Create urgency or offer an incentive to come back
- Use social proof (reviews, customer count, years in business)
- Keep it concise — they already know who you are

Return a JSON object with:
- "headline": attention-grabbing headline (max 40 chars)
- "description": compelling ad description (max 125 chars)
- "callToAction": CTA text
- "emotionalHook": the psychological angle used (e.g., "FOMO", "social proof", "limited offer")`;

  let headline: string;
  let description: string;
  let callToAction: string;
  let emotionalHook: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "retargeting.adcopy",
      description: `Generate retargeting ad for ${safeAudience} on ${safePlatform}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<RetargetingAdCopyResult>>(response, {});

    headline = parsed.headline || `Still Looking? ${client.businessName} Can Help`;
    description = parsed.description || `Get a free estimate from ${client.businessName}. Trusted ${client.vertical || "home service"} pros${location ? ` in ${location}` : ""}.`;
    callToAction = parsed.callToAction || "Get Free Quote";
    emotionalHook = parsed.emotionalHook || "urgency";
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[retargeting] Ad copy generation failed:", error);
    headline = `Still Looking? ${client.businessName} Can Help`;
    description = `Get a free estimate from ${client.businessName}. Trusted ${client.vertical || "home service"} pros${location ? ` in ${location}` : ""}.`;
    callToAction = "Get Free Quote";
    emotionalHook = "urgency";
  }

  // Create an AdCampaign record for the retargeting ad
  const campaign = await prisma.adCampaign.create({
    data: {
      clientId,
      platform: platform.toLowerCase(),
      name: `Retargeting — ${audience.slice(0, 50)} (${platform})`,
      status: "draft",
      budget: 0,
      targeting: JSON.stringify({
        type: "retargeting",
        audience,
        platform,
      }),
      adCopy: JSON.stringify({ headline, description, callToAction, emotionalHook }),
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "ad_optimized",
      title: `Retargeting ad created for ${platform}`,
      description: `Retargeting ad copy generated for "${audience}" audience on ${platform}. Hook: ${emotionalHook}.`,
    },
  });

  return {
    headline,
    description,
    callToAction,
    emotionalHook,
    campaignId: campaign.id,
  };
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackSegments(vertical: string): AudienceSegment[] {
  return [
    {
      name: "Website Visitors (No Conversion)",
      description: "People who visited your website in the last 30 days but didn't fill out a form or call.",
      criteria: "Visited site in last 30 days, no form submission or phone call tracked",
      estimatedSize: "large",
      recommendedPlatform: "facebook",
      priority: "high",
    },
    {
      name: "Quote Requesters (No Booking)",
      description: "Leads who requested a quote or estimate but haven't booked a service yet.",
      criteria: "Lead status: new or qualified, no booking created",
      estimatedSize: "medium",
      recommendedPlatform: "google",
      priority: "high",
    },
    {
      name: "Past Customers (Re-engagement)",
      description: `Customers who used your ${vertical} services more than 6 months ago and may need repeat service.`,
      criteria: "Last booking > 6 months ago, lead status: won",
      estimatedSize: "medium",
      recommendedPlatform: "facebook",
      priority: "medium",
    },
    {
      name: "High-Intent Visitors",
      description: "People who visited pricing, services, or contact pages multiple times.",
      criteria: "3+ visits to high-intent pages in last 14 days",
      estimatedSize: "small",
      recommendedPlatform: "google",
      priority: "high",
    },
  ];
}
