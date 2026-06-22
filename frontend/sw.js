const CACHE_NAME = 'britchoice-cache-v8';

// Install — skip waiting so new SW takes over immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Activate — clear all old caches, claim all clients, then tell them to reload
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => {
      // Take control of all open pages immediately
      return self.clients.claim();
    }).then(() => {
      // Tell every open tab to reload so they get fresh files
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'RELOAD' }));
      });
    })
  );
});

// Fetch — NETWORK FIRST strategy
// Always try the network first, cache the result, fall back to cache if offline
self.addEventListener('fetch', (e) => {
  const isSelfOrigin = e.request.url.startsWith(self.location.origin);
  const isApiOrAdmin = e.request.url.includes('/api/') || e.request.url.includes('/admin/');

  // Only intercept same-origin GET requests that aren't API/admin
  if (e.request.method !== 'GET' || !isSelfOrigin || isApiOrAdmin) {
    return;
  }

  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      // Cache successful responses for offline fallback
      const isStaticFile = e.request.url.match(/\.(js|css|json|woff2|ttf|ico|png)$/)
        || e.request.url === self.location.origin + '/';

      if (networkResponse.status === 200 && isStaticFile) {
        const cacheCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
      }
      return networkResponse;
    }).catch(() => {
      // Offline fallback — serve from cache
      return caches.match(e.request).then((cached) => {
        if (cached) return cached;
        // Last resort for navigation: return cached home page
        if (e.request.mode === 'navigate') return caches.match('/');
        return null;
      });
    })
  );
});
