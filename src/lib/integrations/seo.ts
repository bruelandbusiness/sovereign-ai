// SEO tracking integration wrapper
// Supports Google Search Console API and DataForSEO API
// Falls back to realistic mock data when API keys are not configured

import { logger } from "@/lib/logger";
import {
  fetchWithRetry,
} from "@/lib/integrations/integration-utils";

// ─── Types ───────────────────────────────────────────────────

export interface KeywordRanking {
  keyword: string;
  position: number | null;
  prevPosition: number | null;
  searchVolume: number;
  difficulty: number;
  url: string | null;
  isMock: boolean;
}

export interface SiteAuditResult {
  score: number; // 0-100
  issues: SiteAuditIssue[];
  recommendations: string[];
  keywordOpportunities: string[];
  isMock: boolean;
}

export interface SiteAuditIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  description: string;
  affectedUrl?: string;
}

export interface BacklinkData {
  totalBacklinks: number;
  referringDomains: number;
  domainAuthority: number;
  topBacklinks: Array<{
    sourceUrl: string;
    targetUrl: string;
    anchorText: string;
    domainRank: number;
  }>;
  isMock: boolean;
}

export interface SearchConsoleData {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  isMock: boolean;
}

// ─── Config ──────────────────────────────────────────────────

const TAG = "seo";

function isSearchConsoleConfigured(): boolean {
  return !!process.env.GOOGLE_SEARCH_CONSOLE_KEY;
}

export function isDataForSEOConfigured(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function getDataForSEOAuth(): string {
  return Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
  ).toString("base64");
}

const RETRY_OPTS_DATAFORSEO = { integration: `${TAG}-dataforseo` };
const RETRY_OPTS_GSC = { integration: `${TAG}-search-console` };

// ─── Mock Data Generators ────────────────────────────────────

function generateMockKeywordRanking(keyword: string): KeywordRanking {
  const hasRanking = Math.random() > 0.2;
  const position = hasRanking ? 1 + Math.floor(Math.random() * 50) : null;
  const prevDelta = Math.floor(Math.random() * 10) - 5;
  const prevPosition = position !== null ? Math.max(1, position + prevDelta) : null;

  return {
    keyword,
    position,
    prevPosition,
    searchVolume: 100 + Math.floor(Math.random() * 5000),
    difficulty: 10 + Math.floor(Math.random() * 80),
    url: hasRanking ? `/${keyword.replace(/\s+/g, "-").toLowerCase()}` : null,
    isMock: true,
  };
}

// ─── Functions ───────────────────────────────────────────────

export async function trackKeywordRankings(
  _clientId: string,
  keywords: string[]
): Promise<KeywordRanking[]> {
  if (!isDataForSEOConfigured()) {
    logger.warn(`[${TAG}] DataForSEO not configured — returning mock keyword rankings`);
    return keywords.map(generateMockKeywordRanking);
  }

  const tasks = keywords.map((keyword) => ({
    keyword,
    location_code: 2840, // USA
    language_code: "en",
    device: "desktop",
    os: "windows",
  }));

  const response = await fetchWithRetry(
    "https://api.dataforseo.com/v3/serp/google/organic/live/regular",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getDataForSEOAuth()}`,
      },
      body: JSON.stringify(tasks),
    },
    undefined,
    RETRY_OPTS_DATAFORSEO,
  );

  const data = (await response.json()) as {
    tasks: Array<{
      result: Array<{
        keyword: string;
        items: Array<{
          rank_absolute: number;
          url: string;
        }>;
        search_information?: {
          search_results_count: number;
        };
      }>;
    }>;
  };

  return (data.tasks ?? []).map((task) => {
    const result = task.result?.[0];
    const topItem = result?.items?.[0];
    return {
      keyword: result?.keyword ?? "",
      position: topItem?.rank_absolute ?? null,
      prevPosition: null, // Will be filled from DB
      searchVolume: result?.search_information?.search_results_count ?? 0,
      difficulty: 50, // DataForSEO returns this from a separate endpoint
      url: topItem?.url ?? null,
      isMock: false,
    };
  });
}

export async function getSiteAudit(url: string): Promise<SiteAuditResult> {
  if (!isDataForSEOConfigured()) {
    logger.warn(`[${TAG}] DataForSEO not configured — returning mock audit results`);
    return {
      score: 55 + Math.floor(Math.random() * 30),
      issues: [
        {
          severity: "critical",
          category: "Performance",
          description: "Page load time exceeds 3 seconds on mobile devices",
          affectedUrl: url,
        },
        {
          severity: "critical",
          category: "SEO",
          description:
            "Missing meta descriptions on 5 key pages",
        },
        {
          severity: "warning",
          category: "SEO",
          description:
            "H1 tag is missing or duplicated on 3 pages",
        },
        {
          severity: "warning",
          category: "Content",
          description:
            "Thin content detected on service pages (less than 300 words)",
        },
        {
          severity: "warning",
          category: "Technical",
          description:
            "Images missing alt text on 12 pages",
        },
        {
          severity: "info",
          category: "Technical",
          description:
            "XML sitemap could include more pages",
        },
        {
          severity: "info",
          category: "Schema",
          description:
            "LocalBusiness schema markup not detected",
        },
      ],
      recommendations: [
        "Add unique meta descriptions to all service pages",
        "Implement LocalBusiness schema markup for better local SEO",
        "Optimize images and enable lazy loading to improve page speed",
        "Add more content to service pages (aim for 500+ words each)",
        "Create a Google Business Profile and keep it updated",
        "Build citations on local directories (Yelp, BBB, Angi)",
        "Add customer testimonials with schema markup",
      ],
      keywordOpportunities: [
        "near me" + " variations for your services",
        "best [service] in [city]",
        "[service] cost/pricing in [city]",
        "emergency [service] [city]",
        "[service] reviews [city]",
      ],
      isMock: true,
    };
  }

  // Use DataForSEO OnPage API for site audit
  const response = await fetchWithRetry(
    "https://api.dataforseo.com/v3/on_page/task_post",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getDataForSEOAuth()}`,
      },
      body: JSON.stringify([
        {
          target: url,
          max_crawl_pages: 50,
          load_resources: true,
          enable_javascript: true,
        },
      ]),
    },
    undefined,
    RETRY_OPTS_DATAFORSEO,
  );

  const data = (await response.json()) as {
    tasks: Array<{
      result: Array<{
        crawl_progress: string;
        crawl_status: {
          pages_crawled: number;
        };
      }>;
    }>;
  };

  // OnPage tasks are async; for now return a placeholder score
  const crawled = data.tasks?.[0]?.result?.[0]?.crawl_status?.pages_crawled ?? 0;
  return {
    score: Math.min(100, 40 + crawled * 2),
    issues: [],
    recommendations: [
      "Full audit results will be available after crawl completes",
    ],
    keywordOpportunities: [],
    isMock: false,
  };
}

export async function getBacklinks(domain: string): Promise<BacklinkData> {
  if (!isDataForSEOConfigured()) {
    logger.warn(`[${TAG}] DataForSEO not configured — returning mock backlink data`);
    return {
      totalBacklinks: 45 + Math.floor(Math.random() * 200),
      referringDomains: 12 + Math.floor(Math.random() * 50),
      domainAuthority: 15 + Math.floor(Math.random() * 40),
      topBacklinks: [
        {
          sourceUrl: "https://www.yelp.com/biz/example",
          targetUrl: `https://${domain}`,
          anchorText: "Visit Website",
          domainRank: 93,
        },
        {
          sourceUrl: "https://www.bbb.org/example",
          targetUrl: `https://${domain}`,
          anchorText: domain,
          domainRank: 88,
        },
        {
          sourceUrl: "https://www.angieslist.com/example",
          targetUrl: `https://${domain}`,
          anchorText: "Official Site",
          domainRank: 82,
        },
      ],
      isMock: true,
    };
  }

  const response = await fetchWithRetry(
    "https://api.dataforseo.com/v3/backlinks/summary/live",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${getDataForSEOAuth()}`,
      },
      body: JSON.stringify([{ target: domain, internal_list_limit: 10 }]),
    },
    undefined,
    RETRY_OPTS_DATAFORSEO,
  );

  const data = (await response.json()) as {
    tasks: Array<{
      result: Array<{
        backlinks: number;
        referring_domains: number;
        rank: number;
        referring_links_tld: Record<string, number>;
      }>;
    }>;
  };

  const result = data.tasks?.[0]?.result?.[0];
  return {
    totalBacklinks: result?.backlinks ?? 0,
    referringDomains: result?.referring_domains ?? 0,
    domainAuthority: result?.rank ?? 0,
    topBacklinks: [], // Would need a separate backlinks/backlinks endpoint
    isMock: false,
  };
}

export async function getSearchConsoleData(
  siteUrl: string,
  days: number = 30
): Promise<SearchConsoleData> {
  if (!isSearchConsoleConfigured()) {
    logger.warn(`[${TAG}] Google Search Console not configured — returning mock data`);
    const mockQueries = [
      { query: "plumber near me", clicks: 45, impressions: 1200, ctr: 3.75, position: 8.2 },
      { query: "emergency plumber", clicks: 28, impressions: 800, ctr: 3.5, position: 12.1 },
      { query: "water heater repair", clicks: 22, impressions: 650, ctr: 3.38, position: 9.5 },
      { query: "drain cleaning service", clicks: 18, impressions: 520, ctr: 3.46, position: 11.3 },
      { query: "pipe leak repair", clicks: 15, impressions: 380, ctr: 3.95, position: 7.8 },
    ];

    const totalClicks = mockQueries.reduce((s, q) => s + q.clicks, 0);
    const totalImpressions = mockQueries.reduce((s, q) => s + q.impressions, 0);

    return {
      totalClicks,
      totalImpressions,
      averageCtr:
        totalImpressions > 0
          ? Math.round((totalClicks / totalImpressions) * 10000) / 100
          : 0,
      averagePosition: 9.8,
      topQueries: mockQueries,
      topPages: [
        { page: "/", clicks: 50, impressions: 1500, ctr: 3.33, position: 8.0 },
        { page: "/services", clicks: 35, impressions: 900, ctr: 3.89, position: 10.2 },
        { page: "/about", clicks: 12, impressions: 400, ctr: 3.0, position: 15.0 },
      ],
      isMock: true,
    };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // Fetch query data
  const response = await fetchWithRetry(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GOOGLE_SEARCH_CONSOLE_KEY}`,
      },
      body: JSON.stringify({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["query"],
        rowLimit: 20,
      }),
    },
    undefined,
    RETRY_OPTS_GSC,
  );

  const data = (await response.json()) as {
    rows: Array<{
      keys: string[];
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
  };

  const rows = data.rows ?? [];
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);

  // Fetch page data separately
  let topPages: SearchConsoleData["topPages"] = [];
  try {
    const pageResponse = await fetchWithRetry(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GOOGLE_SEARCH_CONSOLE_KEY}`,
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ["page"],
          rowLimit: 10,
        }),
      },
      undefined,
      RETRY_OPTS_GSC,
    );

    const pageData = (await pageResponse.json()) as {
      rows: Array<{
        keys: string[];
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>;
    };
    topPages = (pageData.rows ?? []).map((r) => ({
      page: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    }));
  } catch (err) {
    logger.error(`[${TAG}] Failed to fetch Search Console page data`, {
      error: err instanceof Error ? err.message : String(err),
    });
    // Continue with empty topPages rather than failing the entire call
  }

  return {
    totalClicks,
    totalImpressions,
    averageCtr:
      totalImpressions > 0
        ? Math.round((totalClicks / totalImpressions) * 10000) / 100
        : 0,
    averagePosition:
      rows.length > 0
        ? Math.round(
            (rows.reduce((s, r) => s + r.position, 0) / rows.length) * 10
          ) / 10
        : 0,
    topQueries: rows.map((r) => ({
      query: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    })),
    topPages,
    isMock: false,
  };
}
