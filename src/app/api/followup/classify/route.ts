import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { requireClient, AuthError } from "@/lib/require-client";
import { classifyReply } from "@/lib/followup/reply-classifier";

export const dynamic = "force-dynamic";
const TAG = "[api/followup/classify]";

// ---------------------------------------------------------------------------
// POST — manually classify a reply text
// ---------------------------------------------------------------------------

const classifySchema = z.object({
  replyText: z.string().min(1).max(5000),
  context: z
    .object({
      vertical: z.string().optional(),
      contactName: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireClient();

    const raw = await request.json();
    const parsed = classifySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const classification = await classifyReply(
      parsed.data.replyText,
      parsed.data.context,
    );

    return NextResponse.json(classification);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.errorWithCause(`${TAG} POST failed`, error);
    return NextResponse.json(
      { error: "Failed to classify reply" },
      { status: 500 },
    );
  }
}
