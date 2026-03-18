import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  const campaigns = await prisma.emailCampaign.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      body: c.body,
      type: c.type,
      status: c.status,
      recipients: c.recipients,
      opens: c.opens,
      clicks: c.clicks,
      sentAt: c.sentAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = session.account.client.id;

  let reqBody: { name?: string; subject?: string; body?: string; type?: string };
  try {
    reqBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!reqBody.name || !reqBody.subject) {
    return NextResponse.json(
      { error: "name and subject are required" },
      { status: 400 }
    );
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      clientId,
      name: reqBody.name,
      subject: reqBody.subject,
      body: reqBody.body || "",
      type: reqBody.type || "broadcast",
      status: "draft",
    },
  });

  return NextResponse.json(
    {
      id: campaign.id,
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
      type: campaign.type,
      status: campaign.status,
      recipients: campaign.recipients,
      opens: campaign.opens,
      clicks: campaign.clicks,
      sentAt: campaign.sentAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
