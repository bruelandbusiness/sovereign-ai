import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(["lead.created", "booking.confirmed", "review.received"])).min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id, clientId } });
    if (!existing) {
      return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.url !== undefined) data.url = parsed.data.url;
    if (parsed.data.events !== undefined) data.events = parsed.data.events;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

    const endpoint = await prisma.webhookEndpoint.update({ where: { id }, data });

    return NextResponse.json({
      id: endpoint.id,
      url: endpoint.url,
      events: endpoint.events,
      isActive: endpoint.isActive,
    });
  } catch (error) {
    logger.errorWithCause("[api/dashboard/webhooks/[id]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const { id } = await params;

  try {
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id, clientId } });
    if (!existing) {
      return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
    }

    await prisma.webhookEndpoint.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause("[api/dashboard/webhooks/[id]] DELETE failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
