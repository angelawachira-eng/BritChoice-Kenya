const CACHE_NAME = 'britchoice-cache-v5';
const ASSETS = [
  '/',
  '/static/style.css',
  '/static/app.js',
  '/static/manifest.json',
  '/static/icon-192.png',
  '/static/icon-512.png'
];

// Cache core assets on installation
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log("Cache compilation deferred:", err));
    })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercept network requests cleanly
self.addEventListener('fetch', (e) => {
  // 1. Only intercept GET requests from our own origin, excluding API, Admin, and media
  const isSelfOrigin = e.request.url.startsWith(self.location.origin);
  const isApiOrAdmin = e.request.url.includes('/api/') || e.request.url.includes('/admin/');
  
  if (e.request.method !== 'GET' || !isSelfOrigin || isApiOrAdmin) {
    return; // Pass through natively at full speed
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Return cached version instantly (CSS, JS, html)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request).then((networkResponse) => {
        // Cache core static files on the fly (CSS, JS, fonts, json)
        // Avoid caching images dynamically to save system resources and network overhead
        const isStaticFile = e.request.url.match(/\.(js|css|json|woff2|ttf|ico|png)$/) || e.request.url === self.location.origin + '/';
        
        if (networkResponse.status === 200 && isStaticFile) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Only fallback to root index.html for page navigation, NEVER for images
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
        // Let image/style requests fail naturally without breaking layouts
        return null;
      });
    })
  );
});
