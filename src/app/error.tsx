"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw, Home, MessageSquare } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "root-error" },
      extra: {
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }, [error]);

  const handleRetry = () => {
    setIsRetrying(true);
    // Small delay so the user sees the loading state
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 500);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Error illustration */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
          <AlertTriangle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          We hit an unexpected error. Our team has been notified and is looking
          into it. You can try again or head back to the home page.
        </p>

        {/* Error reference (digest only, no stack trace) */}
        {error.digest && (
          <p className="mt-4 text-xs font-mono text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-60 sm:w-auto"
          >
            <RotateCcw
              className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Retrying..." : "Try Again"}
          </button>

          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground/80 transition-all hover:border-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        {/* Report link */}
        <div className="mt-6 border-t border-border pt-6">
          <a
            href={`mailto:support@trysovereignai.com?subject=Error Report${error.digest ? ` (${error.digest})` : ""}&body=I encountered an error on ${typeof window !== "undefined" ? window.location.href : "the site"}.`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground/80"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Report this issue
          </a>
        </div>
      </div>
    </div>
  );
}
