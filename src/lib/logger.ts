type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// PII / sensitive data redaction
// ---------------------------------------------------------------------------

/** Keys whose values must always be fully redacted. */
const REDACT_KEYS = new Set([
  "password",
  "secret",
  "apiKey",
  "api_key",
  "token",
  "authorization",
  "cookie",
  "ssn",
  "creditCard",
  "credit_card",
  "cardNumber",
  "card_number",
  "cvv",
  "cvc",
]);

/** Keys whose values look like PII and should be masked (show partial). */
const MASK_KEYS = new Set([
  "email",
  "to",
  "phone",
  "ipAddress",
  "ip_address",
  "ip",
]);

/**
 * Mask an email address: `user@example.com` -> `u***@e***.com`.
 */
function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at < 1) return "***@***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const dotIdx = domain.lastIndexOf(".");
  if (dotIdx < 1) return `${local[0]}***@***`;
  const domainName = domain.slice(0, dotIdx);
  const tld = domain.slice(dotIdx);
  return `${local[0]}***@${domainName[0]}***${tld}`;
}

/**
 * Mask a phone number: `+15551234567` -> `+1***4567`.
 */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const lastFour = digits.slice(-4);
  const prefix = value.startsWith("+") ? "+" : "";
  return `${prefix}***${lastFour}`;
}

/**
 * Mask an IP address: `192.168.1.42` -> `192.168.x.x`.
 */
function maskIp(value: string): string {
  const parts = value.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  // IPv6 or other — just truncate
  return value.slice(0, Math.min(value.length, 10)) + "***";
}

/**
 * Determine the appropriate masking strategy for a value based on its key.
 */
function maskValue(key: string, value: string): string {
  const lower = key.toLowerCase();
  if (lower === "email" || lower === "to") return maskEmail(value);
  if (lower.includes("phone")) return maskPhone(value);
  if (lower === "ip" || lower.includes("ipaddress") || lower.includes("ip_address")) {
    return maskIp(value);
  }
  // Default partial mask for other PII keys
  if (value.length <= 4) return "***";
  return value.slice(0, 2) + "***";
}

/**
 * Recursively redact sensitive fields from a context object.
 * Returns a new object — never mutates the original.
 */
function redactContext(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Fully redact secret keys
    if (REDACT_KEYS.has(key) || REDACT_KEYS.has(lowerKey)) {
      result[key] = "[REDACTED]";
      continue;
    }

    // Mask PII keys
    if (MASK_KEYS.has(key) || MASK_KEYS.has(lowerKey)) {
      if (typeof value === "string" && value.length > 0) {
        result[key] = maskValue(key, value);
      } else {
        result[key] = value;
      }
      continue;
    }

    // Recurse into nested objects
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactContext(value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * Scrub inline PII patterns from log message strings.
 * Catches email addresses and phone-like patterns embedded in messages.
 */
function scrubMessage(message: string): string {
  // Mask email addresses in messages
  let scrubbed = message.replace(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    (match) => maskEmail(match),
  );

  // Mask phone numbers that look like +1XXXXXXXXXX or similar patterns
  scrubbed = scrubbed.replace(
    /\+?\d[\d\s\-().]{8,}\d/g,
    (match) => {
      const digits = match.replace(/\D/g, "");
      if (digits.length >= 7 && digits.length <= 15) {
        return maskPhone(match);
      }
      return match;
    },
  );

  return scrubbed;
}

// ---------------------------------------------------------------------------
// Error serialization
// ---------------------------------------------------------------------------

/**
 * Safely serialize an Error (or unknown value) into a loggable object.
 * Preserves message, stack, name, and any custom enumerable properties.
 * Redacts sensitive data from error properties.
 */
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: err.name,
      message: scrubMessage(err.message),
    };
    if (err.stack) {
      serialized.stack = err.stack;
    }
    // Capture custom properties (e.g. statusCode, code, digest)
    for (const key of Object.getOwnPropertyNames(err)) {
      if (!serialized[key]) {
        const value = (err as unknown as Record<string, unknown>)[key];
        if (REDACT_KEYS.has(key)) {
          serialized[key] = "[REDACTED]";
        } else if (MASK_KEYS.has(key) && typeof value === "string") {
          serialized[key] = maskValue(key, value);
        } else {
          serialized[key] = value;
        }
      }
    }
    return serialized;
  }
  return { value: scrubMessage(String(err)) };
}

// ---------------------------------------------------------------------------
// Entry creation & formatting
// ---------------------------------------------------------------------------

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    message: scrubMessage(message),
    context: context ? redactContext(context) : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format a log entry as a single-line JSON string for structured logging in
 * production, and a human-readable string in development.
 */
function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      ...entry.context,
    });
  }
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${ctx}`;
}

// ---------------------------------------------------------------------------
// Sentry integration (adds breadcrumbs and forwards errors)
// ---------------------------------------------------------------------------

import {
  addBreadcrumb as sentryAddBreadcrumb,
  captureException as sentryCaptureException,
} from "@sentry/core";

// ---------------------------------------------------------------------------
// Logger interface
// ---------------------------------------------------------------------------

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  errorWithCause(
    message: string,
    error: unknown,
    context?: Record<string, unknown>,
  ): void;
  warnWithCause(
    message: string,
    error: unknown,
    context?: Record<string, unknown>,
  ): void;
  withContext(fields: Record<string, unknown>): Logger;
  time(label: string): void;
  timeEnd(label: string): void;
}

// ---------------------------------------------------------------------------
// Merge helper — combines persistent context with per-call context
// ---------------------------------------------------------------------------

function mergeContext(
  persistent: Record<string, unknown> | undefined,
  perCall: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!persistent && !perCall) return undefined;
  if (!persistent) return perCall;
  if (!perCall) return persistent;
  return { ...persistent, ...perCall };
}

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

function createLogger(
  persistentContext?: Record<string, unknown>,
): Logger {
  const timers = new Map<string, number>();

  return {
    debug(message: string, context?: Record<string, unknown>) {
      if (process.env.NODE_ENV === "development") {
        const merged = mergeContext(persistentContext, context);
        console.debug(formatEntry(createEntry("debug", message, merged)));
      }
    },

    info(message: string, context?: Record<string, unknown>) {
      const merged = mergeContext(persistentContext, context);
      console.info(formatEntry(createEntry("info", message, merged)));
    },

    warn(message: string, context?: Record<string, unknown>) {
      const merged = mergeContext(persistentContext, context);
      console.warn(formatEntry(createEntry("warn", message, merged)));

      // Forward warnings to Sentry as breadcrumbs
      try {
        sentryAddBreadcrumb({
          category: "logger",
          message: scrubMessage(message),
          level: "warning",
          data: merged ? redactContext(merged) : undefined,
        });
      } catch {
        // Sentry not initialised — safe to ignore
      }
    },

    error(message: string, context?: Record<string, unknown>) {
      const merged = mergeContext(persistentContext, context);
      console.error(formatEntry(createEntry("error", message, merged)));

      // Forward errors to Sentry as breadcrumbs
      try {
        sentryAddBreadcrumb({
          category: "logger",
          message: scrubMessage(message),
          level: "error",
          data: merged ? redactContext(merged) : undefined,
        });
      } catch {
        // Sentry not initialised — safe to ignore
      }
    },

    /**
     * Log an error with full serialization (message, stack, custom
     * properties). Also forwards to Sentry as a captured exception.
     */
    errorWithCause(
      message: string,
      error: unknown,
      context?: Record<string, unknown>,
    ) {
      this.error(message, { ...context, error: serializeError(error) });

      try {
        const sentryError =
          error instanceof Error ? error : new Error(String(error));
        const merged = mergeContext(persistentContext, context);
        sentryCaptureException(sentryError, {
          extra: {
            loggerMessage: scrubMessage(message),
            ...(merged ? redactContext(merged) : {}),
          },
        });
      } catch {
        // Sentry not initialised — safe to ignore
      }
    },

    /**
     * Log a warning with an associated error/cause.
     */
    warnWithCause(
      message: string,
      error: unknown,
      context?: Record<string, unknown>,
    ) {
      this.warn(message, { ...context, error: serializeError(error) });
    },

    /**
     * Create a child logger that includes persistent context fields in
     * every log entry. Per-call context is merged on top (per-call wins).
     *
     * ```ts
     * const child = logger.withContext({ clientId: "abc" });
     * child.info("hello"); // includes { clientId: "abc" }
     * ```
     */
    withContext(fields: Record<string, unknown>): Logger {
      const merged = persistentContext
        ? { ...persistentContext, ...fields }
        : { ...fields };
      return createLogger(merged);
    },

    /**
     * Start a named timer. Call `timeEnd` with the same label to log the
     * elapsed duration in milliseconds.
     */
    time(label: string) {
      timers.set(label, performance.now());
    },

    /**
     * Stop a named timer and log the elapsed duration.
     */
    timeEnd(label: string) {
      const start = timers.get(label);
      if (start === undefined) {
        this.warn(`timer "${label}" does not exist`);
        return;
      }
      timers.delete(label);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      this.info(`${label} completed`, { durationMs });
    },
  };
}

// ---------------------------------------------------------------------------
// Public API — singleton root logger
// ---------------------------------------------------------------------------

export const logger: Logger = createLogger();

// ---------------------------------------------------------------------------
// Request ID helper
// ---------------------------------------------------------------------------

/**
 * Create a child logger with a `requestId` field extracted from the
 * incoming request's `x-request-id` header (falls back to a random UUID).
 */
export function withRequestId(request: Request): Logger {
  const requestId =
    request.headers.get("x-request-id") || crypto.randomUUID();
  return logger.withContext({ requestId });
}

// Re-export utilities for use by Sentry config and other modules
export { redactContext, scrubMessage, maskEmail, maskPhone };
