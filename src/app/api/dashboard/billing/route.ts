import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBundleById, getServiceById } from "@/lib/constants";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.account.client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.account.client.id;

    const subscription = await prisma.subscription.findUnique({
      where: { clientId },
      select: {
        bundleId: true,
        monthlyAmount: true,
        status: true,
        currentPeriodEnd: true,
        stripeCustId: true,
        isTrial: true,
        trialEndsAt: true,
      },
    });

    const services = await prisma.clientService.findMany({
      where: { clientId, status: "active" },
      select: {
        serviceId: true,
        status: true,
        activatedAt: true,
      },
      take: 100,
    });

    if (!subscription) {
      return NextResponse.json({
        plan: null,
        status: "none",
        monthlyAmount: 0,
        services: [],
      });
    }

    const bundle = subscription.bundleId
      ? getBundleById(subscription.bundleId)
      : null;

    const serviceDetails = services.map((s) => {
      const info = getServiceById(s.serviceId);
      return {
        id: s.serviceId,
        name: info?.name || s.serviceId,
        status: s.status,
        activatedAt: s.activatedAt,
      };
    });

    return NextResponse.json({
      plan: bundle
        ? { id: bundle.id, name: bundle.name, price: bundle.price }
        : { id: "custom", name: "Custom Plan", price: subscription.monthlyAmount / 100 },
      status: subscription.isTrial ? "trialing" : subscription.status,
      monthlyAmount: subscription.monthlyAmount / 100,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEndsAt,
      hasStripeCustomer: !!subscription.stripeCustId,
      services: serviceDetails,
    });
  } catch (error) {
    logger.errorWithCause("[billing] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 },
    );
  }
}
