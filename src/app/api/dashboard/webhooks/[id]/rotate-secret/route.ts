import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, clientId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook endpoint not found" },
        { status: 404 },
      );
    }

    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

    await prisma.webhookEndpoint.update({
      where: { id },
      data: { secret },
    });

    return NextResponse.json({ secret });
  } catch (error) {
    Sentry.captureException(error);
    logger.errorWithCause(
      "[api/dashboard/webhooks/[id]/rotate-secret] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
