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

export interface BlogPostResult {
  title: string;
  content: string; // markdown
  metaDescription: string;
  contentJobId: string;
}

export interface SocialPostResult {
  platform: string;
  content: string;
  hashtags: string[];
  socialPostId: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the content engine for a client.
 * Queues the first batch of content jobs (2 blog posts to start).
 */
export async function provisionContent(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  // Idempotency: skip if content jobs already exist for this client
  const existingJobs = await prisma.contentJob.findFirst({
    where: { clientId },
  });
  if (existingJobs) return;

  const vertical = client.vertical || "home service";
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

  // Queue 2 initial blog posts
  const initialTopics = [
    {
      title: `Top 5 ${vertical} Tips Every Homeowner in ${location} Should Know`,
      keywords: `${vertical} tips, ${location} ${vertical}, home maintenance`,
    },
    {
      title: `How to Choose the Best ${vertical} Company in ${location}`,
      keywords: `best ${vertical} ${location}, ${vertical} company near me`,
    },
  ];

  await prisma.contentJob.createMany({
    data: initialTopics.map((topic) => ({
      clientId,
      type: "blog",
      title: topic.title,
      keywords: topic.keywords,
      status: "queued",
    })),
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: "Content engine activated",
      description: `${initialTopics.length} blog posts queued for ${client.businessName}. First post will be generated within 24 hours.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateBlogPost — SEO-optimized blog post generation
// ---------------------------------------------------------------------------

/**
 * Generate a full SEO-optimized blog post for a client's website.
 *
 * Creates a ContentJob record, calls Claude with industry-specific context,
 * and returns the generated markdown content along with a meta description.
 *
 * @param clientId - The client to generate content for
 * @param topic    - The blog post topic / title
 * @param keywords - Comma-separated target keywords for SEO
 */
export async function generateBlogPost(
  clientId: string,
  topic: string,
  keywords?: string
): Promise<BlogPostResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeTopic = sanitizeForPrompt(topic, 300);
  const safeKeywords = keywords ? sanitizeForPrompt(keywords, 300) : "";
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  // Create the content job record in "generating" status
  const job = await prisma.contentJob.create({
    data: {
      clientId,
      type: "blog",
      title: topic,
      keywords: keywords || null,
      status: "generating",
    },
  });

  const systemPrompt = `You are an expert SEO content writer specializing in ${safeVertical} businesses. You write engaging, informative blog posts that rank well in search engines and provide genuine value to homeowners and property managers.`;

  const userPrompt = `Write a high-quality, SEO-optimized blog post for ${safeBusinessName}, a ${safeVertical} business${safeLocation ? ` in ${safeLocation}` : ""}.

Topic: ${safeTopic}
${safeKeywords ? `Target Keywords: ${safeKeywords}` : ""}

Requirements:
- Write 800-1200 words of genuinely useful content
- Use a professional yet approachable tone — write for homeowners, not industry insiders
- Structure with clear markdown headings (## and ###)
- Include the target keywords naturally — do NOT keyword-stuff
- Start with an engaging introduction that hooks the reader
- Include practical tips, actionable advice, or useful information
- Add local relevance by mentioning ${safeLocation || "the local area"} where appropriate
- End with a strong conclusion and a natural call-to-action for ${safeBusinessName}
- Optimize for local SEO: mention the service area, business name, and relevant services

Return a JSON object with:
- "title": an SEO-optimized title (60-70 characters, includes primary keyword)
- "content": the full blog post in markdown format
- "metaDescription": a compelling meta description (150-160 characters)`;

  let title = topic;
  let content: string;
  let metaDescription: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "content.blog",
      description: `Generate blog post: ${safeTopic}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      title?: string;
      content?: string;
      metaDescription?: string;
    }>(response, {});

    title = parsed.title || topic;
    content = parsed.content || extractTextContent(response, "");
    metaDescription =
      parsed.metaDescription ||
      `Learn about ${topic} from ${client.businessName}${location ? ` in ${location}` : ""}. Expert tips and advice for homeowners.`;
  } catch (error) {
    // Mark as failed and throw governance errors through
    if (error instanceof GovernanceBlockedError) {
      await prisma.contentJob.update({
        where: { id: job.id },
        data: { status: "failed" },
      });
      throw error;
    }

    logger.errorWithCause("[content] Blog generation failed:", error);
    await prisma.contentJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });

    // Return a minimal fallback rather than crashing
    return {
      title: topic,
      content: "",
      metaDescription: "",
      contentJobId: job.id,
    };
  }

  if (!content) {
    await prisma.contentJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });
    return {
      title,
      content: "",
      metaDescription: "",
      contentJobId: job.id,
    };
  }

  // Save the generated content
  await prisma.contentJob.update({
    where: { id: job.id },
    data: {
      title,
      content,
      status: "published",
      publishAt: new Date(),
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: `Blog post published: ${title}`,
      description: `AI-generated blog post "${title}" has been published${keywords ? ` targeting keywords: ${keywords}` : ""}.`,
    },
  });

  return {
    title,
    content,
    metaDescription,
    contentJobId: job.id,
  };
}

// ---------------------------------------------------------------------------
// generateSocialPost — platform-specific social media content
// ---------------------------------------------------------------------------

/**
 * Generate a social media post tailored to a specific platform.
 *
 * Adapts tone, length, and format based on the platform:
 * - Facebook: longer, conversational, community-focused
 * - Instagram: visual-centric captions with strategic hashtags
 * - Google Business: professional, service-focused, location-aware
 *
 * @param clientId - The client to generate content for
 * @param platform - "facebook" | "instagram" | "google"
 * @param topic    - What the post should be about
 */
export async function generateSocialPost(
  clientId: string,
  platform: string,
  topic: string
): Promise<SocialPostResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeTopic = sanitizeForPrompt(topic, 300);
  const safePlatform = sanitizeForPrompt(platform.toLowerCase(), 50);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const platformGuidelines: Record<string, string> = {
    facebook: `Facebook post guidelines:
- 150-300 words, conversational and community-focused
- Ask a question or include a call-to-action to drive engagement
- Can include emojis sparingly
- Write like a friendly local business owner, not a corporate brand
- Include a clear CTA (e.g., "Call us today", "Book online", "Comment below")`,

    instagram: `Instagram post guidelines:
- 100-200 word caption (before hashtags)
- Start with a hook that stops the scroll
- Tell a mini story or share a tip
- End with a CTA and line break before hashtags
- Include 15-25 relevant hashtags (mix of broad and niche)
- Use emojis strategically to break up text`,

    google: `Google Business post guidelines:
- 100-150 words, professional and informative
- Focus on services, offers, or helpful tips
- Include relevant service keywords for local SEO
- Add a clear CTA with a specific action (Book, Call, Learn More)
- Mention the service area / location
- Keep it factual and valuable — Google posts are more transactional`,
  };

  const guidelines =
    platformGuidelines[safePlatform] || platformGuidelines["facebook"];

  const systemPrompt = `You are a social media marketing expert for local ${safeVertical} businesses. You write posts that feel authentic and drive real engagement — not generic corporate content.`;

  const userPrompt = `Write a ${safePlatform} post for ${safeBusinessName}, a ${safeVertical} business${safeLocation ? ` in ${safeLocation}` : ""}.

Topic: ${safeTopic}

${guidelines}

Return a JSON object with:
- "content": the complete post text (including emojis and formatting)
- "hashtags": an array of relevant hashtags (without the # symbol)`;

  let content: string;
  let hashtags: string[];

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "content.social",
      description: `Generate ${safePlatform} post about ${safeTopic}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      content?: string;
      hashtags?: string[];
    }>(response, {});

    content = parsed.content || extractTextContent(response, "");
    hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[content] Social post generation failed:", error);
    content = generateFallbackSocialPost(
      platform,
      topic,
      client.businessName,
      location
    );
    hashtags = generateFallbackHashtags(client.vertical || "home service", location);
  }

  if (!content) {
    content = generateFallbackSocialPost(
      platform,
      topic,
      client.businessName,
      location
    );
    hashtags = generateFallbackHashtags(client.vertical || "home service", location);
  }

  // Save the social post
  const socialPost = await prisma.socialPost.create({
    data: {
      clientId,
      platform: platform.toLowerCase(),
      content,
      status: "draft",
    },
  });

  // Also create a ContentJob record for tracking
  await prisma.contentJob.create({
    data: {
      clientId,
      type: "social",
      title: `${platform} post: ${topic}`,
      content,
      status: "published",
      publishAt: new Date(),
    },
  });

  return {
    platform: platform.toLowerCase(),
    content,
    hashtags,
    socialPostId: socialPost.id,
  };
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackSocialPost(
  platform: string,
  topic: string,
  businessName: string,
  location: string
): string {
  const locationText = location ? ` in ${location}` : "";
  return `Looking for expert help with ${topic}? ${businessName}${locationText} is here to help! Contact us today to learn more about our professional services.\n\nCall us or visit our website to schedule your free consultation.`;
}

function generateFallbackHashtags(
  vertical: string,
  location: string
): string[] {
  const base = [
    vertical.replace(/\s+/g, ""),
    "HomeService",
    "LocalBusiness",
    "QualityService",
    "HomeImprovement",
  ];
  if (location) {
    const city = location.split(",")[0]?.trim().replace(/\s+/g, "");
    if (city) base.push(city, `${city}${vertical.replace(/\s+/g, "")}`);
  }
  return base;
}
