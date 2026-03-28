"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { reportClientError } from "@/lib/monitoring/report-client-error";

/**
 * Global error boundary. This renders OUTSIDE the root layout, so Tailwind
 * CSS variables and globals.css are NOT available. All styling must use
 * either raw Tailwind utilities that don't depend on CSS custom properties,
 * or inline styles.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "global-error" },
      extra: { digest: error.digest },
    });

    reportClientError({
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      boundary: "global-error",
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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong | Sovereign AI</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes pulse-ring {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.1); }
              }
              .error-spin { animation: spin 1s linear infinite; }
              .error-ring-pulse { animation: pulse-ring 2s ease-in-out infinite; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#09090b",
          color: "#ffffff",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1rem",
          }}
        >
          {/* Subtle background glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "400px",
                height: "400px",
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.03)",
                filter: "blur(80px)",
              }}
            />
          </div>

          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            {/* Error icon with pulsing ring */}
            <div
              style={{
                position: "relative",
                margin: "0 auto 1.5rem",
                width: "80px",
                height: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="error-ring-pulse"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "8px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.05)",
                }}
              />
              <svg
                style={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  color: "#ef4444",
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                margin: 0,
                color: "#ffffff",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.875rem",
                color: "#a1a1aa",
                lineHeight: 1.6,
              }}
            >
              A critical error occurred. Our team has been notified. Please try
              refreshing the page or head back to the home page.
            </p>

            {error.digest && (
              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#52525b",
                }}
              >
                Reference: {error.digest}
              </p>
            )}

            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#000000",
                  backgroundColor: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: isRetrying ? "not-allowed" : "pointer",
                  opacity: isRetrying ? 0.6 : 1,
                  transition: "all 200ms",
                }}
              >
                {isRetrying ? (
                  <>
                    <svg
                      className="error-spin"
                      style={{ width: "16px", height: "16px" }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        style={{ opacity: 0.25 }}
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        style={{ opacity: 0.75 }}
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Retrying...
                  </>
                ) : (
                  "Try Again"
                )}
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders outside <html> with no router context, so <Link> is unavailable */}
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#ffffff",
                  backgroundColor: "transparent",
                  border: "1px solid #27272a",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  transition: "all 200ms",
                }}
              >
                Go Home
              </a>
            </div>

            {/* Report link */}
            <div
              style={{
                marginTop: "1.5rem",
                borderTop: "1px solid #27272a",
                paddingTop: "1.5rem",
              }}
            >
              <a
                href={`mailto:support@trysovereignai.com?subject=Critical Error${error.digest ? ` (${error.digest})` : ""}&body=I encountered a critical error on the site.`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.875rem",
                  color: "#a1a1aa",
                  textDecoration: "none",
                }}
              >
                <svg
                  style={{ width: "14px", height: "14px" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                Report this issue
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
