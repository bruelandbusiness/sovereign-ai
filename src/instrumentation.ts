export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate environment variables at startup — throws in production if
    // critical vars are missing, warns in development.
    await import("./lib/env");

    await import("../sentry.server.config");

    // Catch unhandled promise rejections so they are logged with context
    // instead of silently crashing or printing a bare stack trace.
    const { captureError } = await import("./lib/monitoring/error-logger");

    process.on("unhandledRejection", (reason: unknown) => {
      captureError(reason, {
        severity: "critical",
        source: "unhandledRejection",
        action: "process.unhandledRejection",
      }).catch(() => {
        // Last-resort: never let monitoring crash the process
        console.error("[monitoring] Failed to capture unhandled rejection", reason);
      });
    });

    process.on("uncaughtException", (error: Error) => {
      captureError(error, {
        severity: "critical",
        source: "uncaughtException",
        action: "process.uncaughtException",
      }).catch(() => {
        console.error("[monitoring] Failed to capture uncaught exception", error);
      });
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  return captureRequestError(...args);
};
