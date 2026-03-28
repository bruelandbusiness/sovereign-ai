import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { AuthError } from "@/lib/require-client";
import { logger } from "@/lib/logger";
import { isConfigured, sendTelegramMessage } from "@/lib/telegram";
import { z } from "zod";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const testSchema = z.object({
  chatId: z.string().min(1).max(100),
  message: z.string().max(4096).optional(),
});

// ---------------------------------------------------------------------------
// POST — Send a test message
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { chatId, message } = parsed.data;
    const text = message || "\u{1F9EA} Test message from Sovereign AI";

    const success = await sendTelegramMessage(chatId, text);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send test message" },
        { status: 502 },
      );
    }

    logger.info("[admin/telegram/test] Test message sent", { chatId });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.errorWithCause("[admin/telegram/test] POST error", err);
    return NextResponse.json(
      { error: "Failed to send test message" },
      { status: 500 },
    );
  }
}
