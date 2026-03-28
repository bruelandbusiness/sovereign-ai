import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent } from "@sentry/core";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  // Environment and release for filtering in the Sentry dashboard
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: 0.1,

  // Strip PII before sending to Sentry
  beforeSend(event: ErrorEvent) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    if (event.request?.headers) {
      delete event.request.headers["cookie"];
      delete event.request.headers["authorization"];
    }
    if (event.request?.query_string) {
      event.request.query_string = "[REDACTED]";
    }
    return event;
  },
});
