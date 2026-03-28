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

export interface InsightItem {
  category: string; // "leads" | "revenue" | "conversion" | "engagement" | "efficiency"
  title: string;
  finding: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
  estimatedImpact: string;
}

export interface InsightsReportResult {
  summary: string;
  insights: InsightItem[];
  kpis: {
    totalLeads: number;
    totalRevenue: number; // cents
    conversionRate: number; // percentage
    avgLeadValue: number; // cents
    activeChannels: string[];
  };
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the analytics dashboard service for a client.
 * Sets up dashboard config and creates an initial snapshot activity.
 */
export async function provisionAnalytics(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const defaultConfig = {
    dashboardEnabled: true,
    roiTrackingEnabled: true,
    weeklyReportEnabled: true,
    channels: [
      "leads",
      "ads",
      "seo",
      "social",
      "email",
      "calls",
      "bookings",
      "reviews",
      "content",
    ],
  };

  // Update the ClientService record with analytics config
  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "analytics" } },
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
      type: "seo_update",
      title: "Analytics dashboard activated",
      description: `Real-time analytics dashboard is now live for ${client.businessName}. Track leads, revenue, ROI, and all marketing channels in one place.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateInsightsReport — AI-powered analytics insights
// ---------------------------------------------------------------------------

/**
 * Analyze a client's leads, revenue, conversions, and marketing data
 * then generate AI-powered insights with actionable recommendations.
 *
 * Queries actual data from the database (leads, revenue events, bookings,
 * ad campaigns, reviews) and feeds it to Claude for analysis.
 *
 * @param clientId - The client to generate insights for
 */
export async function generateInsightsReport(
  clientId: string
): Promise<InsightsReportResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Gather data from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [leads, revenueEvents, bookings, adCampaigns, reviewResponses, emailCampaigns] =
    await Promise.all([
      prisma.lead.findMany({
        where: { clientId, createdAt: { gte: thirtyDaysAgo } },
        select: { source: true, status: true, score: true, value: true, createdAt: true },
      }),
      prisma.revenueEvent.findMany({
        where: { clientId, createdAt: { gte: thirtyDaysAgo } },
        select: { channel: true, amount: true, eventType: true, createdAt: true },
      }),
      prisma.booking.findMany({
        where: { clientId, createdAt: { gte: thirtyDaysAgo } },
        select: { status: true, serviceType: true, createdAt: true },
      }),
      prisma.adCampaign.findMany({
        where: { clientId },
        select: { platform: true, status: true, budget: true, spent: true, impressions: true, clicks: true, conversions: true, costPerLead: true },
      }),
      prisma.reviewResponse.findMany({
        where: { clientId, createdAt: { gte: thirtyDaysAgo } },
        select: { platform: true, rating: true, createdAt: true },
      }),
      prisma.emailCampaign.findMany({
        where: { clientId },
        select: { type: true, status: true, recipients: true, opens: true, clicks: true },
      }),
    ]);

  // Calculate KPIs
  const totalLeads = leads.length;
  const totalRevenue = revenueEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
  const avgLeadValue =
    wonLeads > 0
      ? Math.round(
          leads
            .filter((l) => l.status === "won")
            .reduce((sum, l) => sum + (l.value || 0), 0) / wonLeads
        )
      : 0;

  const activeChannels = [
    ...new Set([
      ...leads.map((l) => l.source),
      ...revenueEvents.map((e) => e.channel).filter(Boolean),
    ]),
  ] as string[];

  // Build a data summary for Claude
  const leadsBySource: Record<string, number> = {};
  for (const lead of leads) {
    leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
  }

  const leadsByStatus: Record<string, number> = {};
  for (const lead of leads) {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
  }

  const bookingsByStatus: Record<string, number> = {};
  for (const booking of bookings) {
    bookingsByStatus[booking.status] = (bookingsByStatus[booking.status] || 0) + 1;
  }

  const avgReviewRating =
    reviewResponses.length > 0
      ? (reviewResponses.reduce((sum, r) => sum + r.rating, 0) / reviewResponses.length).toFixed(1)
      : "N/A";

  const emailOpenRate =
    emailCampaigns.reduce((sum, c) => sum + c.recipients, 0) > 0
      ? Math.round(
          (emailCampaigns.reduce((sum, c) => sum + c.opens, 0) /
            emailCampaigns.reduce((sum, c) => sum + c.recipients, 0)) *
            100
        )
      : 0;

  const dataSummary = `
BUSINESS: ${client.businessName} (${client.vertical || "home service"})
PERIOD: Last 30 days
LOCATION: ${client.city || "N/A"}, ${client.state || "N/A"}

LEADS:
- Total new leads: ${totalLeads}
- By source: ${JSON.stringify(leadsBySource)}
- By status: ${JSON.stringify(leadsByStatus)}
- Conversion rate: ${conversionRate}%
- Average lead value: $${(avgLeadValue / 100).toFixed(2)}

REVENUE:
- Total revenue: $${(totalRevenue / 100).toFixed(2)}
- Revenue events: ${revenueEvents.length}

BOOKINGS:
- Total bookings: ${bookings.length}
- By status: ${JSON.stringify(bookingsByStatus)}

AD CAMPAIGNS:
- Active campaigns: ${adCampaigns.filter((c) => c.status === "active").length}
- Total ad spend: $${(adCampaigns.reduce((sum, c) => sum + c.spent, 0) / 100).toFixed(2)}
- Total impressions: ${adCampaigns.reduce((sum, c) => sum + c.impressions, 0)}
- Total clicks: ${adCampaigns.reduce((sum, c) => sum + c.clicks, 0)}
- Total conversions: ${adCampaigns.reduce((sum, c) => sum + c.conversions, 0)}

REVIEWS:
- Reviews received: ${reviewResponses.length}
- Average rating: ${avgReviewRating}

EMAIL:
- Open rate: ${emailOpenRate}%
- Total campaigns: ${emailCampaigns.length}
`.trim();

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);

  const systemPrompt = `You are a data-driven marketing analyst for local ${safeVertical} businesses. You analyze marketing performance data and provide actionable insights that directly impact revenue growth. Be specific, data-driven, and practical.`;

  const userPrompt = `Analyze the following marketing performance data for ${safeBusinessName} and generate insights with actionable recommendations.

${dataSummary}

Generate 4-6 insights covering these categories where data is available:
- leads: Lead generation performance and quality
- revenue: Revenue trends and opportunities
- conversion: Conversion funnel analysis
- engagement: Customer engagement metrics (reviews, email, social)
- efficiency: Marketing spend efficiency and ROI

For each insight:
- Reference specific numbers from the data
- Explain what the data means for the business
- Provide a concrete, actionable recommendation
- Estimate the potential impact

Return a JSON object with:
- "summary": A 2-3 sentence executive summary of the overall marketing performance
- "insights": Array of objects with "category", "title", "finding", "recommendation", "priority" ("high"/"medium"/"low"), "estimatedImpact"`;

  let summary: string;
  let insights: InsightItem[];

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "analytics.insights",
      description: `Generate insights report for ${safeBusinessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      summary?: string;
      insights?: InsightItem[];
    }>(response, {});

    summary =
      parsed.summary ||
      `${safeBusinessName} generated ${totalLeads} leads and $${(totalRevenue / 100).toFixed(2)} in revenue over the past 30 days with a ${conversionRate}% conversion rate.`;

    insights = Array.isArray(parsed.insights) ? parsed.insights : [];
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[analytics] Insights generation failed:", error);

    summary = `${safeBusinessName} generated ${totalLeads} leads and $${(totalRevenue / 100).toFixed(2)} in revenue over the past 30 days with a ${conversionRate}% conversion rate.`;
    insights = generateFallbackInsights(totalLeads, totalRevenue, conversionRate, avgLeadValue);
  }

  if (insights.length === 0) {
    insights = generateFallbackInsights(totalLeads, totalRevenue, conversionRate, avgLeadValue);
  }

  const result: InsightsReportResult = {
    summary,
    insights,
    kpis: {
      totalLeads,
      totalRevenue,
      conversionRate,
      avgLeadValue,
      activeChannels,
    },
    generatedAt: new Date().toISOString(),
  };

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "AI insights report generated",
      description: `Analytics report with ${insights.length} actionable insights generated for ${client.businessName}. ${insights.filter((i) => i.priority === "high").length} high-priority recommendations identified.`,
    },
  });

  return result;
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackInsights(
  totalLeads: number,
  totalRevenue: number,
  conversionRate: number,
  avgLeadValue: number
): InsightItem[] {
  const insights: InsightItem[] = [];

  if (totalLeads === 0) {
    insights.push({
      category: "leads",
      title: "No leads captured in 30 days",
      finding: "No new leads were captured in the past 30 days. This needs immediate attention.",
      recommendation: "Enable multiple lead capture channels (chatbot, forms, phone tracking) and ensure your website has clear calls-to-action.",
      priority: "high",
      estimatedImpact: "Critical — without leads, the pipeline will dry up.",
    });
  } else {
    insights.push({
      category: "leads",
      title: `${totalLeads} leads generated this month`,
      finding: `Your business captured ${totalLeads} leads in the past 30 days. Diversifying lead sources can increase this number.`,
      recommendation: "Review which channels are generating the most leads and allocate more budget to top performers.",
      priority: "medium",
      estimatedImpact: "10-25% increase in lead volume by optimizing channel mix.",
    });
  }

  if (conversionRate < 20) {
    insights.push({
      category: "conversion",
      title: "Conversion rate below industry average",
      finding: `Your ${conversionRate}% conversion rate is below the typical 20-30% range for home service businesses.`,
      recommendation: "Implement faster lead follow-up (within 5 minutes), improve your estimate process, and add automated nurture sequences.",
      priority: "high",
      estimatedImpact: "Each 5% improvement in conversion rate directly increases revenue without additional ad spend.",
    });
  }

  insights.push({
    category: "revenue",
    title: `$${(totalRevenue / 100).toFixed(0)} in tracked revenue`,
    finding: `Total tracked revenue for the past 30 days is $${(totalRevenue / 100).toFixed(2)} with an average deal value of $${(avgLeadValue / 100).toFixed(2)}.`,
    recommendation: "Focus on upselling maintenance plans and recurring service agreements to increase customer lifetime value.",
    priority: "medium",
    estimatedImpact: "15-30% increase in revenue per customer through recurring services.",
  });

  return insights;
}
