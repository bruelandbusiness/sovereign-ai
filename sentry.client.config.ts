import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, Breadcrumb } from "@sentry/core";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  // Environment and release for filtering in the Sentry dashboard
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: 0.1,

  // Session replay — capture 0% of sessions normally, 10% on error
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,

  // Strip PII before sending to Sentry — keep user.id for correlation
  beforeSend(event: ErrorEvent) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }
    return event;
  },

  // Prevent sensitive data from appearing in breadcrumbs
  beforeBreadcrumb(breadcrumb: Breadcrumb) {
    if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
      const url = String(breadcrumb.data?.url ?? "");
      if (url.includes("token=") || url.includes("api_key=")) {
        breadcrumb.data = {
          ...breadcrumb.data,
          url: url.replace(
            /([?&])(token|api_key|secret|key)=[^&]*/gi,
            "$1$2=[REDACTED]",
          ),
        };
      }
    }
    return breadcrumb;
  },
});
