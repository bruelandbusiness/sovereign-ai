import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBundleById, getServiceById } from "@/lib/constants";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const subscription = await prisma.subscription.findUnique({
    where: { clientId },
  });

  const services = await prisma.clientService.findMany({
    where: { clientId, status: "active" },
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
    status: subscription.status,
    monthlyAmount: subscription.monthlyAmount / 100,
    currentPeriodEnd: subscription.currentPeriodEnd,
    stripeCustId: subscription.stripeCustId,
    services: serviceDetails,
  });
}
