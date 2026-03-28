import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/social
 *
 * Auto-generates social media posts from recently published blog content.
 * Runs daily — picks the latest published blog post that doesn't have
 * a corresponding social post yet, and generates platform-specific content.
 */
export const GET = withCronErrorHandler("cron/social", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const client = await prisma.client.findFirst({ select: { id: true } });
    if (!client) {
      return NextResponse.json({ error: "No client found" }, { status: 404 });
    }

    // Find published blog posts that don't have social posts yet
    const publishedBlogs = await prisma.contentJob.findMany({
      where: {
        clientId: client.id,
        status: "published",
        type: "blog",
        content: { not: null },
      },
      orderBy: { publishAt: "desc" },
      take: 5,
    });

    if (publishedBlogs.length === 0) {
      return NextResponse.json({
        generated: 0,
        message: "No published blog posts to generate social content from",
      });
    }

    // Check which blogs already have social posts
    const existingSocialPosts = await prisma.socialPost.findMany({
      where: { clientId: client.id },
      select: { content: true },
    });
    const existingContent = new Set(
      existingSocialPosts.map((p) => p.content?.slice(0, 50))
    );

    let generated = 0;

    for (const blog of publishedBlogs) {
      if (!blog.content || !blog.title) continue;

      // Skip if we already created social posts referencing this blog title
      const titleSnippet = blog.title.slice(0, 30);
      const alreadyExists = [...existingContent].some(
        (c) => c && c.includes(titleSnippet)
      );
      if (alreadyExists) continue;

      // Generate social posts for multiple platforms
      const safeTitle = sanitizeForPrompt(blog.title, 200);
      const safeContent = sanitizeForPrompt(blog.content.slice(0, 1000), 1000);

      const prompt = `Based on this blog post, create 3 social media posts (one for each platform):

Blog Title: ${safeTitle}
Blog Content (excerpt): ${safeContent}

Create posts for:
1. **LinkedIn** — Professional, thought-leadership tone. 1-2 paragraphs. Include a CTA to read the full post.
2. **Facebook** — Conversational, engaging. 2-3 sentences with a question to drive engagement.
3. **Twitter/X** — Under 280 characters. Punchy, with relevant hashtags.

For all posts:
- The business is Sovereign AI (AI marketing for home service businesses)
- Include a call-to-action pointing to trysovereignai.com
- Use relevant industry hashtags

Return each post clearly labeled with the platform name on its own line, like:
LINKEDIN:
[post content]

FACEBOOK:
[post content]

TWITTER:
[post content]`;

      try {
        const response = await guardedAnthropicCall({
          clientId: client.id,
          action: "cron.social_generate",
          description: `Cron: generate social posts for "${safeTitle}"`,
          params: {
            model: "claude-haiku-4-5-20251001",
            max_tokens: 800,
            messages: [{ role: "user", content: prompt }],
          },
        });

        const text = extractTextContent(response, "");
        const posts = parseSocialPosts(text);

        for (const post of posts) {
          await prisma.socialPost.create({
            data: {
              clientId: client.id,
              platform: post.platform,
              content: post.content,
              status: "draft",
            },
          });
        }

        generated += posts.length;
      } catch (err) {
        logger.errorWithCause(`[cron/social] Failed to generate posts for "${blog.title}"`, err);
      }

      // Only process one blog per cron run to stay within rate limits
      break;
    }

    return NextResponse.json({
      generated,
      message: generated > 0
        ? `Generated ${generated} social media posts`
        : "No new posts to generate",
    });
  } catch (error) {
    logger.errorWithCause("[cron/social] Cron failed", error);
    return NextResponse.json(
      { error: "Social cron job failed" },
      { status: 500 }
    );
  }
});

function parseSocialPosts(text: string): { platform: string; content: string }[] {
  const posts: { platform: string; content: string }[] = [];

  const platforms = [
    { key: "LINKEDIN:", platform: "linkedin" },
    { key: "FACEBOOK:", platform: "facebook" },
    { key: "TWITTER:", platform: "twitter" },
  ];

  for (let i = 0; i < platforms.length; i++) {
    const start = text.indexOf(platforms[i].key);
    if (start === -1) continue;

    const contentStart = start + platforms[i].key.length;
    const nextPlatform = platforms
      .slice(i + 1)
      .map((p) => text.indexOf(p.key, contentStart))
      .filter((idx) => idx !== -1);
    const end = nextPlatform.length > 0 ? Math.min(...nextPlatform) : text.length;

    const content = text.slice(contentStart, end).trim();
    if (content) {
      posts.push({ platform: platforms[i].platform, content });
    }
  }

  return posts;
}
