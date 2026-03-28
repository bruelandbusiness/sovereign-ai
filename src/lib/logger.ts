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
// Public API
// ---------------------------------------------------------------------------

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatEntry(createEntry("debug", message, context)));
    }
  },
  info(message: string, context?: Record<string, unknown>) {
    console.info(formatEntry(createEntry("info", message, context)));
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(formatEntry(createEntry("warn", message, context)));

    // Forward warnings to Sentry as breadcrumbs so they appear in error context
    try {
      sentryAddBreadcrumb({
        category: "logger",
        message: scrubMessage(message),
        level: "warning",
        data: context ? redactContext(context) : undefined,
      });
    } catch {
      // Sentry not initialised — safe to ignore
    }
  },
  error(message: string, context?: Record<string, unknown>) {
    console.error(formatEntry(createEntry("error", message, context)));

    // Forward errors to Sentry as breadcrumbs. Full captureException is
    // handled by errorWithCause below or by the monitoring module.
    try {
      sentryAddBreadcrumb({
        category: "logger",
        message: scrubMessage(message),
        level: "error",
        data: context ? redactContext(context) : undefined,
      });
    } catch {
      // Sentry not initialised — safe to ignore
    }
  },
  /**
   * Log an error with full serialization (message, stack, custom properties).
   * Convenience wrapper: `logger.errorWithCause("msg", err, { extra: "ctx" })`
   *
   * Also forwards the error to Sentry as a captured exception so it appears
   * in the issues dashboard with full context.
   */
  errorWithCause(
    message: string,
    error: unknown,
    context?: Record<string, unknown>,
  ) {
    this.error(message, { ...context, error: serializeError(error) });

    try {
      const sentryError = error instanceof Error ? error : new Error(String(error));
      sentryCaptureException(sentryError, {
        extra: {
          loggerMessage: scrubMessage(message),
          ...(context ? redactContext(context) : {}),
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
};

// Re-export utilities for use by Sentry config and other modules
export { redactContext, scrubMessage, maskEmail, maskPhone };
