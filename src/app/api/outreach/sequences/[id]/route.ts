import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api-outreach-sequences]";

// ---------------------------------------------------------------------------
// PUT — Update a sequence
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  channel: z.enum(["email", "sms", "multi"]).optional(),
  steps: z
    .array(
      z.object({
        dayOffset: z.number().int().min(0),
        channel: z.enum(["email", "sms"]),
        templateKey: z.string().min(1),
        subject: z.string().optional(),
      })
    )
    .min(1)
    .optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: Request,
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.outreachSequence.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!existing || existing.clientId !== clientId) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.channel !== undefined) data.channel = parsed.data.channel;
    if (parsed.data.steps !== undefined) data.steps = JSON.stringify(parsed.data.steps);
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

    const sequence = await prisma.outreachSequence.update({
      where: { id },
      data,
    });

    logger.info(`${TAG} Updated sequence ${id}`, { clientId });

    return NextResponse.json({ sequence });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to update sequence ${id}`, error);
    return NextResponse.json(
      { error: "Failed to update sequence" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — Deactivate a sequence (soft delete)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: Request,
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
    // Verify ownership
    const existing = await prisma.outreachSequence.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!existing || existing.clientId !== clientId) {
      return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
    }

    await prisma.outreachSequence.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`${TAG} Deactivated sequence ${id}`, { clientId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to deactivate sequence ${id}`, error);
    return NextResponse.json(
      { error: "Failed to deactivate sequence" },
      { status: 500 }
    );
  }
}
