import {
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
} from "@sentry/core";
import type { SeverityLevel } from "@sentry/core";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendTelegramAlert } from "@/lib/telegram";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ErrorSeverity = "info" | "warn" | "error" | "critical";

export interface ErrorContext {
  /** The request URL or route that triggered the error */
  url?: string;
  /** The user agent string */
  userAgent?: string;
  /** Authenticated account id, if available */
  accountId?: string;
  /** Authenticated user id (alias for accountId in some flows) */
  userId?: string;
  /** The route path (e.g. /dashboard/billing) */
  route?: string;
  /** HTTP method (GET, POST, etc.) */
  method?: string;
  /** The action being performed when the error happened */
  action?: string;
  /** The component or module that threw */
  source?: string;
  /** Arbitrary key-value pairs for debugging */
  extra?: Record<string, unknown>;
}

interface StoredErrorDetail {
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  source?: string;
  accountId?: string;
  userId?: string;
  route?: string;
  method?: string;
  action?: string;
  extra?: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------

const isDevelopment = process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

function extractStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

/**
 * Build a fingerprint for grouping duplicate errors.
 * Uses the first line of the stack trace (or the message) so that
 * identical errors in the same location are grouped together.
 */
function fingerprint(message: string, stack?: string): string {
  if (stack) {
    // Use first two non-empty stack lines for grouping
    const lines = stack.split("\n").filter((l) => l.trim());
    const key = lines.slice(0, 2).join("|");
    return key;
  }
  return message;
}

/**
 * Build a structured detail object from the error and context.
 */
function buildDetail(
  severity: ErrorSeverity,
  message: string,
  stack: string | undefined,
  context?: ErrorContext,
): StoredErrorDetail {
  return {
    severity,
    message,
    stack,
    url: context?.url,
    userAgent: context?.userAgent,
    source: context?.source,
    accountId: context?.accountId ?? context?.userId,
    userId: context?.userId ?? context?.accountId,
    route: context?.route,
    method: context?.method,
    action: context?.action,
    extra: context?.extra,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log to console with structured detail in development.
 */
function devLog(severity: ErrorSeverity, message: string, detail: StoredErrorDetail): void {
  if (!isDevelopment) return;

  const prefix = `[error-logger:${severity}]`;
  const contextStr = [
    detail.method && `method=${detail.method}`,
    detail.route && `route=${detail.route}`,
    detail.action && `action=${detail.action}`,
    detail.userId && `userId=${detail.userId}`,
    detail.source && `source=${detail.source}`,
  ]
    .filter(Boolean)
    .join(" ");

  const fullMessage = contextStr ? `${prefix} ${message} (${contextStr})` : `${prefix} ${message}`;

  switch (severity) {
    case "info":
      logger.info(fullMessage);
      break;
    case "warn":
      logger.warn(fullMessage);
      break;
    case "error":
      logger.error(fullMessage);
      if (detail.stack) logger.error(detail.stack);
      break;
    case "critical":
      logger.error(`${prefix} *** CRITICAL *** ${message}${contextStr ? ` (${contextStr})` : ""}`);
      if (detail.stack) logger.error(detail.stack);
      break;
  }
}

/**
 * Persist the error detail to the AuditLog table.
 */
async function persistToAuditLog(
  detail: StoredErrorDetail,
  message: string,
  stack?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        accountId: detail.accountId ?? null,
        action: "error_captured",
        resource: "monitoring",
        resourceId: fingerprint(message, stack),
        metadata: JSON.stringify(detail),
      },
    });
  } catch (dbErr) {
    logger.errorWithCause(
      "[monitoring] Failed to persist error to AuditLog",
      dbErr,
    );
  }
}

/**
 * Send a Telegram alert for critical and error severity.
 */
async function sendAlert(
  severity: ErrorSeverity,
  message: string,
  stack: string | undefined,
  context?: ErrorContext,
): Promise<void> {
  if (severity !== "critical" && severity !== "error") return;

  const telegramBody = [
    `Severity: ${severity.toUpperCase()}`,
    `Source: ${context?.source ?? "unknown"}`,
    context?.route && `Route: ${context.route}`,
    context?.action && `Action: ${context.action}`,
    context?.userId && `User: ${context.userId}`,
    `URL: ${context?.url ?? "n/a"}`,
    `Message: ${message}`,
    stack
      ? `Stack (first 500 chars):\n\`\`\`\n${stack.slice(0, 500)}\n\`\`\``
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  sendTelegramAlert("critical", "Error Monitor", telegramBody).catch(
    (err) => {
      logger.errorWithCause("[monitoring] Telegram alert failed", err);
    },
  );
}

// ---------------------------------------------------------------------------
// Core: captureError
// ---------------------------------------------------------------------------

/**
 * Capture an error and persist it to the AuditLog table.
 *
 * - In development: logs full detail to console (message, stack, context).
 * - In production: stores to AuditLog table with full context.
 * - Sends Telegram alert for critical-severity errors.
 * - Never throws: failures are logged to console and swallowed so callers
 *   are not interrupted by monitoring infrastructure issues.
 */
export async function captureError(
  error: unknown,
  context?: ErrorContext & { severity?: ErrorSeverity },
): Promise<void> {
  const severity = context?.severity ?? "error";
  const message = extractMessage(error);
  const stack = extractStack(error);

  const detail = buildDetail(severity, message, stack, context);

  // Always log to structured logger
  logger.error(`[monitoring] ${message}`, {
    severity,
    source: context?.source,
    url: context?.url,
    route: context?.route,
    method: context?.method,
    action: context?.action,
    userId: context?.userId ?? context?.accountId,
  });

  // Forward to Sentry with structured tags for filtering
  try {
    const sentryError = error instanceof Error ? error : new Error(message);
    sentryCaptureException(sentryError, {
      level: (severity === "critical" ? "fatal" : severity === "warn" ? "warning" : severity) as SeverityLevel,
      tags: {
        source: context?.source ?? "unknown",
        action: context?.action ?? "unknown",
        severity,
        ...(context?.route ? { route: context.route } : {}),
        ...(context?.method ? { method: context.method } : {}),
      },
      extra: {
        url: context?.url,
        accountId: context?.accountId ?? context?.userId,
        ...context?.extra,
      },
    });
  } catch {
    // Never let Sentry failures interrupt monitoring
  }

  // Detailed dev console logging
  devLog(severity, message, detail);

  // Persist to database in all environments (fire-and-forget-safe)
  await persistToAuditLog(detail, message, stack);

  // Send Telegram alert for critical errors
  await sendAlert(severity, message, stack, context);
}

// ---------------------------------------------------------------------------
// Core: captureMessage
// ---------------------------------------------------------------------------

/**
 * Capture a freeform monitoring message (info, warn, error, critical).
 * Lighter-weight than captureError when you do not have an Error object.
 */
export async function captureMessage(
  message: string,
  level: ErrorSeverity = "info",
  context?: ErrorContext,
): Promise<void> {
  const detail = buildDetail(level, message, undefined, context);

  // Structured console log at matching level
  const logFn =
    level === "info"
      ? logger.info.bind(logger)
      : level === "warn"
        ? logger.warn.bind(logger)
        : logger.error.bind(logger);

  logFn(`[monitoring] ${message}`, {
    severity: level,
    source: context?.source,
    route: context?.route,
    action: context?.action,
    userId: context?.userId ?? context?.accountId,
  });

  // Forward to Sentry
  try {
    sentryCaptureMessage(message, {
      level: (level === "critical" ? "fatal" : level === "warn" ? "warning" : level) as SeverityLevel,
      tags: {
        source: context?.source ?? "unknown",
        action: context?.action ?? "unknown",
        ...(context?.route ? { route: context.route } : {}),
      },
      extra: {
        url: context?.url,
        accountId: context?.accountId ?? context?.userId,
        ...context?.extra,
      },
    });
  } catch {
    // Never let Sentry failures interrupt monitoring
  }

  // Detailed dev console logging
  devLog(level, message, detail);

  // Persist
  await persistToAuditLog(detail, message);

  // Telegram for critical
  await sendAlert(level, message, undefined, context);
}
