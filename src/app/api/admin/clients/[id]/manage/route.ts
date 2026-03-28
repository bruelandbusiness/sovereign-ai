import { NextRequest, NextResponse } from "next/server";
import { revokeAllSessions, revokeAllMagicLinks } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";
import { z } from "zod";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const manageClientUpdateSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  ownerName: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  vertical: z.string().max(100).optional().nullable(),
  website: z.string().url().max(500).optional().nullable().or(z.literal("")),
  serviceAreaRadius: z.string().max(50).optional().nullable(),
});

const manageClientActionSchema = z.object({
  action: z.enum(["impersonate", "deactivate", "reactivate"]),
});

// ---------------------------------------------------------------------------
// PUT — Update client details
// ---------------------------------------------------------------------------

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = manageClientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
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

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
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
      metadata: { changes: updateData },
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    logger.errorWithCause("[api/admin/clients/manage] PUT failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Client actions: impersonate, deactivate, reactivate
// ---------------------------------------------------------------------------

export async function POST(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const actionParsed = manageClientActionSchema.safeParse(body);
  if (!actionParsed.success) {
    return NextResponse.json(
      { error: "Invalid action. Must be one of: impersonate, deactivate, reactivate" },
      { status: 400 }
    );
  }
  const { action } = actionParsed.data;

  try {
  const client = await prisma.client.findUnique({
    where: { id },
    include: { account: true, subscription: true, services: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // --- Impersonate ---
  if (action === "impersonate") {
    // Create a short-lived magic link for the client's account
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.magicLink.create({
      data: {
        token,
        accountId: client.accountId,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicUrl = `${appUrl}/api/auth/verify?token=${token}`;

    await logAudit({
      accountId,
      action: "impersonate",
      resource: "client",
      resourceId: id,
      metadata: { clientEmail: client.account.email },
    });

    return NextResponse.json({ url: magicUrl });
  }

  // --- Deactivate ---
  if (action === "deactivate") {
    // Deactivate all services
    if (client.services.length > 0) {
      await prisma.clientService.updateMany({
        where: { clientId: id },
        data: { status: "canceled" },
      });
    }

    // Mark subscription as canceled
    if (client.subscription) {
      await prisma.subscription.update({
        where: { id: client.subscription.id },
        data: { status: "canceled" },
      });
    }

    // SECURITY: Immediately revoke all sessions and pending magic links
    // so the deactivated user is logged out everywhere right away.
    await revokeAllSessions(client.accountId);
    await revokeAllMagicLinks(client.accountId);

    await logAudit({
      accountId,
      action: "deactivate",
      resource: "client",
      resourceId: id,
      metadata: { clientEmail: client.account.email },
    });

    return NextResponse.json({ success: true, status: "deactivated" });
  }

  // --- Reactivate ---
  if (action === "reactivate") {
    // Reactivate services
    if (client.services.length > 0) {
      await prisma.clientService.updateMany({
        where: { clientId: id },
        data: { status: "active" },
      });
    }

    // Mark subscription as active
    if (client.subscription) {
      await prisma.subscription.update({
        where: { id: client.subscription.id },
        data: { status: "active" },
      });
    }

    await logAudit({
      accountId,
      action: "reactivate",
      resource: "client",
      resourceId: id,
      metadata: { clientEmail: client.account.email },
    });

    return NextResponse.json({ success: true, status: "reactivated" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.errorWithCause("[api/admin/clients/manage] POST failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
