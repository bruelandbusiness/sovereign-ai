import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SAI-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * GET /api/dashboard/referrals
 *
 * Returns the client's referral stats, their unique referral code
 * (auto-generated if none exists), and the list of referral records.
 */
export async function GET() {
  try {
    const { clientId } = await requireClient();

    // Ensure the client has at least one referral code (their "primary" code)
    let referralCodes = await prisma.referralCode.findMany({
      where: { clientId, referredClientId: null, status: "active" },
      orderBy: { createdAt: "asc" },
      take: 1,
      select: {
        id: true,
        code: true,
        status: true,
        creditCents: true,
        referredClientId: true,
        createdAt: true,
      },
    });

    if (referralCodes.length === 0) {
      // Generate a unique primary code for this client
      let code = generateCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.referralCode.findUnique({ where: { code } });
        if (!existing) break;
        code = generateCode();
        attempts++;
      }
      const newCode = await prisma.referralCode.create({
        data: { clientId, code },
      });
      referralCodes = [newCode];
    }

    const primaryCode = referralCodes[0].code;

    // Fetch all referral records for this client (both the primary code and invitation-specific codes)
    const allReferrals = await prisma.referralCode.findMany({
      where: { clientId },
      include: {
        referredClient: {
          select: { businessName: true, ownerName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Compute stats
    const totalSent = allReferrals.filter(
      (r) => r.status !== "active" || r.referredClientId
    ).length;
    const converted = allReferrals.filter(
      (r) => r.status === "credited" && r.referredClientId
    ).length;
    const totalCreditsCents = allReferrals.reduce(
      (sum, r) => sum + r.creditCents,
      0
    );
    // For now, credits used = 0 (no redemption system yet)
    const creditsUsedCents = 0;

    const referralLink = `https://trysovereignai.com/ref/${primaryCode}`;

    return NextResponse.json({
      referralCode: primaryCode,
      referralLink,
      stats: {
        totalSent,
        converted,
        totalCreditsCents,
        creditsUsedCents,
        creditsAvailableCents: totalCreditsCents - creditsUsedCents,
      },
      referrals: allReferrals.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.referredClientId
          ? r.status === "credited"
            ? "converted"
            : "signed_up"
          : "pending",
        creditCents: r.creditCents,
        referredBusiness: r.referredClient?.businessName ?? null,
        referredName: r.referredClient?.ownerName ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    Sentry.captureException(error);
    logger.errorWithCause("[referrals] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/referrals
 *
 * Generate a new referral code for the authenticated client.
 */
export async function POST() {
  try {
    const { clientId } = await requireClient();

    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.referralCode.findUnique({ where: { code } });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const referral = await prisma.referralCode.create({
      data: { clientId, code },
    });

    return NextResponse.json({
      id: referral.id,
      code: referral.code,
      status: referral.status,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    Sentry.captureException(error);
    logger.errorWithCause("[referrals] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }
}
