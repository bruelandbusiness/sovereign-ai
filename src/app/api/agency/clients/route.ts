import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find agency owned by this account
  const agency = await prisma.agency.findFirst({
    where: { ownerAccountId: session.account.id },
  });

  if (!agency) {
    return NextResponse.json({ error: "No agency found for this account" }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    where: { agencyId: agency.id },
    orderBy: { createdAt: "desc" },
    include: {
      account: { select: { email: true } },
      subscription: {
        select: { bundleId: true, monthlyAmount: true, status: true, isTrial: true },
      },
      _count: { select: { leads: true, bookings: true } },
    },
  });

  const totalMrr = clients.reduce(
    (sum, c) => sum + (c.subscription?.monthlyAmount || 0),
    0
  );

  return NextResponse.json({
    agency: {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      primaryColor: agency.primaryColor,
      accentColor: agency.accentColor,
      logoUrl: agency.logoUrl,
    },
    totalMrr,
    clients: clients.map((c) => ({
      id: c.id,
      businessName: c.businessName,
      ownerName: c.ownerName,
      email: c.account.email,
      subscription: c.subscription
        ? {
            bundleId: c.subscription.bundleId,
            monthlyAmount: c.subscription.monthlyAmount,
            status: c.subscription.status,
            isTrial: c.subscription.isTrial,
          }
        : null,
      leadsCount: c._count.leads,
      bookingsCount: c._count.bookings,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
