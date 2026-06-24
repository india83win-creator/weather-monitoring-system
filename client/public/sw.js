// AeroCast Service Worker — Network-First strategy
// Bump this version on every deploy to force cache invalidation on mobile
const CACHE_VERSION = 'aerocast-v4';
const STATIC_ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.json'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (e) => {
  // Take over immediately — don't wait for old SW to idle out
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[SW] Pre-caching static shell');
      // Use individual try/catch so one missing asset doesn't break the whole install
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn(`[SW] Could not pre-cache ${url}:`, err.message)
          )
        )
      );
    })
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Ignore non-GET, chrome-extension, and cross-origin requests (e.g. API calls)
  if (
    request.method !== 'GET' ||
    url.protocol.startsWith('chrome-extension') ||
    url.origin !== location.origin
  ) {
    return;
  }

  // API routes: pass straight through — no caching for live weather data
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // JS / CSS bundles & index.html: NETWORK-FIRST
  // This ensures fresh code from Vercel is always loaded after a deploy.
  // Falls back to cache only if network is completely unavailable.
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    e.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.warn('[SW] Network failed for', url.pathname, '— serving from cache');
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets (images, fonts, icons): CACHE-FIRST, network fallback
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[SW] Asset not cached and network failed:', url.pathname, err.message);
      });
    })
  );
});
