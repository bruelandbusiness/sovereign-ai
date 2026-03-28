import { addBreadcrumb } from "@sentry/core";

/**
 * Record a navigation breadcrumb so Sentry shows the user's page flow
 * leading up to an error.
 */
export function trackNavigation(from: string, to: string): void {
  addBreadcrumb({
    category: "navigation",
    message: `${from} -> ${to}`,
    data: { from, to },
    level: "info",
  });
}

/**
 * Record a form submission breadcrumb. Include the form name/action
 * but never the form data itself (PII risk).
 */
export function trackFormSubmission(
  formName: string,
  action: string,
  metadata?: Record<string, string | number | boolean>,
): void {
  addBreadcrumb({
    category: "form",
    message: `Form submitted: ${formName}`,
    data: { formName, action, ...metadata },
    level: "info",
  });
}

/**
 * Record a user action breadcrumb (button click, toggle, modal open, etc.).
 */
export function trackUserAction(
  action: string,
  metadata?: Record<string, string | number | boolean>,
): void {
  addBreadcrumb({
    category: "user-action",
    message: action,
    data: metadata,
    level: "info",
  });
}

/**
 * Record an API call breadcrumb for client-side fetches that are
 * important to the user flow (e.g. saving settings, creating a lead).
 */
export function trackApiCall(
  method: string,
  url: string,
  statusCode?: number,
): void {
  addBreadcrumb({
    category: "api",
    message: `${method} ${url}`,
    data: { method, url, statusCode },
    level: statusCode && statusCode >= 400 ? "warning" : "info",
  });
}
