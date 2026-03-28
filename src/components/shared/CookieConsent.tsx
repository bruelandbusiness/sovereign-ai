"use client";

import { useState } from "react";

const CONSENT_KEY = "sovereign-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(CONSENT_KEY);
  });

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    // Notify TrackingScripts in the same tab to load analytics
    window.dispatchEvent(new Event("cookie-consent-change"));
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
    // Remove any tracking globals that may have been loaded
    if (typeof window !== "undefined") {
      window.fbq = undefined;
      window.gtag = undefined;
    }
    window.dispatchEvent(new Event("cookie-consent-change"));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0a0f]/95 p-4 backdrop-blur-sm sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-8"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <p className="text-sm text-muted-foreground">
        We use cookies to improve your experience and analyze site traffic. By
        clicking &quot;Accept&quot;, you consent to our use of cookies.{" "}
        <a href="/legal/privacy" className="underline hover:text-white">
          Privacy Policy
        </a>
      </p>
      <div className="mt-3 flex gap-3 sm:mt-0 sm:shrink-0">
        <button
          onClick={decline}
          className="min-h-[44px] rounded-md border border-white/20 px-5 py-2.5 text-sm text-muted-foreground transition hover:bg-white/10"
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="min-h-[44px] rounded-md bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
