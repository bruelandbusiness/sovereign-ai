import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// NOTE: This route intentionally uses getSession() instead of requireClient()
// because users with canceled/expired subscriptions must be able to view their
// subscription status (to see what they had and potentially reactivate).

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.account.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.account.client.id;

    const [subscription, activeServiceCount] = await Promise.all([
      prisma.subscription.findUnique({
        where: { clientId },
        select: {
          bundleId: true,
          monthlyAmount: true,
          status: true,
        },
      }),
      prisma.clientService.count({
        where: { clientId, status: "active" },
      }),
    ]);

    if (!subscription) {
      return NextResponse.json(null);
    }

    const response = NextResponse.json({
      bundleId: subscription.bundleId,
      bundleName: subscription.bundleId
        ? subscription.bundleId.charAt(0).toUpperCase() +
          subscription.bundleId.slice(1)
        : "Custom",
      monthlyAmount: subscription.monthlyAmount / 100, // cents to dollars
      activeServiceCount,
      status: subscription.status,
    });
    response.headers.set("Cache-Control", "private, max-age=60");
    return response;
  } catch (error) {
    logger.errorWithCause("[subscription] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
