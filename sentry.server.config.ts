import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, Breadcrumb } from "@sentry/core";

/**
 * Scrub PII from Sentry event data before it leaves the server.
 */
function scrubEvent(event: ErrorEvent): ErrorEvent {
  // Strip user PII — keep only the user ID for correlation
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  // Scrub request data
  if (event.request) {
    // Remove cookies and authorization headers
    if (event.request.headers) {
      delete event.request.headers["cookie"];
      delete event.request.headers["authorization"];
      delete event.request.headers["x-api-key"];
    }
    // Remove query string parameters (may contain tokens)
    if (event.request.query_string) {
      event.request.query_string = "[REDACTED]";
    }
  }

  return event;
}

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
    return scrubEvent(event);
  },

  // Prevent sensitive data from appearing in breadcrumbs
  beforeBreadcrumb(breadcrumb: Breadcrumb) {
    // Remove HTTP request breadcrumbs that may contain auth tokens in URLs
    if (breadcrumb.category === "http" && breadcrumb.data?.url) {
      const url = String(breadcrumb.data.url);
      if (url.includes("token=") || url.includes("api_key=")) {
        breadcrumb.data.url = url.replace(
          /([?&])(token|api_key|secret|key)=[^&]*/gi,
          "$1$2=[REDACTED]",
        );
      }
    }
    return breadcrumb;
  },
});
