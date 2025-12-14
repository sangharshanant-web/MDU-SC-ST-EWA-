// Service Worker for MDU SC/ST EWA App
const CACHE_NAME = 'mdu-ewa-v1-secure';

// Install event - Cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Immediately control all pages
    })
  );
});

// Fetch event - Network first, fall back to cache for freshness (Auto Update behavior)
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like CDN for now to avoid opaque response issues in basic implementation
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('esm.sh')) {
     return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and cache it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          // Allow esm.sh CDN caching
          if (event.request.url.includes('esm.sh') && response.type === 'cors') {
             // continue to cache
          } else if (response.type !== 'basic' && response.type !== 'cors') {
             return response;
          }
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});