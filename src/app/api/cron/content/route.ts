import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron";
import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractTextContent, sanitizeForPrompt } from "@/lib/ai-utils";

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

    console.error(`Content generation failed for job ${job.id}:`, error);
    return { jobId: job.id, status: "failed" };
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  // Find up to 2 queued content jobs
  const queuedJobs = await prisma.contentJob.findMany({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 2,
  });

  if (queuedJobs.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "No queued content jobs found",
    });
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
}
