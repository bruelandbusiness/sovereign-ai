"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (/sw.js) on mount.
 *
 * This must be rendered once in the root layout so that:
 *  - Offline fallback pages work for all navigation requests.
 *  - Push notification subscriptions (PushNotificationPrompt) can resolve
 *    `navigator.serviceWorker.ready`.
 *  - Static assets are cached for repeat visits.
 *
 * When a new service worker version is detected, it is activated immediately
 * so users always get the latest caching logic without a manual refresh.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // When a new SW is found, activate it immediately so the latest
        // caching strategies take effect without requiring a page reload.
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content is available; the new SW will activate via
              // skipWaiting() in sw.js. No user-facing prompt needed for
              // a dashboard app -- the next navigation will use the new SW.
               
              console.info("New service worker available; will activate on next navigation.");
            }
          };
        };
      })
      .catch((err) => {
        // Registration failures are non-critical; log but do not crash.
         
        console.error("SW registration failed:", err);
      });
  }, []);

  return null;
}
