"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "success" | "error";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const initialStatus: Status = clientId ? "loading" : "error";
  const [status, setStatus] = useState<Status>(initialStatus);

  useEffect(() => {
    if (!clientId) {
      return;
    }
    let cancelled = false;
    fetch(`/api/email/unsubscribe?clientId=${encodeURIComponent(clientId)}`)
      .then((res) => {
        if (cancelled) return;
        setStatus(res.ok ? "success" : "error");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => { cancelled = true; };
  }, [clientId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <h1 className="text-xl font-semibold">Unsubscribing&hellip;</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we process your request.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold">
              You&apos;ve Been Unsubscribed
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You will no longer receive marketing emails from Sovereign AI. If
              this was a mistake, you can re-subscribe from your{" "}
              <Link
                href="/dashboard/settings/account"
                className="text-primary hover:underline"
              >
                account settings
              </Link>.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Note: You will still receive transactional emails related to
              your account, billing, and security. These are required for
              account operation and cannot be disabled.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              Back to Homepage
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-destructive">
              Something Went Wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t process your unsubscribe request. The link may be
              invalid or expired. Please contact{" "}
              <a
                href="mailto:support@trysovereignai.com"
                className="text-primary hover:underline"
              >
                support@trysovereignai.com
              </a>{" "}
              for help.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
            >
              Back to Homepage
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
