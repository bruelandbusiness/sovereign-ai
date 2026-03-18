import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.account.client.id;

  const referrals = await prisma.referralCode.findMany({
    where: { clientId },
    include: {
      referredClient: { select: { businessName: true } },
    },
    orderBy: { createdAt: "desc" },
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
}

export async function POST() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clientId = session.account.client.id;

  // Generate unique code
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
}
