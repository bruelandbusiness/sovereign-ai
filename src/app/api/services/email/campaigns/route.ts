import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createCampaignSchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  subject: z.string().min(1, "subject is required").max(500),
  body: z.string().max(50000).optional(),
  type: z.string().max(50).optional(),
});

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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCampaignSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const reqBody = parsed.data;

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
