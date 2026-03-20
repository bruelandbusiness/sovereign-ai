"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Component crashed:", error, info.componentStack);
    // Report to Sentry if available
    if (typeof window !== "undefined") {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error, {
          extra: { componentStack: info.componentStack },
        });
      }).catch(() => {
        // Sentry not available
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div role="alert" className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
            <p>Something went wrong loading this section.</p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
