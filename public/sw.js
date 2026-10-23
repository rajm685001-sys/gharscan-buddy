const CACHE_NAME = "gharscan-buddy-v1";

const OFFLINE_URLS = [
  "/",
  "/dashboard",
  "/inventory",
  "/scan",
  "/receipt-scan",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("gharscan-buddy-v1").then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== "gharscan-buddy-v1")
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ??
        fetch(event.request).then((networkResponse) => {
          if (
            event.request.url.startsWith(self.location.origin) &&
            networkResponse.status === 200
          ) {
            const responseClone = networkResponse.clone();

            caches.open("gharscan-buddy-v1").then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }

          return networkResponse;
        })
      );
    }),
  );
});