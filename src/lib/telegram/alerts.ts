import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendTelegramMessage } from "@/lib/telegram";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_EMOJIS: Record<string, string> = {
  critical: "\u{1F534}",
  warning: "\u{1F7E1}",
  info: "\u{1F7E2}",
  revenue: "\u{1F4B0}",
  lead: "\u{1F3AF}",
  report: "\u{1F4CA}",
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format an alert with emoji prefix, bold title, and message body.
 */
export function formatAlert(
  level: string,
  title: string,
  message: string,
): string {
  const emoji = LEVEL_EMOJIS[level] || "\u{2139}\u{FE0F}";
  return `${emoji} *${title}*\n\n${message}`;
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

interface AlertPayload {
  level: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Route an alert to all subscribed TelegramConfig records. Fire-and-forget:
 * errors are logged, never thrown.
 */
export async function routeAlert(alert: AlertPayload): Promise<void> {
  try {
    const configs = await prisma.telegramConfig.findMany({
      where: { isActive: true },
    });

    const formatted = formatAlert(alert.level, alert.title, alert.message);

    for (const config of configs) {
      let levels: string[];
      try {
        levels = JSON.parse(config.alertLevels);
      } catch {
        logger.warn("[telegram/alerts] Invalid alertLevels JSON", {
          configId: config.id,
        });
        continue;
      }

      if (!levels.includes(alert.level)) continue;

      sendTelegramMessage(config.chatId, formatted, "Markdown").catch(
        (err) => {
          logger.errorWithCause(
            "[telegram/alerts] Alert delivery failed",
            err,
            { chatId: config.chatId },
          );
        },
      );
    }
  } catch (err) {
    logger.errorWithCause("[telegram/alerts] routeAlert error", err);
  }
}
