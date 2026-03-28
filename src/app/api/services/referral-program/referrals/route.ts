import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClient, AuthError } from "@/lib/require-client";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// GET: List all referrals for the client
export async function GET() {
  try {
    const { clientId } = await requireClient();

    const referrals = await prisma.customerReferral.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        client: { select: { businessName: true } },
      },
    });

    return NextResponse.json({ referrals });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logger.errorWithCause("[referral-program/referrals] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}
