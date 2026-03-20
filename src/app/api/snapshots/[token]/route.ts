import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

/**
 * GET /api/snapshots/[token] — Public endpoint: view a snapshot by share token.
 * Increments the viewCount on each access.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const forwarded = _request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "snapshots-get", 120);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;

  const snapshot = await prisma.snapshotReport.findUnique({
    where: { shareToken: token },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Increment view count (fire-and-forget)
  prisma.snapshotReport
    .update({
      where: { id: snapshot.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((err) => console.error("[snapshots] View count update failed:", err instanceof Error ? err.message : err));

  return NextResponse.json({
    businessName: snapshot.businessName,
    website: snapshot.website,
    phone: snapshot.phone,
    email: snapshot.email,
    vertical: snapshot.vertical,
    city: snapshot.city,
    state: snapshot.state,
    seoScore: snapshot.seoScore,
    reviewScore: snapshot.reviewScore,
    socialScore: snapshot.socialScore,
    websiteScore: snapshot.websiteScore,
    overallScore: snapshot.overallScore,
    findings: (() => { try { return JSON.parse(snapshot.findings); } catch { return []; } })(),
    recommendations: (() => { try { return JSON.parse(snapshot.recommendations); } catch { return []; } })(),
    estimatedRevenue: snapshot.estimatedRevenue,
    viewCount: snapshot.viewCount + 1,
    createdAt: snapshot.createdAt,
  });
}
