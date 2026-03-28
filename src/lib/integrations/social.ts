// Social media posting wrapper
// Supports: facebook, instagram, linkedin, google_business
// Uses platform-specific tokens from env vars
// Falls back to mock data when not configured

import { logger } from "@/lib/logger";
import {
  fetchWithRetry,
} from "@/lib/integrations/integration-utils";

// ─── Types ───────────────────────────────────────────────────

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "google_business";

export interface PublishResult {
  success: boolean;
  externalId: string;
  platform: SocialPlatform;
  publishedAt: string;
  isMock: boolean;
}

export interface EngagementData {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  isMock: boolean;
}

export interface ScheduleResult {
  success: boolean;
  externalId: string;
  scheduledAt: string;
  isMock: boolean;
}

// ─── Platform Config ─────────────────────────────────────────

const TAG = "social";

interface PlatformConfig {
  token: string | undefined;
  pageId: string | undefined;
}

// Read env vars lazily (not at module load) so runtime changes are picked up
function getPlatformConfig(platform: SocialPlatform): PlatformConfig {
  switch (platform) {
    case "facebook":
      return {
        token: process.env.FACEBOOK_PAGE_TOKEN,
        pageId: process.env.FACEBOOK_PAGE_ID,
      };
    case "instagram":
      return {
        token: process.env.INSTAGRAM_ACCESS_TOKEN,
        pageId: process.env.INSTAGRAM_BUSINESS_ID,
      };
    case "linkedin":
      return {
        token: process.env.LINKEDIN_ACCESS_TOKEN,
        pageId: process.env.LINKEDIN_ORG_ID,
      };
    case "google_business":
      return {
        token: process.env.GOOGLE_BUSINESS_TOKEN,
        pageId: process.env.GOOGLE_BUSINESS_LOCATION_ID,
      };
  }
}

export function isPlatformConfigured(platform: SocialPlatform): boolean {
  const config = getPlatformConfig(platform);
  return !!(config.token && config.pageId);
}

export function isAnySocialPlatformConfigured(): boolean {
  const platforms: SocialPlatform[] = ["facebook", "instagram", "linkedin", "google_business"];
  return platforms.some(isPlatformConfigured);
}

function retryOpts(platform: SocialPlatform) {
  return { integration: `${TAG}-${platform}` };
}

// ─── Facebook / Instagram (Graph API) ────────────────────────

async function publishToFacebook(
  content: string,
  mediaUrls?: string[]
): Promise<PublishResult> {
  const { token, pageId } = getPlatformConfig("facebook");

  if (mediaUrls && mediaUrls.length > 0) {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: mediaUrls[0],
          message: content,
        }),
      },
      undefined,
      retryOpts("facebook"),
    );

    const data = (await response.json()) as { id: string };
    return {
      success: true,
      externalId: data.id,
      platform: "facebook",
      publishedAt: new Date().toISOString(),
      isMock: false,
    };
  }

  const response = await fetchWithRetry(
    `https://graph.facebook.com/v19.0/${pageId}/feed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: content,
      }),
    },
    undefined,
    retryOpts("facebook"),
  );

  const data = (await response.json()) as { id: string };
  return {
    success: true,
    externalId: data.id,
    platform: "facebook",
    publishedAt: new Date().toISOString(),
    isMock: false,
  };
}

async function publishToInstagram(
  content: string,
  mediaUrls?: string[]
): Promise<PublishResult> {
  const { token, pageId } = getPlatformConfig("instagram");

  if (!mediaUrls || mediaUrls.length === 0) {
    // Instagram requires media — create a text-only post via stories is not supported
    // Return mock for text-only posts
    return {
      success: false,
      externalId: "",
      platform: "instagram",
      publishedAt: new Date().toISOString(),
      isMock: false,
    };
  }

  // Step 1: Create media container
  const containerResponse = await fetchWithRetry(
    `https://graph.facebook.com/v19.0/${pageId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        image_url: mediaUrls[0],
        caption: content,
      }),
    },
    undefined,
    retryOpts("instagram"),
  );

  const container = (await containerResponse.json()) as { id: string };

  // Step 2: Publish the container
  const publishResponse = await fetchWithRetry(
    `https://graph.facebook.com/v19.0/${pageId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        creation_id: container.id,
      }),
    },
    undefined,
    retryOpts("instagram"),
  );

  const data = (await publishResponse.json()) as { id: string };
  return {
    success: true,
    externalId: data.id,
    platform: "instagram",
    publishedAt: new Date().toISOString(),
    isMock: false,
  };
}

async function publishToLinkedIn(
  content: string,
   
  _mediaUrls?: string[]
): Promise<PublishResult> {
  const { token, pageId } = getPlatformConfig("linkedin");

  const response = await fetchWithRetry(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        author: `urn:li:organization:${pageId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    },
    undefined,
    retryOpts("linkedin"),
  );

  const data = (await response.json()) as { id: string };
  return {
    success: true,
    externalId: data.id,
    platform: "linkedin",
    publishedAt: new Date().toISOString(),
    isMock: false,
  };
}

async function publishToGoogleBusiness(
  content: string,
   
  _mediaUrls?: string[]
): Promise<PublishResult> {
  const { token, pageId } = getPlatformConfig("google_business");

  const response = await fetchWithRetry(
    `https://mybusiness.googleapis.com/v4/accounts/-/locations/${pageId}/localPosts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        languageCode: "en",
        summary: content,
        topicType: "STANDARD",
      }),
    },
    undefined,
    retryOpts("google_business"),
  );

  const data = (await response.json()) as { name: string };
  return {
    success: true,
    externalId: data.name,
    platform: "google_business",
    publishedAt: new Date().toISOString(),
    isMock: false,
  };
}

// ─── Public Functions ────────────────────────────────────────

export async function publishPost(
  platform: SocialPlatform,
  content: string,
  mediaUrls?: string[]
): Promise<PublishResult> {
  if (!isPlatformConfigured(platform)) {
    logger.warn(`[${TAG}] ${platform} not configured — returning mock publish result`);
    return {
      success: true,
      externalId: `mock-${platform}-${Date.now()}`,
      platform,
      publishedAt: new Date().toISOString(),
      isMock: true,
    };
  }

  switch (platform) {
    case "facebook":
      return publishToFacebook(content, mediaUrls);
    case "instagram":
      return publishToInstagram(content, mediaUrls);
    case "linkedin":
      return publishToLinkedIn(content, mediaUrls);
    case "google_business":
      return publishToGoogleBusiness(content, mediaUrls);
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unsupported platform: ${_exhaustive}`);
    }
  }
}

export async function getEngagement(
  postExternalId: string,
  platform: SocialPlatform
): Promise<EngagementData> {
  if (!isPlatformConfigured(platform)) {
    logger.warn(`[${TAG}] ${platform} not configured — returning mock engagement data`);
    return {
      likes: 15 + Math.floor(Math.random() * 80),
      comments: 2 + Math.floor(Math.random() * 15),
      shares: 1 + Math.floor(Math.random() * 10),
      impressions: 300 + Math.floor(Math.random() * 2000),
      reach: 200 + Math.floor(Math.random() * 1500),
      isMock: true,
    };
  }

  switch (platform) {
    case "facebook":
    case "instagram": {
      const token =
        platform === "facebook"
          ? process.env.FACEBOOK_PAGE_TOKEN
          : process.env.INSTAGRAM_ACCESS_TOKEN;

      const response = await fetchWithRetry(
        `https://graph.facebook.com/v19.0/${postExternalId}?fields=likes.summary(true),comments.summary(true),shares`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        undefined,
        retryOpts(platform),
      );

      const data = (await response.json()) as {
        likes?: { summary?: { total_count?: number } };
        comments?: { summary?: { total_count?: number } };
        shares?: { count?: number };
      };

      return {
        likes: data.likes?.summary?.total_count ?? 0,
        comments: data.comments?.summary?.total_count ?? 0,
        shares: data.shares?.count ?? 0,
        impressions: 0,
        reach: 0,
        isMock: false,
      };
    }
    case "linkedin": {
      const token = process.env.LINKEDIN_ACCESS_TOKEN;
      const response = await fetchWithRetry(
        `https://api.linkedin.com/v2/socialActions/${postExternalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        undefined,
        retryOpts("linkedin"),
      );

      const data = (await response.json()) as {
        likesSummary?: { totalLikes?: number };
        commentsSummary?: { totalFirstLevelComments?: number };
      };

      return {
        likes: data.likesSummary?.totalLikes ?? 0,
        comments: data.commentsSummary?.totalFirstLevelComments ?? 0,
        shares: 0,
        impressions: 0,
        reach: 0,
        isMock: false,
      };
    }
    case "google_business": {
      // Google Business Profile does not expose per-post engagement via API
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        reach: 0,
        isMock: false,
      };
    }
  }
}

export async function schedulePost(
  platform: SocialPlatform,
  content: string,
  scheduledAt: Date,
  mediaUrls?: string[]
): Promise<ScheduleResult> {
  if (!isPlatformConfigured(platform)) {
    logger.warn(`[${TAG}] ${platform} not configured — returning mock schedule result`);
    return {
      success: true,
      externalId: `mock-scheduled-${platform}-${Date.now()}`,
      scheduledAt: scheduledAt.toISOString(),
      isMock: true,
    };
  }

  // Facebook supports scheduled posts natively
  if (platform === "facebook") {
    const { token, pageId } = getPlatformConfig("facebook");
    const scheduledTime = Math.floor(scheduledAt.getTime() / 1000);

    const response = await fetchWithRetry(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          published: false,
          scheduled_publish_time: scheduledTime,
        }),
      },
      undefined,
      retryOpts("facebook"),
    );

    const data = (await response.json()) as { id: string };
    return {
      success: true,
      externalId: data.id,
      scheduledAt: scheduledAt.toISOString(),
      isMock: false,
    };
  }

  // For other platforms, we handle scheduling at the application level
  // The cron/social-publish route handles publishing at the scheduled time
  void content;
  void mediaUrls;
  return {
    success: true,
    externalId: `app-scheduled-${platform}-${Date.now()}`,
    scheduledAt: scheduledAt.toISOString(),
    isMock: false,
  };
}
