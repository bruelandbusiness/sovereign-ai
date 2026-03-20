import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SAI-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const referrals = await prisma.referralCode.findMany({
      where: { clientId },
      include: {
        referredClient: { select: { businessName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const totalCredits = referrals.reduce((sum, r) => sum + r.creditCents, 0);
    const totalReferred = referrals.filter((r) => r.referredClientId).length;

    return NextResponse.json({
      referrals: referrals.map((r) => ({
        id: r.id,
        code: r.code,
        status: r.status,
        creditCents: r.creditCents,
        referredBusiness: r.referredClient?.businessName ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      totalCredits,
      totalReferred,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[referrals] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const { clientId } = await requireClient();

    // Generate unique code with retry
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
        { status: error.status },
      );
    console.error("[referrals] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create referral code" },
      { status: 500 }
    );
  }
}
