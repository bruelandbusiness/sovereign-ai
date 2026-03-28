import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";

export const dynamic = "force-dynamic";
const TAG = "[api-outreach-sequences]";

// ---------------------------------------------------------------------------
// GET — List sequences for authenticated client
// ---------------------------------------------------------------------------

export async function GET() {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const sequences = await prisma.outreachSequence.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sequences });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to list sequences`, error);
    return NextResponse.json(
      { error: "Failed to list sequences" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Create a new sequence
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: z.string().min(1).max(200),
  channel: z.enum(["email", "sms", "multi"]),
  steps: z.array(
    z.object({
      dayOffset: z.number().int().min(0),
      channel: z.enum(["email", "sms"]),
      templateKey: z.string().min(1),
      subject: z.string().optional(),
    })
  ).min(1),
});

export async function POST(request: Request) {
  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, channel, steps } = parsed.data;

    const sequence = await prisma.outreachSequence.create({
      data: {
        clientId,
        name,
        channel,
        steps: JSON.stringify(steps),
      },
    });

    logger.info(`${TAG} Created sequence ${sequence.id}`, { clientId, name });

    return NextResponse.json({ sequence }, { status: 201 });
  } catch (error) {
    logger.errorWithCause(`${TAG} Failed to create sequence`, error);
    return NextResponse.json(
      { error: "Failed to create sequence" },
      { status: 500 }
    );
  }
}
