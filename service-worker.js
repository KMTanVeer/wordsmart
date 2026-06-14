const CACHE_NAME = 'vocabsart-v27';

// Core files to pre-cache on install (using relative paths for subpath support)
const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.json',
  'avatar.jpg',
  'file.svg',
  'vocabsart-icon.svg',
  'app-icon.png',
  'icons/favicon.png',
  'icons/app-logo.png'
];

// Google Fonts CDN origins we want to cache at runtime
const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// ---- Install: pre-cache core assets ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: remove old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: serve based on strategy ----
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Google Fonts: cache-first (works offline after first visit)
  if (FONT_ORIGINS.some(origin => request.url.startsWith(origin))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(err => {
            if (cached) return cached;
            return Promise.reject(err);
          });
        })
      )
    );
    return;
  }

  // Same-origin document requests (index.html or root): Stale-While-Revalidate
  const isDoc = url.origin === self.location.origin && 
                (url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html'));
  
  if (isDoc) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          const fetched = fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            // Offline: fallback silently to cached response
          });
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Same-origin assets (CSS, JS, images, icons): Cache-First with Network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // All other requests (e.g. external links): Network only
  event.respondWith(fetch(request));
});
