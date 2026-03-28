"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Container } from "@/components/layout/Container";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "blog-post-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Container>
        <div className="mx-auto max-w-md text-center" role="alert" aria-live="assertive">
          <p className="text-5xl font-bold text-destructive" aria-hidden="true">Oops</p>
          <h1 className="mt-4 text-xl font-semibold">Unable to load blog post</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We had trouble loading the blog post. Please try again.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
