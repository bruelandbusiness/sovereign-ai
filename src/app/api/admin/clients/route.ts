import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const clientCreateSchema = z.object({
  email: z.string().email().max(255),
  businessName: z.string().min(1).max(200),
  ownerName: z.string().min(1).max(200),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  vertical: z.string().max(100).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal("")),
  serviceAreaRadius: z.string().max(50).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
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

  try {
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
      take: 500,
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
  } catch (error) {
    logger.errorWithCause("[admin/clients] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = clientCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, businessName, ownerName, phone, city, state, vertical, website, serviceAreaRadius } =
    parsed.data;

  try {
    // Check if account already exists
    const existingAccount = await prisma.account.findUnique({ where: { email } });
    if (existingAccount) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create account and client in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: { email, name: ownerName, role: "client" },
      });

      const client = await tx.client.create({
        data: {
          accountId: account.id,
          businessName,
          ownerName,
          phone: phone || null,
          city: city || null,
          state: state || null,
          vertical: vertical || null,
          website: website || null,
          serviceAreaRadius: serviceAreaRadius || null,
        },
      });

      return { account, client };
    });

    await logAudit({
      accountId,
      action: "create",
      resource: "client",
      resourceId: result.client.id,
      metadata: { email, businessName },
    });

    return NextResponse.json(
      {
        client: {
          id: result.client.id,
          businessName: result.client.businessName,
          ownerName: result.client.ownerName,
          email: result.account.email,
          createdAt: result.client.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.errorWithCause("[admin/clients] POST failed", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
