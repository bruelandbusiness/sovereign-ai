import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { rateLimitByIP } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
/**
 * GET /api/affiliates — Get authenticated affiliate's dashboard data.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliate = await prisma.affiliatePartner.findUnique({
      where: { accountId: session.account.id },
      include: {
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            client: { select: { businessName: true } },
          },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Not an affiliate partner" }, { status: 403 });
    }

    const activeReferrals = affiliate.referrals.filter((r) => r.status === "paying").length;
    const totalReferrals = affiliate.referrals.length;
    const monthlyRecurring = affiliate.referrals
      .filter((r) => r.status === "paying")
      .reduce((sum, r) => sum + Math.round((r.monthlyAmount * affiliate.commissionRate) / 100), 0);

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        slug: affiliate.slug,
        tier: affiliate.tier,
        commissionRate: affiliate.commissionRate,
        status: affiliate.status,
      },
      stats: {
        totalReferrals,
        activeReferrals,
        totalEarned: affiliate.totalEarned,
        totalPaid: affiliate.totalPaid,
        pendingPayout: affiliate.totalEarned - affiliate.totalPaid,
        monthlyRecurring,
      },
      referrals: affiliate.referrals.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.status,
        businessName: r.client?.businessName || null,
        monthlyAmount: r.monthlyAmount,
        commission: Math.round((r.monthlyAmount * affiliate.commissionRate) / 100),
        totalEarned: r.totalEarned,
        createdAt: r.createdAt.toISOString(),
        convertedAt: r.convertedAt?.toISOString() || null,
      })),
      payouts: affiliate.payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        periodStart: p.periodStart.toISOString(),
        periodEnd: p.periodEnd.toISOString(),
        paidAt: p.paidAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    logger.errorWithCause("[api/affiliates] GET failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const signupSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  company: z.string().max(200).optional(),
  website: z.string().max(500).optional(),
});

/**
 * POST /api/affiliates — Apply to become an affiliate partner.
 */
export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimitByIP(ip, "affiliate-signup", 5);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, company, website } = parsed.data;

    // Check if affiliate already exists
    const existing = await prisma.affiliatePartner.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An affiliate account with this email already exists" },
        { status: 409 }
      );
    }

    // Create account + affiliate partner
    const account = await prisma.account.create({
      data: { email, name, role: "client" },
    });

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    // Generate unique referral code
    const code = `AFF-${slug.toUpperCase().slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const affiliate = await prisma.affiliatePartner.create({
      data: {
        accountId: account.id,
        name,
        email,
        company: company || null,
        website: website || null,
        slug: `${slug}-${account.id.slice(0, 6)}`,
        commissionRate: 30, // 30% recurring
        status: "pending",
      },
    });

    // Create their first referral link
    await prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliate.id,
        code,
      },
    });

    return NextResponse.json(
      {
        success: true,
        affiliate: {
          id: affiliate.id,
          slug: affiliate.slug,
          referralCode: code,
          status: "pending",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.errorWithCause("[api/affiliates] POST failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
