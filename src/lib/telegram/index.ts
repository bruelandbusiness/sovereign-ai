import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

const LEVEL_EMOJIS: Record<string, string> = {
  critical: "\u{1F534}",
  warning: "\u{1F7E1}",
  info: "\u{1F7E2}",
  revenue: "\u{1F4B0}",
  lead: "\u{1F3AF}",
  report: "\u{1F4CA}",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

/**
 * Returns true when the TELEGRAM_BOT_TOKEN environment variable is set.
 */
export function isConfigured(): boolean {
  return !!getBotToken();
}

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------

/**
 * Send a message to a Telegram chat. Returns true on success, false otherwise.
 * Fire-and-forget safe: never throws.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode?: "Markdown" | "HTML",
): Promise<boolean> {
  const token = getBotToken();
  if (!token) {
    logger.warn("[telegram] TELEGRAM_BOT_TOKEN not set - skipping message");
    return false;
  }

  const truncated =
    text.length > TELEGRAM_MAX_MESSAGE_LENGTH
      ? text.slice(0, TELEGRAM_MAX_MESSAGE_LENGTH - 3) + "..."
      : text;

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: truncated,
    };
    if (parseMode) {
      body.parse_mode = parseMode;
    }

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      logger.error("[telegram] sendMessage failed", {
        status: res.status,
        chatId,
        errorBody,
      });
      return false;
    }

    return true;
  } catch (err) {
    logger.errorWithCause("[telegram] sendMessage error", err, { chatId });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Alert broadcast
// ---------------------------------------------------------------------------

/**
 * Send an alert to all TelegramConfig records whose alertLevels include the
 * given level. Fire-and-forget: errors are logged, never thrown.
 */
export async function sendTelegramAlert(
  level: string,
  title: string,
  message: string,
): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[telegram] TELEGRAM_BOT_TOKEN not set - skipping alert");
    return;
  }

  try {
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true },
    });

    const emoji = LEVEL_EMOJIS[level] || "\u{2139}\u{FE0F}";
    const formatted = `${emoji} *${title}*\n\n${message}`;

    for (const config of configs) {
      try {
        const levels: string[] = JSON.parse(config.alertLevels);
        if (!levels.includes(level)) continue;
      } catch {
        logger.warn("[telegram] Invalid alertLevels JSON", {
          configId: config.id,
        });
        continue;
      }

      sendTelegramMessage(config.chatId, formatted, "Markdown").catch(
        (err) => {
          logger.errorWithCause("[telegram] Alert delivery failed", err, {
            chatId: config.chatId,
          });
        },
      );
    }
  } catch (err) {
    logger.errorWithCause("[telegram] sendTelegramAlert error", err);
  }
}
