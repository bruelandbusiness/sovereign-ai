import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  publishPost,
  isAnySocialPlatformConfigured,
  type SocialPlatform,
} from "@/lib/integrations/social";
import { sanitizeForPrompt, handleAnthropicError, extractTextContent } from "@/lib/ai-utils";
import { screenContent, sanitizeContent } from "@/lib/content-safety";
import { rateLimit } from "@/lib/rate-limit";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

// Maximum number of social posts a client can publish per day
const MAX_POSTS_PER_DAY = 10;

const createSocialPostSchema = z.object({
  topic: z.string().min(1).max(500),
  platform: z.string().min(1).max(50).optional(),
  tone: z.string().max(50).optional(),
  content: z.string().max(5000).optional(),
  publishNow: z.boolean().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  scheduledAt: z.string().optional(),
});

const updatePostSchema = z.object({
  postId: z.string().min(1, "postId is required"),
  content: z.string().max(5000).optional(),
  scheduledAt: z.string().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
});

const VALID_PLATFORMS = ["facebook", "instagram", "linkedin", "google_business"] as const;
const VALID_STATUSES = ["draft", "scheduled", "published", "failed"] as const;

function isValidPlatform(p: string): p is SocialPlatform {
  return (VALID_PLATFORMS as readonly string[]).includes(p);
}

// GET: List scheduled/published posts
export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const posts = await prisma.socialPost.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      platform: true,
      content: true,
      mediaUrls: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      engagement: true,
      externalId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      platform: post.platform,
      content: post.content,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      engagement: post.engagement ? JSON.parse(post.engagement) : null,
      externalId: post.externalId,
      createdAt: post.createdAt.toISOString(),
    })),
    isMock: !isAnySocialPlatformConfigured(),
  });
}

// POST: Create + schedule a post (AI generates content if not provided)
export async function POST(request: Request) {
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

  const parsed = createSocialPostSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const body = parsed.data;

  if (!body.platform) {
    return NextResponse.json(
      { error: "platform is required" },
      { status: 400 }
    );
  }

  if (!isValidPlatform(body.platform)) {
    return NextResponse.json(
      { error: `platform must be one of: ${VALID_PLATFORMS.join(", ")}` },
      { status: 400 }
    );
  }

  // Reject scheduling in the past
  if (body.scheduledAt) {
    const scheduledDate = new Date(body.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "scheduledAt must be a valid ISO 8601 date string" },
        { status: 400 }
      );
    }
    // Allow a small grace window (2 minutes) to account for network latency
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (scheduledDate < twoMinutesAgo) {
      return NextResponse.json(
        { error: "scheduledAt must be a future date" },
        { status: 400 }
      );
    }
  }

  // Rate limit: prevent mass publishing per client per day
  const { allowed } = await rateLimit(
    `social-post:${clientId}`,
    MAX_POSTS_PER_DAY,
    MAX_POSTS_PER_DAY / 86400 // refill over 24 hours
  );
  if (!allowed) {
    return NextResponse.json(
      { error: `Daily post limit reached (${MAX_POSTS_PER_DAY} posts per day). Try again tomorrow.` },
      { status: 429 }
    );
  }

  // Generate content with Claude if not provided
  let content = body.content;
  if (!content) {
    if (!body.topic) {
      return NextResponse.json(
        { error: "Either content or topic is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    const safeBizName = sanitizeForPrompt(client?.businessName ?? "a local business", 200);
    const safeVertical = sanitizeForPrompt(client?.vertical ?? "home services", 100);
    const safeTopic = sanitizeForPrompt(body.topic, 500);
    const safeTone = sanitizeForPrompt(body.tone ?? "professional and friendly", 100);

    const prompt = `Generate a ${body.platform} post for ${safeBizName} (${safeVertical}) about: ${safeTopic}

Tone: ${safeTone}
Platform: ${body.platform}

Platform-specific guidelines:
- facebook: 1-3 paragraphs, can be longer, include a call-to-action
- instagram: Include relevant emojis, end with 5-10 hashtags
- linkedin: Professional tone, business-focused, 1-2 paragraphs
- google_business: Keep it concise, include a local angle, mention the business name

Return ONLY the post content, no other text or explanation.`;

    try {
      const response = await guardedAnthropicCall({
        clientId,
        action: "social.generate",
        description: `Generate ${body.platform} post about "${body.topic}"`,
        params: {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        },
      });

      content = extractTextContent(response, "");
    } catch (error) {
      if (error instanceof GovernanceBlockedError) {
        return NextResponse.json(
          { error: `Social post generation blocked: ${error.reason}` },
          { status: 429 }
        );
      }
      console.error("AI content generation failed:", error);
      const aiError = handleAnthropicError(error);
      return NextResponse.json(
        { error: aiError.message, retryable: aiError.retryable },
        { status: aiError.status }
      );
    }
  }

  // Screen content (AI-generated or user-provided) for safety
  const safetyResult = screenContent(content);
  if (!safetyResult.safe) {
    console.warn(
      `[social/posts] Content failed safety screening for client ${clientId}:`,
      safetyResult.reasons
    );
    return NextResponse.json(
      {
        error: "Content did not pass safety review",
        reasons: safetyResult.reasons,
      },
      { status: 422 }
    );
  }
  content = sanitizeContent(content);

  // Determine status and whether to publish immediately
  let status: (typeof VALID_STATUSES)[number] = "draft";
  let publishedAt: Date | null = null;
  let externalId: string | null = null;

  if (body.publishNow) {
    try {
      const result = await publishPost(
        body.platform,
        content,
        body.mediaUrls
      );
      if (result.success) {
        status = "published";
        publishedAt = new Date();
        externalId = result.externalId;
      } else {
        status = "failed";
      }
    } catch (error) {
      console.error("Failed to publish post:", error);
      status = "failed";
    }
  } else if (body.scheduledAt) {
    status = "scheduled";
  }

  const post = await prisma.socialPost.create({
    data: {
      clientId,
      platform: body.platform,
      content,
      mediaUrls: body.mediaUrls ? JSON.stringify(body.mediaUrls) : null,
      status,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      publishedAt,
      externalId,
    },
  });

  if (status === "published") {
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "content_published",
        title: `${body.platform} post published`,
        description: `Your ${body.platform} post has been published successfully.`,
      },
    });
  }

  return NextResponse.json(
    {
      id: post.id,
      platform: post.platform,
      content: post.content,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : [],
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      engagement: post.engagement ? JSON.parse(post.engagement) : null,
      externalId: post.externalId,
      createdAt: post.createdAt.toISOString(),
    },
    { status: 201 }
  );
}

// PUT: Update post content or reschedule
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

    const parsed = updatePostSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const post = await prisma.socialPost.findUnique({
      where: { id: body.postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.clientId !== clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (post.status === "published") {
      return NextResponse.json(
        { error: "Cannot edit a published post" },
        { status: 400 }
      );
    }

    const updateData: {
      content?: string;
      scheduledAt?: Date;
      mediaUrls?: string;
      status?: string;
    } = {};

    if (body.content) {
      updateData.content = body.content;
    }

    if (body.scheduledAt) {
      const scheduledDate = new Date(body.scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "scheduledAt must be a valid ISO 8601 date string" },
          { status: 400 }
        );
      }
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (scheduledDate < twoMinutesAgo) {
        return NextResponse.json(
          { error: "scheduledAt must be a future date" },
          { status: 400 }
        );
      }
      updateData.scheduledAt = scheduledDate;
      updateData.status = "scheduled";
    }

    if (body.mediaUrls) {
      updateData.mediaUrls = JSON.stringify(body.mediaUrls);
    }

    const updated = await prisma.socialPost.update({
      where: { id: body.postId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      platform: updated.platform,
      content: updated.content,
      mediaUrls: updated.mediaUrls ? JSON.parse(updated.mediaUrls) : [],
      status: updated.status,
      scheduledAt: updated.scheduledAt?.toISOString() ?? null,
      publishedAt: updated.publishedAt?.toISOString() ?? null,
      engagement: updated.engagement ? JSON.parse(updated.engagement) : null,
      externalId: updated.externalId,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Social post update error:", error);
    return NextResponse.json(
      { error: "Failed to update social post" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel a scheduled post
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json(
      { error: "postId query param is required" },
      { status: 400 }
    );
  }

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.clientId !== clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (post.status === "published") {
    return NextResponse.json(
      { error: "Cannot delete a published post" },
      { status: 400 }
    );
  }

  await prisma.socialPost.delete({ where: { id: postId } });

  return NextResponse.json({ success: true, deletedId: postId });
}
