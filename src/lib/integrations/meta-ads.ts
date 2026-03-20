// Meta/Facebook Ads API integration wrapper
// Uses META_ACCESS_TOKEN, META_AD_ACCOUNT_ID env vars
// Falls back to mock data when env vars are not set

import { logger } from "@/lib/logger";
import {
  fetchWithRetry,
  sanitizeForLogging,
  sanitizePathSegment,
} from "@/lib/integrations/integration-utils";

// ─── Types ───────────────────────────────────────────────────

export interface MetaAdSetInput {
  name: string;
  campaignName: string;
  dailyBudget: number; // in cents
  targeting: {
    location?: string;
    ageMin?: number;
    ageMax?: number;
    genders?: number[]; // 1 = male, 2 = female
    interests?: string[];
  };
  adCopy: {
    headline: string;
    description: string;
    callToAction: string;
    imageUrl?: string;
  };
  startDate?: string;
  endDate?: string;
}

export interface MetaAdSetResult {
  externalId: string;
  name: string;
  status: string;
  dailyBudget: number;
  isMock: boolean;
}

export interface MetaAdMetrics {
  externalId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number; // in cents
  costPerClick: number; // in cents
  costPerConversion: number; // in cents
  clickThroughRate: number;
  reach: number;
  frequency: number;
  isMock: boolean;
}

export interface MetaAudienceInsight {
  ageRange: string;
  gender: string;
  impressions: number;
  clicks: number;
  percentage: number;
  isMock: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────

const TAG = "meta-ads";

export function isConfigured(): boolean {
  return !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

const BASE_URL = "https://graph.facebook.com/v19.0";

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN || ""}`,
  };
}

const RETRY_OPTS = { integration: TAG };

// ─── Functions ───────────────────────────────────────────────

export async function createAdSet(
  input: MetaAdSetInput
): Promise<MetaAdSetResult> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock ad set data`);
    return {
      externalId: `mock-meta-${Date.now()}`,
      name: input.name,
      status: "ACTIVE",
      dailyBudget: input.dailyBudget,
      isMock: true,
    };
  }

  const accountId = sanitizePathSegment(
    process.env.META_AD_ACCOUNT_ID || "",
    "META_AD_ACCOUNT_ID"
  );

  const response = await fetchWithRetry(
    buildUrl(`/act_${accountId}/adsets`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        name: input.name,
        campaign_id: input.campaignName,
        daily_budget: input.dailyBudget,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LEAD_GENERATION",
        targeting: {
          geo_locations: input.targeting.location
            ? { cities: [{ key: input.targeting.location }] }
            : undefined,
          age_min: input.targeting.ageMin ?? 25,
          age_max: input.targeting.ageMax ?? 65,
          genders: input.targeting.genders,
          interests: input.targeting.interests?.map((i) => ({ name: i })),
        },
        status: "ACTIVE",
        start_time: input.startDate,
        end_time: input.endDate,
      }),
    },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as { id: string };

  logger.info(`[${TAG}] Ad set created`, { externalId: data.id, name: input.name });

  return {
    externalId: data.id,
    name: input.name,
    status: "ACTIVE",
    dailyBudget: input.dailyBudget,
    isMock: false,
  };
}

async function pauseAdSet(
  externalId: string
): Promise<{ success: boolean; isMock: boolean }> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock pause result`);
    return { success: true, isMock: true };
  }

  const safeId = sanitizePathSegment(externalId, "adSetId");

  await fetchWithRetry(
    buildUrl(`/${safeId}`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status: "PAUSED" }),
    },
    undefined,
    RETRY_OPTS,
  );

  logger.info(`[${TAG}] Ad set paused`, { externalId: safeId });
  return { success: true, isMock: false };
}

export async function getAdMetrics(
  externalId: string
): Promise<MetaAdMetrics> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock metrics`);
    const impressions = 1500 + Math.floor(Math.random() * 4000);
    const reach = Math.floor(impressions * 0.75);
    const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.04));
    const conversions = Math.floor(clicks * (0.06 + Math.random() * 0.1));
    const spent = clicks * (120 + Math.floor(Math.random() * 180));
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
      reach,
      frequency: reach > 0 ? Math.round((impressions / reach) * 100) / 100 : 0,
      isMock: true,
    };
  }

  const safeId = sanitizePathSegment(externalId, "adSetId");

  const response = await fetchWithRetry(
    buildUrl(`/${safeId}/insights`, {
      fields:
        "impressions,clicks,actions,spend,cpc,ctr,reach,frequency",
      date_preset: "last_30d",
    }),
    { headers: authHeaders() },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as {
    data: Array<{
      impressions: string;
      clicks: string;
      actions?: Array<{ action_type: string; value: string }>;
      spend: string;
      cpc: string;
      ctr: string;
      reach: string;
      frequency: string;
    }>;
  };

  const row = data.data?.[0];
  if (!row) {
    return {
      externalId,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spent: 0,
      costPerClick: 0,
      costPerConversion: 0,
      clickThroughRate: 0,
      reach: 0,
      frequency: 0,
      isMock: false,
    };
  }

  const impressions = parseInt(row.impressions, 10) || 0;
  const clicks = parseInt(row.clicks, 10) || 0;
  const conversions =
    parseInt(
      row.actions?.find((a) => a.action_type === "lead")?.value ?? "0",
      10
    ) || 0;
  const spent = Math.round(parseFloat(row.spend) * 100); // dollars to cents

  return {
    externalId,
    impressions,
    clicks,
    conversions,
    spent,
    costPerClick: clicks > 0 ? Math.round(spent / clicks) : 0,
    costPerConversion: conversions > 0 ? Math.round(spent / conversions) : 0,
    clickThroughRate: Math.round(parseFloat(row.ctr) * 100) / 100,
    reach: parseInt(row.reach, 10) || 0,
    frequency: Math.round(parseFloat(row.frequency) * 100) / 100,
    isMock: false,
  };
}

async function getAudienceInsights(
  externalId: string
): Promise<MetaAudienceInsight[]> {
  if (!isConfigured()) {
    logger.warn(`[${TAG}] API keys not configured — returning mock audience insights`);
    return [
      { ageRange: "25-34", gender: "male", impressions: 3200, clicks: 180, percentage: 28, isMock: true },
      { ageRange: "25-34", gender: "female", impressions: 2800, clicks: 165, percentage: 24, isMock: true },
      { ageRange: "35-44", gender: "male", impressions: 2100, clicks: 120, percentage: 18, isMock: true },
      { ageRange: "35-44", gender: "female", impressions: 1800, clicks: 95, percentage: 15, isMock: true },
      { ageRange: "45-54", gender: "male", impressions: 950, clicks: 45, percentage: 8, isMock: true },
      { ageRange: "45-54", gender: "female", impressions: 850, clicks: 38, percentage: 7, isMock: true },
    ];
  }

  const safeId = sanitizePathSegment(externalId, "adSetId");

  const response = await fetchWithRetry(
    buildUrl(`/${safeId}/insights`, {
      fields: "impressions,clicks",
      breakdowns: "age,gender",
      date_preset: "last_30d",
    }),
    { headers: authHeaders() },
    undefined,
    RETRY_OPTS,
  );

  const data = (await response.json()) as {
    data: Array<{
      age: string;
      gender: string;
      impressions: string;
      clicks: string;
    }>;
  };

  const rows = data.data ?? [];
  const totalImpressions = rows.reduce(
    (sum, row) => sum + (parseInt(row.impressions, 10) || 0),
    0
  );

  return rows.map((row) => {
    const impressions = parseInt(row.impressions, 10) || 0;
    return {
      ageRange: row.age,
      gender: row.gender,
      impressions,
      clicks: parseInt(row.clicks, 10) || 0,
      percentage:
        totalImpressions > 0
          ? Math.round((impressions / totalImpressions) * 100)
          : 0,
      isMock: false,
    };
  });
}
