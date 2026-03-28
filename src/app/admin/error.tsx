"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

export default function AdminError({
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
      tags: { boundary: "admin-error" },
      extra: { digest: error.digest },
    });

    // Also report to our monitoring endpoint with admin context
    try {
      fetch("/api/admin/errors/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          digest: error.digest,
          boundary: "admin",
          url: typeof window !== "undefined" ? window.location.href : undefined,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch {
      // Never break the error UI
    }
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 500);
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Admin Panel Error
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              An error occurred in the admin panel. This has been logged
              automatically. No data was affected.
            </p>
          </div>
        </div>

        {/* Expandable technical details (admin users may find these helpful) */}
        <div className="mt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            Technical details
          </button>
          {showDetails && (
            <div className="mt-2 space-y-1 rounded-lg bg-background px-3 py-2.5 text-xs font-mono text-muted-foreground">
              {error.digest && (
                <p>
                  <span className="text-muted-foreground/60">Reference:</span> {error.digest}
                </p>
              )}
              <p>
                <span className="text-muted-foreground/60">Time:</span>{" "}
                {new Date().toISOString()}
              </p>
              <p>
                <span className="text-muted-foreground/60">URL:</span>{" "}
                {typeof window !== "undefined" ? window.location.pathname : "N/A"}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
          <button
            onClick={() => (window.location.href = "/admin")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-border-strong hover:text-foreground"
          >
            Back to Admin
          </button>
          <a
            href="/admin/monitoring"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            View error logs
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
