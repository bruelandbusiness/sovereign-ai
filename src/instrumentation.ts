export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate environment variables at startup — throws in production if
    // critical vars are missing, warns in development.
    await import("./lib/env");

    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) => {
  const { captureRequestError } = await import("@sentry/nextjs");
  return captureRequestError(...args);
};
