import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { clientId: session.account.client.id },
  });

  if (!subscription) {
    return NextResponse.json(null);
  }

  const activeServiceCount = await prisma.clientService.count({
    where: { clientId: session.account.client.id, status: "active" },
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
}
