import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const updateAgencySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  customDomain: z.string().optional().or(z.literal("")).nullable(),
  starterPrice: z.number().int().min(0).optional(),
  growthPrice: z.number().int().min(0).optional(),
  empirePrice: z.number().int().min(0).optional(),
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

  const agency = await prisma.agency.findUnique({
    where: { id },
  });

  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  // Look up the owner account separately (Agency has no direct relation)
  const ownerAccount = await prisma.account.findUnique({
    where: { id: agency.ownerAccountId },
    select: { email: true, name: true },
  });

  return NextResponse.json({
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    ownerEmail: ownerAccount?.email ?? null,
    ownerName: ownerAccount?.name ?? null,
    logoUrl: agency.logoUrl,
    primaryColor: agency.primaryColor,
    accentColor: agency.accentColor,
    customDomain: agency.customDomain,
    starterPrice: agency.starterPrice,
    growthPrice: agency.growthPrice,
    empirePrice: agency.empirePrice,
    stripeAccountId: agency.stripeAccountId,
    totalMrr: 0,
    clients: [],
    createdAt: agency.createdAt.toISOString(),
  });
}

export async function PATCH(
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

  try {
    const body = await request.json();
    const parsed = updateAgencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.agency.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.name !== undefined) data.name = d.name;
    if (d.logoUrl !== undefined) data.logoUrl = d.logoUrl || null;
    if (d.primaryColor !== undefined) data.primaryColor = d.primaryColor;
    if (d.accentColor !== undefined) data.accentColor = d.accentColor;
    if (d.customDomain !== undefined) data.customDomain = d.customDomain || null;
    if (d.starterPrice !== undefined) data.starterPrice = d.starterPrice;
    if (d.growthPrice !== undefined) data.growthPrice = d.growthPrice;
    if (d.empirePrice !== undefined) data.empirePrice = d.empirePrice;

    const agency = await prisma.agency.update({ where: { id }, data });

    await logAudit({
      accountId,
      action: "update",
      resource: "agency",
      resourceId: id,
      metadata: { changes: Object.keys(data) },
    });

    return NextResponse.json({
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      logoUrl: agency.logoUrl,
      primaryColor: agency.primaryColor,
      accentColor: agency.accentColor,
      customDomain: agency.customDomain,
      starterPrice: agency.starterPrice,
      growthPrice: agency.growthPrice,
      empirePrice: agency.empirePrice,
    });
  } catch (error) {
    console.error("[api/admin/agencies/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
