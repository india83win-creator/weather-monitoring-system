const CACHE_NAME = 'aerocast-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static shell assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (e) => {
  const requestUrl = new URL(e.request.url);

  // Network-First with Cache Fallback for weather API routes
  if (requestUrl.pathname.includes('/api/weather')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Offline - serving weather from cache');
          return caches.match(e.request);
        })
    );
    return;
  }

  // Cache-First with Network Fallback for static assets and scripts
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Only cache successful standard HTTP/HTTPS resources
        if (
          networkResponse.status === 200 &&
          e.request.method === 'GET' &&
          !requestUrl.protocol.startsWith('chrome-extension') &&
          !requestUrl.pathname.includes('/src/main.jsx') // don't cache Vite main entry
        ) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Fetch failed and asset not cached:', err.message);
      });
    })
  );
});
