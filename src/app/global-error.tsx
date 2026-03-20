"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "global-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] text-white"
          role="alert"
          aria-live="assertive"
        >
          <div className="mx-auto max-w-md px-4 text-center">
            <p className="text-5xl font-bold text-red-500" aria-hidden="true">
              Error
            </p>
            <h1 className="mt-4 text-2xl font-semibold">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-zinc-500">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={reset}
                className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
              >
                Try Again
              </button>
              <a
                href="/"
                className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
