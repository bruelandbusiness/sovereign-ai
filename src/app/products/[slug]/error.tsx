"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw, ArrowLeft, MessageSquare } from "lucide-react";
import { Container } from "@/components/layout/Container";

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "product-detail-error" },
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Container>
        <div className="mx-auto max-w-md text-center" role="alert" aria-live="assertive">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold">Unable to load product</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We had trouble loading this product. Please try again or browse all
            products.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs font-mono text-muted-foreground/60">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying..." : "Try Again"}
            </button>
            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Browse Products
            </Link>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <a
              href={`mailto:support@trysovereignai.com?subject=Product Error${error.digest ? ` (${error.digest})` : ""}&body=I encountered an error loading a product page.`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="h-3 w-3" />
              Report this issue
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
