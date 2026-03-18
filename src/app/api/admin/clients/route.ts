import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";

  const where = search
    ? {
        OR: [
          { businessName: { contains: search } },
          { ownerName: { contains: search } },
          { account: { email: { contains: search } } },
        ],
      }
    : {};

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      account: { select: { email: true } },
      subscription: {
        select: { bundleId: true, monthlyAmount: true, status: true },
      },
      _count: {
        select: { services: true },
      },
    },
  });

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      businessName: c.businessName,
      ownerName: c.ownerName,
      email: c.account.email,
      createdAt: c.createdAt,
      subscription: c.subscription
        ? {
            bundleId: c.subscription.bundleId,
            monthlyAmount: c.subscription.monthlyAmount,
            status: c.subscription.status,
          }
        : null,
      servicesCount: c._count.services,
    })),
  });
}
