import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";
import { SELF_SERVE_TOPICS } from "@/lib/self-serve-content";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function generateContentForJob(jobId: string) {
  const job = await prisma.contentJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return null;

  const client = await prisma.client.findUnique({
    where: { id: job.clientId },
  });

  if (!client) return null;

  // Mark as generating
  await prisma.contentJob.update({
    where: { id: job.id },
    data: { status: "generating" },
  });

  try {
    const locationContext = [client.city, client.state]
      .filter(Boolean)
      .join(", ");

    const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
    const safeVertical = sanitizeForPrompt(client.vertical || "local", 100);
    const safeTitle = sanitizeForPrompt(job.title || "Untitled", 200);
    const safeKeywords = job.keywords ? sanitizeForPrompt(job.keywords, 200) : "";

    const prompt = `You are an expert SEO content writer. Write a high-quality, SEO-optimized blog post for a ${safeVertical} business called "${safeBusinessName}"${locationContext ? ` located in ${sanitizeForPrompt(locationContext, 200)}` : ""}.

Title: ${safeTitle}
${safeKeywords ? `Target Keywords: ${safeKeywords}` : ""}

Requirements:
- Write in a professional yet approachable tone
- Include the target keywords naturally throughout the content
- Structure the post with clear headings (use markdown ## and ### headings)
- Include an engaging introduction and a strong conclusion with a call-to-action
- Optimize for local SEO by mentioning the business location where relevant
- Aim for approximately 800-1200 words
- Make the content informative and valuable for the target audience

Return ONLY the blog post content in markdown format.`;

    const response = await guardedAnthropicCall({
      clientId: client.id,
      action: "cron.content_generate",
      description: `Cron: generate blog post "${safeTitle}"`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      },
    });

    const generatedContent = extractTextContent(response, "");

    await prisma.contentJob.update({
      where: { id: job.id },
      data: {
        content: generatedContent,
        status: "published",
        publishAt: new Date(),
      },
    });

    // Publish to the public blog as a BlogPost
    if (job.type === "blog" && job.title && generatedContent) {
      const slug = job.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);

      // Extract first paragraph as excerpt
      const lines = generatedContent.split("\n").filter((l: string) => l.trim() && !l.startsWith("#"));
      const excerpt = (lines[0] || "").replace(/[*_`]/g, "").slice(0, 200);

      // Determine category from keywords
      const kw = (job.keywords || "").toLowerCase();
      const category = kw.includes("lead") ? "lead-generation"
        : kw.includes("review") ? "reviews"
        : kw.includes("chatbot") ? "chatbots"
        : kw.includes("roi") || kw.includes("revenue") ? "roi"
        : "ai-marketing";

      try {
        await prisma.blogPost.upsert({
          where: { slug },
          update: { content: generatedContent, title: job.title, excerpt, category, tags: job.keywords },
          create: {
            slug,
            title: job.title,
            content: generatedContent,
            excerpt,
            category,
            tags: job.keywords,
            metaTitle: job.title,
            metaDescription: excerpt,
          },
        });
      } catch (blogErr) {
        logger.errorWithCause("Failed to publish BlogPost:", blogErr);
      }
    }

    // Create activity event
    await prisma.activityEvent.create({
      data: {
        clientId: client.id,
        type: "content_published",
        title: `Blog post published: ${job.title}`,
        description: `AI-generated ${job.type} content "${job.title}" has been published${job.keywords ? ` targeting keywords: ${job.keywords}` : ""}.`,
      },
    });

    return { jobId: job.id, status: "published" };
  } catch (error) {
    await prisma.contentJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });

    logger.errorWithCause(`Content generation failed for job ${job.id}:`, error);
    return { jobId: job.id, status: "failed" };
  }
}

export const GET = withCronErrorHandler("cron/content", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    // Find up to 2 queued content jobs
    const queuedJobs = await prisma.contentJob.findMany({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    // If no queued jobs, auto-queue the next Sovereign AI topic
    if (queuedJobs.length === 0) {
      const autoQueued = await autoQueueSelfServeContent();
      if (!autoQueued) {
        return NextResponse.json({
          processed: 0,
          message: "No queued content jobs found and all self-serve topics exhausted",
        });
      }
      // Re-fetch the newly queued job
      const newJobs = await prisma.contentJob.findMany({
        where: { status: "queued" },
        orderBy: { createdAt: "asc" },
        take: 1,
      });
      queuedJobs.push(...newJobs);
    }

    const results = [];
    for (const job of queuedJobs) {
      const result = await generateContentForJob(job.id);
      if (result) {
        results.push(result);
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    logger.errorWithCause("[cron/content] Fatal error", error);
    return NextResponse.json(
      { error: "Content cron job failed" },
      { status: 500 }
    );
  }
});

/**
 * Auto-queue the next unwritten Sovereign AI blog topic.
 * Picks the first topic from SELF_SERVE_TOPICS that hasn't been created yet.
 */
async function autoQueueSelfServeContent(): Promise<boolean> {
  // Get the first client (Sovereign AI's own account)
  const client = await prisma.client.findFirst({ select: { id: true } });
  if (!client) return false;

  // Find existing titles to avoid duplicates
  const existingJobs = await prisma.contentJob.findMany({
    where: { clientId: client.id },
    select: { title: true },
  });
  const existingTitles = new Set(existingJobs.map((j) => j.title));

  // Find the next topic that hasn't been queued yet
  const nextTopic = SELF_SERVE_TOPICS.find(
    (topic) => !existingTitles.has(topic.title)
  );

  if (!nextTopic) return false;

  await prisma.contentJob.create({
    data: {
      clientId: client.id,
      type: nextTopic.type,
      title: nextTopic.title,
      keywords: nextTopic.keywords,
      status: "queued",
    },
  });

  return true;
}
