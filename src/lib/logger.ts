type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Safely serialize an Error (or unknown value) into a loggable object.
 * Preserves message, stack, name, and any custom enumerable properties
 * while stripping nothing sensitive (callers should redact before passing).
 */
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: err.name,
      message: err.message,
    };
    if (err.stack) {
      serialized.stack = err.stack;
    }
    // Capture custom properties (e.g. statusCode, code, digest)
    for (const key of Object.getOwnPropertyNames(err)) {
      if (!serialized[key]) {
        serialized[key] = (err as unknown as Record<string, unknown>)[key];
      }
    }
    return serialized;
  }
  return { value: String(err) };
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    message,
    context,
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
  },
  error(message: string, context?: Record<string, unknown>) {
    console.error(formatEntry(createEntry("error", message, context)));
  },
  /**
   * Log an error with full serialization (message, stack, custom properties).
   * Convenience wrapper: `logger.errorWithCause("msg", err, { extra: "ctx" })`
   */
  errorWithCause(
    message: string,
    error: unknown,
    context?: Record<string, unknown>,
  ) {
    this.error(message, { ...context, error: serializeError(error) });
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
