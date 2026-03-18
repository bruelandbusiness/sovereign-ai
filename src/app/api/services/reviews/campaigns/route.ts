import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const campaigns = await prisma.reviewCampaign.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      customerName: c.customerName,
      customerEmail: c.customerEmail,
      customerPhone: c.customerPhone,
      status: c.status,
      reviewUrl: c.reviewUrl,
      sentAt: c.sentAt?.toISOString() || null,
      remindedAt: c.remindedAt?.toISOString() || null,
      completedAt: c.completedAt?.toISOString() || null,
      rating: c.rating,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, reviewUrl } = body;

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: "customerName and customerEmail are required" },
        { status: 400 }
      );
    }

    const clientId = session.account.client.id;

    const campaign = await prisma.reviewCampaign.create({
      data: {
        clientId,
        name: `Review request for ${customerName}`,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        reviewUrl: reviewUrl || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      customerName: campaign.customerName,
      customerEmail: campaign.customerEmail,
      customerPhone: campaign.customerPhone,
      status: campaign.status,
      reviewUrl: campaign.reviewUrl,
      sentAt: null,
      remindedAt: null,
      completedAt: null,
      rating: null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create review campaign" },
      { status: 500 }
    );
  }
}
