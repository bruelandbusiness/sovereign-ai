import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram";
import { handleCommand } from "@/lib/telegram/commands";
import { z } from "zod";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// In-memory rate limiter: 60 requests per hour per chatId
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(chatId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(chatId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(chatId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ---------------------------------------------------------------------------
// POST — Telegram webhook
//
// SECURITY: Verify the request came from Telegram using the secret token.
// Telegram includes an X-Telegram-Bot-Api-Secret-Token header when a
// secret_token is set via setWebhook. This prevents unauthenticated actors
// from injecting fake updates.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Verify Telegram webhook secret — required in production to prevent
  // unauthenticated actors from injecting fake updates.
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      logger.error("[telegram/webhook] TELEGRAM_WEBHOOK_SECRET not configured in production");
      return NextResponse.json({ ok: true }); // Return 200 to avoid retries
    }
    // Allow in development without secret
  } else {
    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const telegramUpdateSchema = z.object({
    message: z.object({
      text: z.string().max(4096),
      chat: z.object({
        id: z.union([z.number(), z.string()]),
      }),
    }).optional(),
  });

  try {
    const body = await request.json();
    const parsed = telegramUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const messageText: string | undefined = parsed.data.message?.text;
    const chatId: string | undefined = parsed.data.message?.chat?.id?.toString();

    if (!chatId || !messageText) {
      // Not a text message update — acknowledge silently
      return NextResponse.json({ ok: true });
    }

    // Rate limit
    if (isRateLimited(chatId)) {
      logger.warn("[telegram/webhook] Rate limited", { chatId });
      return NextResponse.json({ ok: true });
    }

    // Parse command: "/status arg1 arg2" -> command="status", args="arg1 arg2"
    const trimmed = messageText.trim();
    if (!trimmed.startsWith("/")) {
      // Not a command — ignore
      return NextResponse.json({ ok: true });
    }

    const spaceIndex = trimmed.indexOf(" ");
    const rawCommand =
      spaceIndex === -1
        ? trimmed.slice(1)
        : trimmed.slice(1, spaceIndex);
    const args =
      spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1).trim();

    // Strip @botname suffix if present (e.g., "/status@MyBot")
    const command = rawCommand.split("@")[0].toLowerCase();

    const response = await handleCommand(chatId, command, args);

    // Send response back (fire-and-forget)
    sendTelegramMessage(chatId, response, "Markdown").catch((err) => {
      logger.errorWithCause(
        "[telegram/webhook] Failed to send response",
        err,
        { chatId },
      );
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.errorWithCause("[telegram/webhook] Error processing update", err);
    // Always return 200 to Telegram so it doesn't retry
    return NextResponse.json({ ok: true });
  }
}
