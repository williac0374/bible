// Simple service worker for offline support.
// Edit PRECACHE_URLS to include all pages/assets you want precached.

const CACHE_NAME = 'bible-cache-v1';
const PRECACHE_URLS = [
  '/',              // root
  '/index.html',    // main page - update if your entry filename differs
  '/offline.html',  // offline fallback
  // add other static assets you want cached, e.g.:
  // '/styles.css',
  // '/main.js',
  // '/chapters/chapter1.html',
];

self.addEventListener('install', (event) => {
  // Pre-cache important resources
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => {
        console.error('Precache failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Navigation requests (HTML pages) -> network-first with cache fallback to offline page
  if (event.request.mode === 'navigate' ||
      (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Put a copy in cache for later
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // For other requests (assets) -> cache-first, then network on miss
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Cache fetched asset for later
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          // Optional: return a fallback for images/styles if desired
          return cached; // likely undefined -> browser will handle
        });
    })
  );
});
