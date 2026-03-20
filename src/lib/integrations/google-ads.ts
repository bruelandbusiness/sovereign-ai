// Google Ads API integration wrapper
// Uses GOOGLE_ADS_API_KEY, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_DEVELOPER_TOKEN
// Falls back to mock data when env vars are not set

import { logger } from "@/lib/logger";
import {
  fetchWithRetry,
  IntegrationError,
  sanitizeNumericId,
  sanitizeForLogging,
} from "@/lib/integrations/integration-utils";

// ─── Types ───────────────────────────────────────────────────

export interface GoogleAdsCampaignInput {
  name: string;
  budget: number; // daily budget in cents
  targeting: {
    location?: string;
    keywords?: string[];
    demographics?: { ageRange?: string; gender?: string };
  };
  adCopy: {
    headline: string;
    description: string;
    callToAction: string;
  };
  startDate?: string;
  endDate?: string;
}

export interface GoogleAdsCampaignResult {
  externalId: string;
  name: string;
  status: string;
  budget: number;
  isMock: boolean;
}

export interface GoogleAdsCampaignMetrics {
  externalId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number; // in cents
  costPerClick: number; // in cents
  costPerConversion: number; // in cents
  clickThroughRate: number;
  conversionRate: number;
  isMock: boolean;
}

export interface GoogleAdsKeywordPerformance {
  keyword: string;
  impressions: number;
  clicks: number;
  conversions: number;
  costPerClick: number;
  qualityScore: number;
  position: number;
  isMock: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────

const TAG = "google-ads";

export function isConfigured(): boolean {
  return !!(
    process.env.GOOGLE_ADS_API_KEY &&
    process.env.GOOGLE_ADS_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  );
}

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GOOGLE_ADS_API_KEY}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    "login-customer-id": process.env.GOOGLE_ADS_CUSTOMER_ID || "",
  };
}

const BASE_URL = "https://googleads.googleapis.com/v16";

const RETRY_OPTS = { integration: TAG };

// ─── Functions ───────────────────────────────────────────────

export async function createCampaign(
  input: GoogleAdsCampaignInput
): Promise<GoogleAdsCampaignResult> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock campaign data`);
    return {
      externalId: `mock-google-${Date.now()}`,
      name: input.name,
      status: "active",
      budget: input.budget,
      isMock: true,
    };
  }

  const customerId = sanitizeNumericId(
    process.env.GOOGLE_ADS_CUSTOMER_ID || "",
    "GOOGLE_ADS_CUSTOMER_ID"
  );

  const response = await fetchWithRetry(
    `${BASE_URL}/customers/${customerId}/campaigns:mutate`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: input.name,
              advertisingChannelType: "SEARCH",
              status: "ENABLED",
              campaignBudget: input.budget,
              startDate: input.startDate,
              endDate: input.endDate,
            },
          },
        ],
      }),
    },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as {
    results: Array<{ resourceName: string }>;
  };
  const resourceName = data.results?.[0]?.resourceName ?? "";
  const externalId = resourceName.split("/").pop() ?? "";

  if (!externalId) {
    throw new IntegrationError(
      `[${TAG}] Campaign created but no resource name returned`,
      "unknown",
      undefined,
      TAG,
    );
  }

  logger.info(`[${TAG}] Campaign created`, { externalId, name: input.name });

  return {
    externalId,
    name: input.name,
    status: "active",
    budget: input.budget,
    isMock: false,
  };
}

async function pauseCampaign(
  externalId: string
): Promise<{ success: boolean; isMock: boolean }> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock pause result`);
    return { success: true, isMock: true };
  }

  const customerId = sanitizeNumericId(
    process.env.GOOGLE_ADS_CUSTOMER_ID || "",
    "GOOGLE_ADS_CUSTOMER_ID"
  );
  const safeId = sanitizeNumericId(externalId, "campaignId");

  await fetchWithRetry(
    `${BASE_URL}/customers/${customerId}/campaigns:mutate`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        operations: [
          {
            update: {
              resourceName: `customers/${customerId}/campaigns/${safeId}`,
              status: "PAUSED",
            },
            updateMask: "status",
          },
        ],
      }),
    },
    undefined,
    RETRY_OPTS,
  );

  logger.info(`[${TAG}] Campaign paused`, { externalId: safeId });
  return { success: true, isMock: false };
}

export async function getCampaignMetrics(
  externalId: string
): Promise<GoogleAdsCampaignMetrics> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock metrics`);
    const impressions = 1200 + Math.floor(Math.random() * 3000);
    const clicks = Math.floor(impressions * (0.03 + Math.random() * 0.05));
    const conversions = Math.floor(clicks * (0.08 + Math.random() * 0.12));
    const spent = clicks * (150 + Math.floor(Math.random() * 200));
    return {
      externalId,
      impressions,
      clicks,
      conversions,
      spent,
      costPerClick: clicks > 0 ? Math.round(spent / clicks) : 0,
      costPerConversion:
        conversions > 0 ? Math.round(spent / conversions) : 0,
      clickThroughRate:
        impressions > 0
          ? Math.round((clicks / impressions) * 10000) / 100
          : 0,
      conversionRate:
        clicks > 0
          ? Math.round((conversions / clicks) * 10000) / 100
          : 0,
      isMock: true,
    };
  }

  const customerId = sanitizeNumericId(
    process.env.GOOGLE_ADS_CUSTOMER_ID || "",
    "GOOGLE_ADS_CUSTOMER_ID"
  );
  // Sanitise the campaign ID to prevent GAQL injection
  const safeId = sanitizeNumericId(externalId, "campaignId");

  const query = `
    SELECT
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros,
      metrics.average_cpc,
      metrics.ctr,
      metrics.conversions_from_interactions_rate
    FROM campaign
    WHERE campaign.id = ${safeId}
    AND segments.date DURING LAST_30_DAYS
  `;

  const response = await fetchWithRetry(
    `${BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as Array<{
    results: Array<{
      metrics: {
        impressions: string;
        clicks: string;
        conversions: number;
        costMicros: string;
        averageCpc: number;
        ctr: number;
        conversionsFromInteractionsRate: number;
      };
    }>;
  }>;

  const metrics = data[0]?.results[0]?.metrics;
  if (!metrics) {
    return {
      externalId,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spent: 0,
      costPerClick: 0,
      costPerConversion: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      isMock: false,
    };
  }

  const impressions = parseInt(metrics.impressions, 10) || 0;
  const clicks = parseInt(metrics.clicks, 10) || 0;
  const conversions = Math.round(metrics.conversions || 0);
  const spent = Math.round(parseInt(metrics.costMicros, 10) / 10000); // micros to cents

  return {
    externalId,
    impressions,
    clicks,
    conversions,
    spent,
    costPerClick: clicks > 0 ? Math.round(spent / clicks) : 0,
    costPerConversion: conversions > 0 ? Math.round(spent / conversions) : 0,
    clickThroughRate: Math.round((metrics.ctr || 0) * 10000) / 100,
    conversionRate:
      Math.round((metrics.conversionsFromInteractionsRate || 0) * 10000) / 100,
    isMock: false,
  };
}

async function getKeywordPerformance(
  campaignExternalId: string
): Promise<GoogleAdsKeywordPerformance[]> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock keyword data`);
    const mockKeywords = [
      "plumber near me",
      "emergency plumbing",
      "water heater repair",
      "drain cleaning",
      "leak detection",
    ];
    return mockKeywords.map((keyword) => {
      const impressions = 200 + Math.floor(Math.random() * 800);
      const clicks = Math.floor(impressions * (0.03 + Math.random() * 0.07));
      const conversions = Math.floor(clicks * (0.05 + Math.random() * 0.15));
      return {
        keyword,
        impressions,
        clicks,
        conversions,
        costPerClick: 150 + Math.floor(Math.random() * 300),
        qualityScore: 5 + Math.floor(Math.random() * 5),
        position: 1 + Math.floor(Math.random() * 5),
        isMock: true,
      };
    });
  }

  const customerId = sanitizeNumericId(
    process.env.GOOGLE_ADS_CUSTOMER_ID || "",
    "GOOGLE_ADS_CUSTOMER_ID"
  );
  // Sanitise campaign ID to prevent GAQL injection
  const safeId = sanitizeNumericId(campaignExternalId, "campaignId");

  const query = `
    SELECT
      ad_group_criterion.keyword.text,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.average_cpc,
      ad_group_criterion.quality_info.quality_score,
      metrics.average_page_views
    FROM keyword_view
    WHERE campaign.id = ${safeId}
    AND segments.date DURING LAST_30_DAYS
  `;

  const response = await fetchWithRetry(
    `${BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as Array<{
    results: Array<{
      adGroupCriterion: {
        keyword: { text: string };
        qualityInfo: { qualityScore: number };
      };
      metrics: {
        impressions: string;
        clicks: string;
        conversions: number;
        averageCpc: number;
        averagePageViews: number;
      };
    }>;
  }>;

  return (data[0]?.results ?? []).map((r) => {
    const impressions = parseInt(r.metrics.impressions, 10) || 0;
    const clicks = parseInt(r.metrics.clicks, 10) || 0;
    const conversions = Math.round(r.metrics.conversions || 0);
    return {
      keyword: r.adGroupCriterion.keyword.text,
      impressions,
      clicks,
      conversions,
      costPerClick: Math.round((r.metrics.averageCpc || 0) / 10000), // micros to cents
      qualityScore: r.adGroupCriterion.qualityInfo.qualityScore || 0,
      position: Math.round(r.metrics.averagePageViews || 0),
      isMock: false,
    };
  });
}
