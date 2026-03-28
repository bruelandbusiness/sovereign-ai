import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteAudit, getBacklinks, isDataForSEOConfigured } from "@/lib/integrations/seo";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { sanitizeForPrompt, handleAnthropicError, extractTextContent } from "@/lib/ai-utils";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const auditSchema = z.object({
  url: z.string().url().max(2000),
});

// POST: Run an AI-powered SEO audit
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

  const parsed = auditSchema.safeParse(rawBody);

  // Use provided URL or fall back to client's website
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  const url = parsed.success ? parsed.data.url : client?.website;
  if (!url) {
    return NextResponse.json(
      { error: "url is required (or set your website in client settings)" },
      { status: 400 }
    );
  }

  try {
    // Fetch technical audit data and backlink data in parallel
    const [technicalAudit, backlinkData] = await Promise.all([
      getSiteAudit(url),
      getBacklinks(new URL(url.startsWith("http") ? url : `https://${url}`).hostname),
    ]);

    // Use Claude to analyze and generate comprehensive recommendations
    const locationContext = [client?.city, client?.state]
      .filter(Boolean)
      .join(", ");

    const safeBusinessName = sanitizeForPrompt(client?.businessName ?? "Local Business", 200);
    const safeVertical = sanitizeForPrompt(client?.vertical ?? "home services", 100);
    const safeLocation = sanitizeForPrompt(locationContext, 200);

    const prompt = `You are an expert SEO consultant analyzing a website for a local business. Based on the following data, provide a comprehensive SEO audit.

Business: ${safeBusinessName}
Industry: ${safeVertical}
${safeLocation ? `Location: ${safeLocation}` : ""}
Website: ${url}

Technical Audit Score: ${technicalAudit.score}/100
Issues Found: ${technicalAudit.issues.map((i) => `[${i.severity.toUpperCase()}] ${i.description}`).join("; ")}
Backlinks: ${backlinkData.totalBacklinks} total, ${backlinkData.referringDomains} referring domains, DA: ${backlinkData.domainAuthority}

Analyze these findings and provide your response as JSON in this exact format:
{
  "score": <0-100 overall SEO score>,
  "summary": "<2-3 sentence overall assessment>",
  "issues": [
    {"severity": "critical|warning|info", "category": "<category>", "description": "<issue description>", "fix": "<how to fix it>"}
  ],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", ...],
  "keywordOpportunities": ["<keyword 1>", "<keyword 2>", ...],
  "localSeoTips": ["<local SEO tip 1>", "<local SEO tip 2>", ...]
}

Focus on:
1. Local SEO opportunities specific to ${safeVertical} in ${safeLocation || "their area"}
2. Technical issues that impact rankings
3. Content opportunities
4. Google Business Profile optimization
5. Citation and directory listings

Return ONLY the JSON, no other text.`;

    const response = await guardedAnthropicCall({
      clientId,
      action: "seo.audit",
      description: `SEO audit for ${url}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      },
    });

    const generatedText = extractTextContent(response, "{}");

    let aiAnalysis: {
      score: number;
      summary: string;
      issues: Array<{
        severity: string;
        category: string;
        description: string;
        fix: string;
      }>;
      recommendations: string[];
      keywordOpportunities: string[];
      localSeoTips: string[];
    };

    try {
      aiAnalysis = JSON.parse(generatedText);
    } catch {
      aiAnalysis = {
        score: technicalAudit.score,
        summary: "SEO analysis completed. See issues and recommendations below.",
        issues: technicalAudit.issues.map((i) => ({
          severity: i.severity,
          category: i.category,
          description: i.description,
          fix: "Review and address this issue",
        })),
        recommendations: technicalAudit.recommendations,
        keywordOpportunities: technicalAudit.keywordOpportunities,
        localSeoTips: [],
      };
    }

    // Create activity event
    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "seo_update",
        title: "SEO audit completed",
        description: `Site audit for ${url} scored ${aiAnalysis.score}/100. Found ${aiAnalysis.issues.length} issues with ${aiAnalysis.recommendations.length} recommendations.`,
      },
    });

    return NextResponse.json({
      url,
      score: aiAnalysis.score,
      summary: aiAnalysis.summary,
      issues: aiAnalysis.issues,
      recommendations: aiAnalysis.recommendations,
      keywordOpportunities: aiAnalysis.keywordOpportunities,
      localSeoTips: aiAnalysis.localSeoTips ?? [],
      backlinks: {
        total: backlinkData.totalBacklinks,
        referringDomains: backlinkData.referringDomains,
        domainAuthority: backlinkData.domainAuthority,
      },
      isMock: !isDataForSEOConfigured(),
      auditedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      return NextResponse.json(
        { error: `SEO audit blocked: ${error.reason}` },
        { status: 429 }
      );
    }
    logger.errorWithCause("SEO audit failed:", error);
    const aiError = handleAnthropicError(error);
    return NextResponse.json(
      { error: aiError.message, retryable: aiError.retryable },
      { status: aiError.status }
    );
  }
}
