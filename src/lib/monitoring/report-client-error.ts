/**
 * Client-side error reporter.
 *
 * Sends error details to `/api/admin/errors/report` via a fire-and-forget
 * POST request. Safe to call from any client component — failures are
 * silently swallowed so they never disrupt the user experience.
 */

interface ClientErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  digest?: string;
  /** Where the error was caught (e.g. "global-error", "ErrorBoundary") */
  boundary?: string;
}

export function reportClientError(report: ClientErrorReport): void {
  if (typeof window === "undefined") return;

  try {
    const payload: ClientErrorReport = {
      message: report.message,
      stack: report.stack,
      componentStack: report.componentStack,
      url: report.url ?? window.location.href,
      userAgent: report.userAgent ?? navigator.userAgent,
      digest: report.digest,
    };

    fetch("/api/admin/errors/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Fire-and-forget: never interrupt the UI
    });
  } catch {
    // Never break the caller
  }
}
