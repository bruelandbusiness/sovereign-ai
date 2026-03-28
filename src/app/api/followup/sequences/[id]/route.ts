import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api/followup/sequences/[id]]";

// ---------------------------------------------------------------------------
// PUT — update a follow-up sequence
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  triggerType: z.string().min(1).max(100).optional(),
  steps: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.followUpSequence.findFirst({
      where: { id, clientId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 },
      );
    }

    const raw = await request.json();
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Validate steps JSON if provided
    if (parsed.data.steps) {
      try {
        const stepsArray = JSON.parse(parsed.data.steps);
        if (!Array.isArray(stepsArray)) {
          return NextResponse.json(
            { error: "Steps must be a JSON array" },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Steps must be valid JSON" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.followUpSequence.update({
      where: { id },
      data: parsed.data,
    });

    logger.info(`${TAG} Updated sequence ${id}`, { clientId });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} PUT failed`, error);
    return NextResponse.json(
      { error: "Failed to update sequence" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — deactivate a follow-up sequence (soft delete)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { clientId } = await requireClient();
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.followUpSequence.findFirst({
      where: { id, clientId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Sequence not found" },
        { status: 404 },
      );
    }

    await prisma.followUpSequence.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`${TAG} Deactivated sequence ${id}`, { clientId });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} DELETE failed`, error);
    return NextResponse.json(
      { error: "Failed to deactivate sequence" },
      { status: 500 },
    );
  }
}
