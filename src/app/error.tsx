"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Container } from "@/components/layout/Container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "app-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Container>
        <div className="mx-auto max-w-md text-center">
          <p className="text-5xl font-bold text-destructive">Error</p>
          <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
