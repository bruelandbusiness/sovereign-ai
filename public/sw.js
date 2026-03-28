/// <reference lib="webworker" />

/**
 * Service Worker for Sovereign AI PWA.
 *
 * Strategies:
 *  - Navigation requests:  network-first, fall back to cache, then /offline
 *  - Static assets:        cache-first (JS/CSS bundles, fonts, images)
 *  - API GET requests:     network-first with cache fallback (stale data > no data)
 *  - API mutations:        pass through (no caching)
 *  - Everything else:      network only
 */

const CACHE_VERSION = 3;
const STATIC_CACHE = `sovereign-static-v${CACHE_VERSION}`;
const API_CACHE = `sovereign-api-v${CACHE_VERSION}`;
const SHELL_URLS = ["/dashboard", "/offline"];
const STATIC_CACHE_LIMIT = 150;
const API_CACHE_LIMIT = 50;
/** API responses older than 5 minutes are considered stale and re-fetched. */
const API_MAX_AGE_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Install: pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: purge old caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  const currentCaches = new Set([STATIC_CACHE, API_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.has(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Trim a cache to at most `maxItems` entries (FIFO). */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  // Delete oldest entries in one pass
  const excess = keys.slice(0, keys.length - maxItems);
  await Promise.all(excess.map((key) => cache.delete(key)));
}

/** Check whether a URL path looks like a static asset. */
function isStaticAsset(pathname) {
  if (pathname.startsWith("/_next/static/")) return true;
  if (pathname.startsWith("/fonts/")) return true;
  const staticExts = [".png", ".svg", ".ico", ".woff", ".woff2", ".jpg", ".jpeg", ".webp", ".css", ".js"];
  return staticExts.some((ext) => pathname.endsWith(ext));
}

// ---------------------------------------------------------------------------
// Fetch handler
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // --- Navigation requests: network-first, cache, then /offline -----------
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  // --- API GET requests: network-first with cache fallback ----------------
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              // Store a timestamp header so we can expire stale entries
              const headers = new Headers(clone.headers);
              headers.set("sw-cached-at", String(Date.now()));
              const timestamped = new Response(clone.body, {
                status: clone.status,
                statusText: clone.statusText,
                headers,
              });
              cache.put(request, timestamped);
              trimCache(API_CACHE, API_CACHE_LIMIT);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (!cached) return new Response('{"error":"offline"}', {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
          return cached;
        })
    );
    return;
  }

  // --- Static assets: cache-first ----------------------------------------
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, clone);
                trimCache(STATIC_CACHE, STATIC_CACHE_LIMIT);
              });
            }
            return response;
          })
      )
    );
    return;
  }

  // All other same-origin requests — network only, no caching
});

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  let data = { title: "Sovereign AI", body: "You have a new notification", url: "/dashboard" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    // Fallback to default data if parsing fails
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
    },
    actions: [
      { action: "open", title: "Open Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ---------------------------------------------------------------------------
// Notification click
// ---------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // If a window is already open, focus it and navigate
      for (const client of clients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
