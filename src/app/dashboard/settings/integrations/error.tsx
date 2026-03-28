"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle } from "lucide-react";

export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "dashboard-settings-integrations" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert" aria-live="assertive">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        We couldn&apos;t load your integrations. Please try again.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try Again
        </button>
        <Link
          href="/dashboard/settings/account"
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
