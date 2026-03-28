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

export interface ContentCalendarEntry {
  week: number;
  day: string; // "Monday", "Wednesday", etc.
  platform: string;
  topic: string;
  caption: string;
  hashtags: string[];
  contentType: string; // "photo" | "carousel" | "video" | "text" | "story"
}

export interface ContentCalendarResult {
  entries: ContentCalendarEntry[];
  theme: string;
  socialPostIds: string[];
}

export interface PostCaptionResult {
  caption: string;
  hashtags: string[];
  callToAction: string;
  socialPostId: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the social media management service for a client.
 * Creates a welcome post draft so the client can see the dashboard immediately.
 */
export async function provisionSocial(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.socialPost.findFirst({
    where: { clientId },
  });

  if (!existing) {
    await prisma.socialPost.create({
      data: {
        clientId,
        platform: "facebook",
        content: `Exciting news! ${client.businessName} is now offering enhanced online services to better serve our customers${client.city ? ` in ${client.city}` : ""}. Stay tuned for tips, updates, and special offers! #${(client.vertical ?? "homeservice").replace(/\s+/g, "")} #local #community`,
        status: "draft",
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: "Social media management activated",
      description: `A draft social media post has been created for ${client.businessName}. Schedule and publish posts from your dashboard.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateContentCalendar — multi-week social media content calendar
// ---------------------------------------------------------------------------

/**
 * Generate a multi-week social media content calendar with platform-specific
 * posts, topics, captions, and hashtags.
 *
 * Creates SocialPost records in "draft" status for each calendar entry.
 *
 * @param clientId - The client to generate content for
 * @param weeks    - Number of weeks to plan (1-8, defaults to 4)
 */
export async function generateContentCalendar(
  clientId: string,
  weeks: number = 4
): Promise<ContentCalendarResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeWeeks = Math.min(Math.max(weeks, 1), 8);
  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are a social media strategist for local ${safeVertical} businesses. You create content calendars that build brand awareness, drive engagement, and generate leads — with a mix of educational, entertaining, and promotional content.`;

  const userPrompt = `Create a ${safeWeeks}-week social media content calendar for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Requirements:
- Plan 3-4 posts per week across Facebook, Instagram, and Google Business
- Mix content types: educational tips, before/after projects, behind-the-scenes, customer testimonials, seasonal tips, promotional offers, community engagement
- Follow the 80/20 rule: 80% value-driven content, 20% promotional
- Include platform-specific optimizations (Instagram = visual, Facebook = community, Google = service-focused)
- Each post should have a ready-to-use caption and relevant hashtags
- Include a mix of content types: photo, carousel, video suggestions, stories

Return a JSON object with:
- "theme": An overarching theme/focus for this content period (1 sentence)
- "entries": Array of objects with:
  - "week": week number (1-${safeWeeks})
  - "day": day of the week ("Monday", "Tuesday", etc.)
  - "platform": "facebook" | "instagram" | "google"
  - "topic": brief topic description
  - "caption": full ready-to-post caption text (with emojis where appropriate)
  - "hashtags": array of hashtag strings (without #)
  - "contentType": "photo" | "carousel" | "video" | "text" | "story"`;

  let entries: ContentCalendarEntry[];
  let theme: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "social.calendar",
      description: `Generate ${safeWeeks}-week content calendar`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      theme?: string;
      entries?: ContentCalendarEntry[];
    }>(response, {});

    theme = parsed.theme || `${safeWeeks}-week social media plan for ${client.businessName}`;
    entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[social] Content calendar generation failed:", error);
    theme = `${safeWeeks}-week social media plan for ${client.businessName}`;
    entries = generateFallbackCalendar(
      safeWeeks,
      client.businessName,
      client.vertical || "home service",
      location
    );
  }

  if (entries.length === 0) {
    entries = generateFallbackCalendar(
      safeWeeks,
      client.businessName,
      client.vertical || "home service",
      location
    );
  }

  // Create SocialPost records for each entry in a single batch query
  const postData = entries.map((entry) => {
    const hashtagString =
      Array.isArray(entry.hashtags) && entry.hashtags.length > 0
        ? "\n\n" + entry.hashtags.map((h) => `#${h}`).join(" ")
        : "";
    return {
      clientId,
      platform: entry.platform || "facebook",
      content: (entry.caption || entry.topic || "Scheduled post") + hashtagString,
      status: "draft",
    };
  });

  let socialPostIds: string[] = [];
  try {
    const created = await prisma.$transaction(
      postData.map((d) => prisma.socialPost.create({ data: d }))
    );
    socialPostIds = created.map((p) => p.id);
  } catch {
    // If transaction fails, fall back to individual creates
    for (const d of postData) {
      try {
        const post = await prisma.socialPost.create({ data: d });
        socialPostIds.push(post.id);
      } catch {
        // Continue creating other posts even if one fails
      }
    }
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: `${safeWeeks}-week content calendar created`,
      description: `${entries.length} social media posts planned across ${safeWeeks} weeks for ${client.businessName}. Theme: ${theme}`,
    },
  });

  return {
    entries,
    theme,
    socialPostIds,
  };
}

// ---------------------------------------------------------------------------
// generatePostCaption — platform-optimized captions
// ---------------------------------------------------------------------------

/**
 * Generate a platform-optimized caption for a social media post,
 * given an image or content description.
 *
 * @param clientId         - The client to generate for
 * @param platform         - "facebook" | "instagram" | "google" | "linkedin"
 * @param imageDescription - Description of the image or content for the post
 */
export async function generatePostCaption(
  clientId: string,
  platform: string,
  imageDescription: string
): Promise<PostCaptionResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safePlatform = sanitizeForPrompt(platform.toLowerCase(), 50);
  const safeDescription = sanitizeForPrompt(imageDescription, 500);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const platformGuide: Record<string, string> = {
    facebook: "Write a conversational, community-focused caption. 100-200 words. Ask a question or include a CTA. Light emoji use.",
    instagram: "Write an engaging caption with a hook in the first line. 80-150 words before hashtags. Include strategic emoji use. Suggest 15-20 relevant hashtags.",
    google: "Write a professional, service-focused post. 60-100 words. Include location and service keywords. Clear CTA.",
    linkedin: "Write a professional, value-driven post. 100-200 words. Share expertise or insight. Professional tone.",
  };

  const guide = platformGuide[safePlatform] || platformGuide["facebook"];

  const systemPrompt = `You are a social media copywriter for local ${safeVertical} businesses. Write authentic, engaging captions that drive real engagement.`;

  const userPrompt = `Write a ${safePlatform} caption for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Image/Content description: ${safeDescription}

Platform guidelines: ${guide}

Return a JSON object with:
- "caption": the complete caption text (with emojis where appropriate)
- "hashtags": array of relevant hashtags (without #)
- "callToAction": the specific CTA used in the post`;

  let caption: string;
  let hashtags: string[];
  let callToAction: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "social.caption",
      description: `Generate ${safePlatform} caption`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      caption?: string;
      hashtags?: string[];
      callToAction?: string;
    }>(response, {});

    caption = parsed.caption || extractTextContent(response, "");
    hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    callToAction = parsed.callToAction || "Contact us today!";
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[social] Caption generation failed:", error);
    caption = `Check out what we've been working on at ${client.businessName}! ${imageDescription}${safeLocation ? ` Serving ${safeLocation} and surrounding areas.` : ""} Contact us today for a free estimate!`;
    hashtags = [
      safeVertical.replace(/\s+/g, ""),
      "LocalBusiness",
      "QualityService",
    ];
    if (client.city) hashtags.push(client.city.replace(/\s+/g, ""));
    callToAction = "Contact us today for a free estimate!";
  }

  if (!caption) {
    caption = `${client.businessName} — ${imageDescription}. Contact us for a free estimate!`;
  }

  const hashtagString =
    hashtags.length > 0 ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "";

  const post = await prisma.socialPost.create({
    data: {
      clientId,
      platform: platform.toLowerCase(),
      content: caption + hashtagString,
      status: "draft",
    },
  });

  return {
    caption,
    hashtags,
    callToAction,
    socialPostId: post.id,
  };
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackCalendar(
  weeks: number,
  businessName: string,
  vertical: string,
  location: string
): ContentCalendarEntry[] {
  const entries: ContentCalendarEntry[] = [];
  const locationText = location ? ` in ${location}` : "";
  const platforms = ["facebook", "instagram", "google"];
  const days = ["Monday", "Wednesday", "Friday"];

  const topics = [
    { topic: "Expert tip", caption: `Pro tip from ${businessName}: Regular maintenance saves you money in the long run. Here's what to look for...`, type: "photo" as const },
    { topic: "Before/after project", caption: `Another transformation by ${businessName}${locationText}! Our team takes pride in every project, big or small.`, type: "carousel" as const },
    { topic: "Meet the team", caption: `The hardworking team at ${businessName} is ready to help with all your ${vertical} needs${locationText}!`, type: "photo" as const },
    { topic: "Customer spotlight", caption: `Another happy customer${locationText}! Thank you for trusting ${businessName} with your ${vertical} needs.`, type: "photo" as const },
    { topic: "Seasonal reminder", caption: `Is your home ready for the season? ${businessName} offers preventive ${vertical} services to keep everything running smoothly.`, type: "text" as const },
    { topic: "Community engagement", caption: `Proud to serve our${locationText ? ` ${location}` : ""} community! ${businessName} is here for all your ${vertical} needs.`, type: "photo" as const },
  ];

  for (let week = 1; week <= weeks; week++) {
    for (let i = 0; i < 3; i++) {
      const topicIndex = ((week - 1) * 3 + i) % topics.length;
      entries.push({
        week,
        day: days[i],
        platform: platforms[i],
        topic: topics[topicIndex].topic,
        caption: topics[topicIndex].caption,
        hashtags: [vertical.replace(/\s+/g, ""), "LocalBusiness", "HomeService"],
        contentType: topics[topicIndex].type,
      });
    }
  }

  return entries;
}
