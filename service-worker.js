const CACHE_NAME = 'bible-app-cache-v1';
const urlsToCache = [
  '/bible/',
  '/bible/index.html',
  '/bible/manifest.json',
  '/bible/icon-512.png',

  // 👇 add your JSON data files here
  '/bible/kjv/books.json',
  '/bible/kjv/chapters.json',
  '/bible/kjv/verses.json'
];

// Install event — caches files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
