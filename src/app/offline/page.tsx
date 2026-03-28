"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <line x1="2" x2="22" y1="2" y2="22" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
            <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
            <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
            <path d="M5 12.86a10 10 0 0 1 5.17-2.89" />
            <line x1="12" x2="12.01" y1="20" y2="20" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-foreground">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. Check your
          network and try again.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Retry Connection
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-10 rounded-lg border border-border bg-muted/50 p-5 text-left">
          <h2 className="text-sm font-semibold text-foreground">
            Available offline
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
              Previously visited pages (cached)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
              Dashboard shell and navigation
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
              Static assets and app interface
            </li>
          </ul>

          <h2 className="mt-4 text-sm font-semibold text-foreground">
            Requires connection
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500" />
              Live analytics and reporting
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500" />
              AI services and chat
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500" />
              Account settings and billing
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
