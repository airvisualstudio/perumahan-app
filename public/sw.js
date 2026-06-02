const CACHE_NAME = 'domus-somnia-crm-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network First, Fallback to Cache for API/Assets)
self.addEventListener('fetch', (event) => {
  // Avoid caching non-GET requests
  if (event.request.method !== 'GET') return;

  // Static assets or page requests
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache clone of valid response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request failed, redirect to root
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// Listen for message from client (simulate offline sync trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_OFFLINE_ATTENDANCE') {
    self.registration.showNotification('Absensi Disinkronisasi', {
      body: 'Data absensi offline Anda telah berhasil dikirim ke server.',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      vibrate: [100, 50, 100]
    });
  }
});
