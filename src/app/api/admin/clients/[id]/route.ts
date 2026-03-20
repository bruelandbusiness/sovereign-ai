import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const clientUpdateSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  ownerName: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  vertical: z.string().max(100).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal("")),
  serviceAreaRadius: z.string().max(50).optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
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
  let accountId: string;
  try {
    const admin = await requireAdmin();
    accountId = admin.accountId;
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { id } = await params;
  const body = await request.json();

  const parsed = clientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Only include fields that were actually provided
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      updateData[key] = value;
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

  await logAudit({
    accountId,
    action: "update",
    resource: "client",
    resourceId: id,
    metadata: { changes: Object.keys(updateData) },
  });

  return NextResponse.json({ client: updated });
}
