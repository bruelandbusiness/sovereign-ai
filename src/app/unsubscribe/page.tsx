"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "preferences" | "saving" | "saved" | "error";

interface Preferences {
  marketing: boolean;
  weekly_reports: boolean;
  product_updates: boolean;
  transactional: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  marketing: true,
  weekly_reports: true,
  product_updates: true,
  transactional: true,
};

const CATEGORY_LABELS: Record<
  keyof Preferences,
  { label: string; description: string }
> = {
  marketing: {
    label: "Marketing Emails",
    description: "Campaigns, promotions, and special offers",
  },
  weekly_reports: {
    label: "Weekly Reports",
    description: "Weekly KPI summaries and performance metrics",
  },
  product_updates: {
    label: "Product Updates",
    description: "New feature announcements and product news",
  },
  transactional: {
    label: "Transactional Emails",
    description:
      "Booking confirmations, invoices, and account alerts (required)",
  },
};

function PreferenceToggle({
  categoryKey,
  checked,
  disabled,
  onChange,
}: {
  categoryKey: keyof Preferences;
  checked: boolean;
  disabled: boolean;
  onChange: (key: keyof Preferences, value: boolean) => void;
}) {
  const { label, description } = CATEGORY_LABELS[categoryKey];

  return (
    <label
      className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
        disabled
          ? "cursor-not-allowed border-border/50 bg-muted/30"
          : "cursor-pointer border-border hover:bg-muted/50"
      }`}
    >
      <div className="mr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${label}`}
        disabled={disabled}
        onClick={() => onChange(categoryKey, !checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          disabled
            ? "bg-primary/60"
            : checked
              ? "bg-primary"
              : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [status, setStatus] = useState<Status>(
    clientId ? "loading" : "error",
  );
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    fetch(
      `/api/email/preferences?clientId=${encodeURIComponent(clientId)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load preferences");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPreferences(data.preferences);
        setStatus("preferences");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleToggle = useCallback(
    (key: keyof Preferences, value: boolean) => {
      // transactional cannot be toggled off
      if (key === "transactional") return;
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!clientId) return;
    setStatus("saving");

    try {
      const res = await fetch("/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, preferences }),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setPreferences(data.preferences);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [clientId, preferences]);

  const handleUnsubscribeAll = useCallback(async () => {
    if (!clientId) return;
    setStatus("saving");

    const allOff: Preferences = {
      marketing: false,
      weekly_reports: false,
      product_updates: false,
      transactional: true,
    };

    try {
      const res = await fetch("/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, preferences: allOff }),
      });

      if (!res.ok) throw new Error("Unsubscribe failed");

      const data = await res.json();
      setPreferences(data.preferences);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [clientId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        {status === "loading" && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <h1 className="text-xl font-semibold">
              Loading Preferences&hellip;
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we load your email settings.
            </p>
          </div>
        )}

        {(status === "preferences" || status === "saving") && (
          <>
            <h1 className="text-xl font-semibold text-center">
              Email Preferences
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Choose which emails you would like to receive from Sovereign AI.
            </p>

            <div className="mt-6 space-y-3">
              {(
                Object.keys(CATEGORY_LABELS) as Array<keyof Preferences>
              ).map((key) => (
                <PreferenceToggle
                  key={key}
                  categoryKey={key}
                  checked={preferences[key]}
                  disabled={
                    key === "transactional" || status === "saving"
                  }
                  onChange={handleToggle}
                />
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={status === "saving"}
                className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {status === "saving"
                  ? "Saving..."
                  : "Save Preferences"}
              </button>

              <button
                type="button"
                onClick={handleUnsubscribeAll}
                disabled={status === "saving"}
                className="w-full rounded-lg border border-destructive/30 px-5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Unsubscribe from All
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Note: Transactional emails (booking confirmations, invoices,
              security alerts) cannot be disabled as they are required for
              account operation.
            </p>
          </>
        )}

        {status === "saved" && (
          <div className="text-center">
            <h1 className="text-xl font-semibold">
              Preferences Updated
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your email preferences have been saved successfully.
            </p>

            <div className="mt-4 space-y-2 text-left">
              {(
                Object.keys(CATEGORY_LABELS) as Array<keyof Preferences>
              ).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-2"
                >
                  <span className="text-sm">
                    {CATEGORY_LABELS[key].label}
                  </span>
                  <span
                    className={`text-xs font-medium ${preferences[key] ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {preferences[key] ? "Subscribed" : "Unsubscribed"}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStatus("preferences")}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Edit Preferences
            </button>

            <div className="mt-4">
              <Link
                href="/"
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-destructive">
              Something Went Wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t process your request. The link may be
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
          </div>
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
