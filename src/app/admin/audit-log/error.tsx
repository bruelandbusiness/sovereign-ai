"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import {
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AuditLogError({
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
      tags: { boundary: "admin-audit-log" },
      extra: { digest: error.digest },
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
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Audit Log Error
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Failed to load audit log data. This has been logged automatically.
            </p>
          </div>
        </div>

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
                  <span className="text-muted-foreground/60">Reference:</span>{" "}
                  {error.digest}
                </p>
              )}
              <p>
                <span className="text-muted-foreground/60">Time:</span>{" "}
                {new Date().toISOString()}
              </p>
            </div>
          )}
        </div>

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
        </div>
      </div>
    </div>
  );
}
