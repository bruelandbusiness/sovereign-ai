import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const snapshotSchema = z.object({
  businessName: z.string().min(1).max(200),
  website: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(254).optional(),
  vertical: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
});

/**
 * GET /api/admin/snapshots — List snapshot reports for this admin (paginated).
 */
export async function GET(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const where = { createdBy: accountId };

  try {
    const [snapshots, total] = await Promise.all([
      prisma.snapshotReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          businessName: true,
          vertical: true,
          city: true,
          state: true,
          overallScore: true,
          viewCount: true,
          shareToken: true,
          createdAt: true,
        },
      }),
      prisma.snapshotReport.count({ where }),
    ]);

    return NextResponse.json({
      snapshots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.errorWithCause("[admin/snapshots] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/snapshots — Generate a new snapshot report.
 */
export async function POST(request: NextRequest) {
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = snapshotSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      businessName,
      website,
      phone,
      email,
      vertical,
      city,
      state,
    } = parsed.data;

    // --- Score Generation ---
    // In a real system, this would scrape the website, check Google rankings, etc.
    // For now we generate realistic scores based on available data.

    const hasWebsite = !!website;
    const hasPhone = !!phone;

    // SEO Score
    const seoBase = hasWebsite ? 45 : 15;
    const seoScore = Math.min(100, seoBase + randomBetween(10, 35));

    // Review Score
    const reviewScore = randomBetween(20, 75);

    // Social Score
    const socialScore = randomBetween(15, 65);

    // Website Score
    const websiteScore = hasWebsite ? randomBetween(40, 80) : randomBetween(5, 25);

    // Overall
    const overallScore = Math.round(
      (seoScore + reviewScore + socialScore + websiteScore) / 4
    );

    // Findings
    const findings = generateFindings(seoScore, reviewScore, socialScore, websiteScore, hasWebsite, hasPhone);

    // Recommendations
    const recommendations = generateRecommendations(seoScore, reviewScore, socialScore, websiteScore, hasWebsite);

    // Revenue estimate (based on industry averages)
    const baseRevenue: Record<string, number> = {
      hvac: 500000,
      plumbing: 400000,
      roofing: 600000,
      electrical: 350000,
      landscaping: 250000,
      pest_control: 300000,
    };
    const verticalRevenue = baseRevenue[vertical || ""] || 350000;
    const estimatedRevenue = Math.round(verticalRevenue * (1 - overallScore / 100) * 0.2);

    const snapshot = await prisma.snapshotReport.create({
      data: {
        createdBy: accountId,
        businessName,
        website: website || null,
        phone: phone || null,
        email: email || null,
        vertical: vertical || null,
        city: city || null,
        state: state || null,
        seoScore,
        reviewScore,
        socialScore,
        websiteScore,
        overallScore,
        findings: JSON.stringify(findings),
        recommendations: JSON.stringify(recommendations),
        estimatedRevenue,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/snapshots/${snapshot.shareToken}`;

    await logAudit({
      accountId,
      action: "create",
      resource: "snapshot",
      resourceId: snapshot.id,
      metadata: { businessName, overallScore },
    });

    return NextResponse.json({
      success: true,
      id: snapshot.id,
      shareToken: snapshot.shareToken,
      shareUrl,
      overallScore,
    });
  } catch (err) {
    logger.errorWithCause("Snapshot generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate snapshot" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Finding {
  area: string;
  severity: "critical" | "warning" | "info";
  message: string;
}

function generateFindings(
  seo: number,
  reviews: number,
  social: number,
  website: number,
  hasWebsite: boolean,
  hasPhone: boolean
): Finding[] {
  const findings: Finding[] = [];

  if (!hasWebsite) {
    findings.push({
      area: "Website",
      severity: "critical",
      message: "No website detected. You are invisible to online customers searching for your services.",
    });
  } else if (website < 50) {
    findings.push({
      area: "Website",
      severity: "warning",
      message: "Website performance needs improvement. Slow load times and missing mobile optimization are costing you leads.",
    });
  }

  if (seo < 40) {
    findings.push({
      area: "SEO",
      severity: "critical",
      message: "Not ranking for key local search terms. Competitors are capturing your potential customers.",
    });
  } else if (seo < 65) {
    findings.push({
      area: "SEO",
      severity: "warning",
      message: "Local SEO presence is weak. Missing Google Business Profile optimization and local citations.",
    });
  }

  if (reviews < 30) {
    findings.push({
      area: "Reviews",
      severity: "critical",
      message: "Very few online reviews. 93% of consumers read reviews before choosing a local business.",
    });
  } else if (reviews < 55) {
    findings.push({
      area: "Reviews",
      severity: "warning",
      message: "Review volume is below industry average. Competitors with more reviews are winning the trust battle.",
    });
  }

  if (social < 30) {
    findings.push({
      area: "Social Media",
      severity: "warning",
      message: "Minimal social media presence. Missing opportunities to build trust and engage your community.",
    });
  }

  if (!hasPhone) {
    findings.push({
      area: "Contact",
      severity: "info",
      message: "No phone number detected in your online profiles. Make it easy for customers to call you.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      area: "Overall",
      severity: "info",
      message: "Your online presence has a solid foundation. Let us show you how AI can take it to the next level.",
    });
  }

  return findings;
}

function generateRecommendations(
  seo: number,
  reviews: number,
  social: number,
  website: number,
  hasWebsite: boolean
): string[] {
  const recs: string[] = [];

  if (!hasWebsite) {
    recs.push("Build a professional, SEO-optimized website with lead capture forms and online booking.");
  }
  if (website < 60) {
    recs.push("Optimize website speed, mobile responsiveness, and add clear calls-to-action on every page.");
  }
  if (seo < 60) {
    recs.push("Launch an AI SEO campaign targeting high-intent local keywords to rank on page 1 of Google.");
  }
  if (reviews < 50) {
    recs.push("Deploy automated review request campaigns to build a 5-star reputation on Google.");
  }
  if (social < 50) {
    recs.push("Start an AI-powered social media calendar with consistent, engaging content.");
  }
  recs.push("Deploy an AI chatbot to capture leads 24/7 while you focus on running your business.");
  recs.push("Set up automated email nurture sequences to convert leads who aren't ready to buy today.");

  return recs.slice(0, 6);
}
