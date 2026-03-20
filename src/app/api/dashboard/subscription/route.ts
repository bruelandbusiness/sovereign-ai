import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const subscription = await prisma.subscription.findUnique({
      where: { clientId },
    });

    if (!subscription) {
      return NextResponse.json(null);
    }

    const activeServiceCount = await prisma.clientService.count({
      where: { clientId, status: "active" },
    });

    return NextResponse.json({
      bundleId: subscription.bundleId,
      bundleName: subscription.bundleId
        ? subscription.bundleId.charAt(0).toUpperCase() +
          subscription.bundleId.slice(1)
        : "Custom",
      monthlyAmount: subscription.monthlyAmount / 100, // cents to dollars
      activeServiceCount,
      status: subscription.status,
    });
  } catch (error) {
    console.error("[subscription] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
