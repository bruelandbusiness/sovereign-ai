"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />
      <main className="flex flex-1 items-center justify-center">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <p className="text-5xl font-bold text-destructive">Oops</p>
            <h1 className="mt-4 text-xl font-semibold">Dashboard Error</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong loading your dashboard. Your data is safe.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={reset}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Retry
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
