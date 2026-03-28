"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WebhooksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/webhooks] Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Failed to load webhook deliveries
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          An error occurred while loading the webhook delivery data.
          This has been logged automatically.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs font-mono text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default" size="sm">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/admin")}
          >
            Back to Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
