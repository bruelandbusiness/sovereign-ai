"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RotateCcw } from "lucide-react";
import { reportClientError } from "@/lib/monitoring/report-client-error";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI to render on error. Receives the error and a reset fn. */
  fallback?: React.ReactNode | ((props: { error: Error; reset: () => void }) => React.ReactNode);
  /** Callback fired when an error is caught. Use for logging / monitoring. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Default fallback card
// ---------------------------------------------------------------------------

function DefaultFallback({
  error: _error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-md rounded-xl border border-border bg-card/80 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            Something went wrong
          </p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            An unexpected error occurred in this section.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <RotateCcw className="h-3 w-3" />
          Try Again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorBoundary component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log to console
    console.error(
      "[ErrorBoundary] Component error:",
      error,
      errorInfo.componentStack,
    );

    // Report to Sentry
    try {
      Sentry.captureException(error, {
        tags: { boundary: "ErrorBoundary" },
        extra: { componentStack: errorInfo.componentStack },
      });
    } catch {
      // Never break the error UI
    }

    // Fire the onError callback if provided (for integration with error-logger)
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch {
        // onError should never break the error boundary
      }
    }

    // Report to our monitoring API (client-side, fire-and-forget)
    try {
      reportClientError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
        boundary: "ErrorBoundary",
      });
    } catch {
      // Never break the error UI
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      const error = this.state.error;

      // Render function fallback
      if (typeof fallback === "function") {
        return fallback({ error, reset: this.handleReset });
      }

      // Static fallback node
      if (fallback) {
        return fallback;
      }

      // Default card
      return <DefaultFallback error={error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}
