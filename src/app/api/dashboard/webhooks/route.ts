import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import crypto from "crypto";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VALID_EVENTS = [
  "lead.created",
  "booking.confirmed",
  "review.received",
];

const createWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z.array(z.enum(["lead.created", "booking.confirmed", "review.received"])).min(1, "Select at least one event"),
});

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      createdAt: true,
      logs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, success: true, statusCode: true },
      },
    },
  });

  return NextResponse.json(
    endpoints.map((ep) => ({
      id: ep.id,
      url: ep.url,
      events: ep.events,
      isActive: ep.isActive,
      lastTriggered: ep.logs[0]?.createdAt?.toISOString() || null,
      lastSuccess: ep.logs[0]?.success ?? null,
      lastStatusCode: ep.logs[0]?.statusCode ?? null,
      createdAt: ep.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const body = await request.json();
    const parsed = createWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { url, events } = parsed.data;

    // Generate a secret for signing
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        clientId,
        url,
        secret,
        events: JSON.stringify(events),
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        id: endpoint.id,
        url: endpoint.url,
        secret: endpoint.secret, // Only returned on creation
        events: endpoint.events,
        isActive: endpoint.isActive,
        createdAt: endpoint.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause("[api/dashboard/webhooks] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
