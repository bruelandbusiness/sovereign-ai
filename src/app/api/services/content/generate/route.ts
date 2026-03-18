import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.jobId) {
    return NextResponse.json(
      { error: "jobId is required" },
      { status: 400 }
    );
  }

  const job = await prisma.contentJob.findUnique({
    where: { id: body.jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "Content job not found" }, { status: 404 });
  }

  if (job.clientId !== session.account.client.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: job.clientId },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Mark as generating
  await prisma.contentJob.update({
    where: { id: job.id },
    data: { status: "generating" },
  });

  try {
    const locationContext = [client.city, client.state]
      .filter(Boolean)
      .join(", ");

    const prompt = `You are an expert SEO content writer. Write a high-quality, SEO-optimized blog post for a ${client.vertical || "local"} business called "${client.businessName}"${locationContext ? ` located in ${locationContext}` : ""}.

Title: ${job.title}
${job.keywords ? `Target Keywords: ${job.keywords}` : ""}

Requirements:
- Write in a professional yet approachable tone
- Include the target keywords naturally throughout the content
- Structure the post with clear headings (use markdown ## and ### headings)
- Include an engaging introduction and a strong conclusion with a call-to-action
- Optimize for local SEO by mentioning the business location where relevant
- Aim for approximately 800-1200 words
- Make the content informative and valuable for the target audience

Return ONLY the blog post content in markdown format.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const generatedContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    const updatedJob = await prisma.contentJob.update({
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

    return NextResponse.json({
      id: updatedJob.id,
      clientId: updatedJob.clientId,
      type: updatedJob.type,
      title: updatedJob.title,
      content: updatedJob.content,
      keywords: updatedJob.keywords,
      status: updatedJob.status,
      publishAt: updatedJob.publishAt?.toISOString() ?? null,
      createdAt: updatedJob.createdAt.toISOString(),
      updatedAt: updatedJob.updatedAt.toISOString(),
    });
  } catch (error) {
    // Mark as failed if generation errors
    await prisma.contentJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });

    console.error("Content generation failed:", error);
    return NextResponse.json(
      { error: "Content generation failed" },
      { status: 500 }
    );
  }
}
