/// <reference lib="webworker" />

const CACHE_NAME = "sovereign-ai-v2";
const SHELL_URLS = ["/dashboard", "/offline"];
const STATIC_CACHE_LIMIT = 100;

// Cache dashboard shell for offline access
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/**
 * Trim the cache to a maximum number of entries so it does not grow unbounded.
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// Fetch strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Never cache API calls — always go to network.
  // This prevents stale dynamic data from being served.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // For navigation requests, try network first, fall back to cache then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful navigation responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match("/offline")
          )
        )
    );
    return;
  }

  // For static assets (JS/CSS bundles, fonts, icons), use cache-first strategy
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clone);
                trimCache(CACHE_NAME, STATIC_CACHE_LIMIT);
              });
            }
            return response;
          })
      )
    );
    return;
  }

  // All other requests (e.g. third-party scripts) — network only, no caching
});

// Handle push notifications
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

// Handle notification click
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
