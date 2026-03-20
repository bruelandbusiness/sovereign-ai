import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import {
  createCampaign as createGoogleCampaign,
  getCampaignMetrics as getGoogleMetrics,
  isConfigured as isGoogleAdsConfigured,
} from "@/lib/integrations/google-ads";
import {
  createAdSet as createMetaAdSet,
  getAdMetrics as getMetaMetrics,
  isConfigured as isMetaAdsConfigured,
} from "@/lib/integrations/meta-ads";

export const maxDuration = 60;

// GET: List campaigns for client (from DB, enriched with live metrics if API connected)
export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const campaigns = await prisma.adCampaign.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Enrich with live metrics where possible
  // If neither ads platform is configured, all data will be mock
  let hasMockData = !isGoogleAdsConfigured() && !isMetaAdsConfigured();

  const enriched = await Promise.all(
    campaigns.map(async (campaign) => {
      let liveMetrics: {
        impressions?: number;
        clicks?: number;
        conversions?: number;
        spent?: number;
      } | null = null;

      if (campaign.externalId && campaign.status === "active") {
        try {
          if (campaign.platform === "google") {
            const metrics = await getGoogleMetrics(campaign.externalId);
            liveMetrics = {
              impressions: metrics.impressions,
              clicks: metrics.clicks,
              conversions: metrics.conversions,
              spent: metrics.spent,
            };
            if (metrics.isMock) hasMockData = true;
          } else if (campaign.platform === "meta") {
            const metrics = await getMetaMetrics(campaign.externalId);
            liveMetrics = {
              impressions: metrics.impressions,
              clicks: metrics.clicks,
              conversions: metrics.conversions,
              spent: metrics.spent,
            };
            if (metrics.isMock) hasMockData = true;
          }
        } catch (error) {
          console.error(
            `Failed to fetch live metrics for campaign ${campaign.id}:`,
            error
          );
        }
      }

      return {
        id: campaign.id,
        platform: campaign.platform,
        externalId: campaign.externalId,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        spent: liveMetrics?.spent ?? campaign.spent,
        impressions: liveMetrics?.impressions ?? campaign.impressions,
        clicks: liveMetrics?.clicks ?? campaign.clicks,
        conversions: liveMetrics?.conversions ?? campaign.conversions,
        costPerLead: campaign.costPerLead,
        startDate: campaign.startDate?.toISOString() ?? null,
        endDate: campaign.endDate?.toISOString() ?? null,
        targeting: campaign.targeting ? JSON.parse(campaign.targeting) : null,
        adCopy: campaign.adCopy ? JSON.parse(campaign.adCopy) : null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ campaigns: enriched, isMock: hasMockData });
}

// POST: Create new campaign (AI generates ad copy via Claude, stores in DB, pushes to platform if connected)
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let body: {
    platform?: string;
    name?: string;
    budget?: number;
    targeting?: { location?: string; keywords?: string[]; demographics?: { ageRange?: string; gender?: string } };
    adCopy?: { headline?: string; description?: string; callToAction?: string };
    startDate?: string;
    endDate?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.platform || !body.name || !body.budget) {
    return NextResponse.json(
      { error: "platform, name, and budget are required" },
      { status: 400 }
    );
  }

  if (body.platform !== "google" && body.platform !== "meta") {
    return NextResponse.json(
      { error: "platform must be 'google' or 'meta'" },
      { status: 400 }
    );
  }

  if (body.name.length > 200) {
    return NextResponse.json(
      { error: "Campaign name must be 200 characters or less" },
      { status: 400 }
    );
  }

  if (body.targeting?.keywords) {
    if (body.targeting.keywords.length > 20) {
      return NextResponse.json(
        { error: "Keywords array must contain 20 items or fewer" },
        { status: 400 }
      );
    }
    if (body.targeting.keywords.some((kw) => kw.length > 100)) {
      return NextResponse.json(
        { error: "Each keyword must be 100 characters or less" },
        { status: 400 }
      );
    }
  }

  // If no ad copy provided, generate with Claude
  let adCopy = body.adCopy;
  if (!adCopy || !adCopy.headline) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    const locationContext = [client?.city, client?.state]
      .filter(Boolean)
      .join(", ");

    const safeBusinessName = sanitizeForPrompt(client?.businessName ?? "Local Business", 200);
    const safeVertical = sanitizeForPrompt(client?.vertical ?? "home services", 100);
    const safeLocation = sanitizeForPrompt(locationContext || "local area", 200);
    const safeCampaignName = sanitizeForPrompt(body.name, 200);
    const safeKeywords = body.targeting?.keywords
      ? body.targeting.keywords.map((kw) => sanitizeForPrompt(kw, 100)).join(", ")
      : "";

    const prompt = `You are an expert digital advertising copywriter. Generate compelling ad copy for a ${body.platform === "google" ? "Google Search" : "Facebook/Instagram"} ad campaign.

Business: ${safeBusinessName}
Industry: ${safeVertical}
Location: ${safeLocation}
Campaign Name: ${safeCampaignName}
${safeKeywords ? `Target Keywords: ${safeKeywords}` : ""}

Generate ad copy in the following JSON format:
{
  "headline": "A compelling headline (max 30 chars for Google, 40 chars for Meta)",
  "description": "A persuasive description (max 90 chars for Google, 125 chars for Meta)",
  "callToAction": "A clear call-to-action (e.g., 'Get Free Quote', 'Book Now', 'Call Today')"
}

Return ONLY the JSON, no other text.`;

    try {
      const response = await guardedAnthropicCall({
        clientId,
        action: "ads.generate_copy",
        description: `Generate ad copy for campaign "${body.name}"`,
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        },
      });

      const generatedText = extractTextContent(response, "{}");

      adCopy = JSON.parse(generatedText) as {
        headline: string;
        description: string;
        callToAction: string;
      };
    } catch (error) {
      if (error instanceof GovernanceBlockedError) {
        return NextResponse.json(
          { error: `Ad copy generation blocked: ${error.reason}` },
          { status: 429 }
        );
      }
      console.error("AI ad copy generation failed:", error);
      adCopy = {
        headline: body.name,
        description: "Professional service you can trust",
        callToAction: "Learn More",
      };
    }
  }

  // Push to platform if connected
  let externalId: string | null = null;
  try {
    if (body.platform === "google") {
      const result = await createGoogleCampaign({
        name: body.name,
        budget: body.budget,
        targeting: body.targeting ?? {},
        adCopy: {
          headline: adCopy.headline ?? body.name,
          description: adCopy.description ?? "",
          callToAction: adCopy.callToAction ?? "Learn More",
        },
        startDate: body.startDate,
        endDate: body.endDate,
      });
      externalId = result.externalId;
    } else {
      const result = await createMetaAdSet({
        name: body.name,
        campaignName: body.name,
        dailyBudget: body.budget,
        targeting: body.targeting ?? {},
        adCopy: {
          headline: adCopy.headline ?? body.name,
          description: adCopy.description ?? "",
          callToAction: adCopy.callToAction ?? "Learn More",
        },
        startDate: body.startDate,
        endDate: body.endDate,
      });
      externalId = result.externalId;
    }
  } catch (error) {
    console.error("Failed to push campaign to platform:", error);
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      clientId,
      platform: body.platform,
      externalId,
      name: body.name,
      status: externalId ? "active" : "draft",
      budget: body.budget,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      targeting: body.targeting ? JSON.stringify(body.targeting) : null,
      adCopy: JSON.stringify(adCopy),
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "ad_optimized",
      title: `New ${body.platform} ad campaign created`,
      description: `Campaign "${body.name}" has been created with a daily budget of $${(body.budget / 100).toFixed(2)}.`,
    },
  });

  return NextResponse.json(
    {
      id: campaign.id,
      platform: campaign.platform,
      externalId: campaign.externalId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      spent: campaign.spent,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      costPerLead: campaign.costPerLead,
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      targeting: campaign.targeting ? JSON.parse(campaign.targeting) : null,
      adCopy: campaign.adCopy ? JSON.parse(campaign.adCopy) : null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}

// PUT: Update campaign (pause/resume/edit budget)
const updateCampaignSchema = z.object({
  campaignId: z.string().min(1, "campaignId is required"),
  status: z.enum(["active", "paused", "ended"]).optional(),
  budget: z.number().positive().optional(),
});

export async function PUT(request: Request) {
  try {
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

    const parsed = updateCampaignSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const campaign = await prisma.adCampaign.findUnique({
      where: { id: body.campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.clientId !== clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData: { status?: string; budget?: number } = {};

    if (body.status) {
      updateData.status = body.status;
    }

    if (body.budget) {
      updateData.budget = body.budget;
    }

    const updated = await prisma.adCampaign.update({
      where: { id: body.campaignId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      platform: updated.platform,
      externalId: updated.externalId,
      name: updated.name,
      status: updated.status,
      budget: updated.budget,
      spent: updated.spent,
      impressions: updated.impressions,
      clicks: updated.clicks,
      conversions: updated.conversions,
      costPerLead: updated.costPerLead,
      startDate: updated.startDate?.toISOString() ?? null,
      endDate: updated.endDate?.toISOString() ?? null,
      targeting: updated.targeting ? JSON.parse(updated.targeting) : null,
      adCopy: updated.adCopy ? JSON.parse(updated.adCopy) : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Ad campaign update error:", error);
    return NextResponse.json(
      { error: "Failed to update ad campaign" },
      { status: 500 }
    );
  }
}
