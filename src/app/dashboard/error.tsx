"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RotateCcw, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "dashboard-error" },
      extra: {
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 500);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6" role="alert" aria-live="assertive">
      <div className="w-full max-w-md rounded-xl border border-border bg-card/80 p-6 shadow-lg">
        {/* Icon + heading row */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">
              Dashboard Error
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Something went wrong loading this section. Your data is safe and
              unaffected.
            </p>
          </div>
        </div>

        {/* Expandable details (safe info only) */}
        {error.digest && (
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground/80 transition-colors"
            >
              {showDetails ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Details
            </button>
            {showDetails && (
              <div className="mt-2 rounded-lg bg-background px-3 py-2 text-xs font-mono text-muted-foreground">
                Error reference: {error.digest}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-60"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/80 transition-all hover:border-border hover:text-white"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Support link */}
        <div className="mt-4 border-t border-border pt-4">
          <a
            href={`mailto:support@trysovereignai.com?subject=Dashboard Error${error.digest ? ` (${error.digest})` : ""}&body=I encountered an error in the dashboard.`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground/80"
          >
            <MessageSquare className="h-3 w-3" />
            Report this issue
          </a>
        </div>
      </div>
    </div>
  );
}
