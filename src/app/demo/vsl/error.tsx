"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Container } from "@/components/layout/Container";

export default function DemoVslError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "demo-vsl-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Container>
        <div className="mx-auto max-w-md text-center" role="alert" aria-live="assertive">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold">Unable to load video</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We had trouble loading the video page. Please try again or return
            to the home page.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              <Home className="h-3.5 w-3.5" />
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
