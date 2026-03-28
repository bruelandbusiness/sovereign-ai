import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api/followup/sequences]";

// ---------------------------------------------------------------------------
// GET — list follow-up sequences for the authenticated client
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { clientId } = await requireClient();

    const sequences = await prisma.followUpSequence.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        triggerType: true,
        steps: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = NextResponse.json(sequences);
    response.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=30");
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} GET failed`, error);
    return NextResponse.json(
      { error: "Failed to fetch sequences" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — create a new follow-up sequence
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: z.string().min(1).max(200),
  triggerType: z.string().min(1).max(100),
  steps: z.string().min(2), // JSON array string
});

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await requireClient();

    const raw = await request.json();
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Validate that steps is valid JSON array
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

    const sequence = await prisma.followUpSequence.create({
      data: {
        clientId,
        name: parsed.data.name,
        triggerType: parsed.data.triggerType,
        steps: parsed.data.steps,
      },
    });

    logger.info(`${TAG} Created sequence ${sequence.id}`, {
      clientId,
      triggerType: parsed.data.triggerType,
    });

    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} POST failed`, error);
    return NextResponse.json(
      { error: "Failed to create sequence" },
      { status: 500 },
    );
  }
}
