import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      account: { select: { email: true } },
      subscription: true,
      services: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          serviceId: true,
          status: true,
          activatedAt: true,
          createdAt: true,
        },
      },
      leads: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          createdAt: true,
        },
      },
      activities: {
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          createdAt: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({
    client: {
      id: client.id,
      businessName: client.businessName,
      ownerName: client.ownerName,
      phone: client.phone,
      city: client.city,
      state: client.state,
      vertical: client.vertical,
      website: client.website,
      createdAt: client.createdAt,
      email: client.account.email,
      subscription: client.subscription
        ? {
            id: client.subscription.id,
            bundleId: client.subscription.bundleId,
            monthlyAmount: client.subscription.monthlyAmount,
            status: client.subscription.status,
            stripeSubId: client.subscription.stripeSubId,
            stripeCustId: client.subscription.stripeCustId,
            currentPeriodEnd: client.subscription.currentPeriodEnd,
            createdAt: client.subscription.createdAt,
          }
        : null,
      services: client.services,
      leads: client.leads,
      activities: client.activities,
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.account.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    "businessName",
    "ownerName",
    "phone",
    "city",
    "state",
    "vertical",
    "website",
    "serviceAreaRadius",
  ];

  const updateData: Record<string, string> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const updated = await prisma.client.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ client: updated });
}
