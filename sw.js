const CACHE_NAME = 'restaurant-v50-phone-fix-2026';
const urlsToCache = [
  './',
  './index.html?v=50',
  './manifest.json?v=50',
  './icon-192.png',
  './icon-512.png',
  './icon-192.jpg',
  './icon-512.jpg'
];

// تثبيت - حفظ الملفات الأساسية
self.addEventListener('install', event => {
  console.log('SW v50: Install - Phone Fix - Force Update');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell v50');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ App shell v50 cached - Ready for offline');
        return self.skipWaiting();
      })
  );
});

// تفعيل - تنظيف الكاش القديم بقوة
self.addEventListener('activate', event => {
  console.log('SW v50: Activate - Cleaning all old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Old caches cleaned, claiming clients');
      return self.clients.claim();
    }).then(() => {
      // Force reload all clients to get new version
      return self.clients.matchAll({type: 'window'}).then(clients => {
        clients.forEach(client => {
          client.postMessage({type: 'SW_UPDATED', version: 'v50'});
        });
      });
    })
  );
});

// جلب - Network first for HTML to always get latest
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // تجاهل طلبات Firebase
  if (url.hostname.includes('firestore') || 
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firebaseio')) {
    return;
  }
  
  // للصفحات: Network first ALWAYS to avoid stale cache
  if (request.mode === 'navigate' || request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, {cache: 'no-store'})
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          console.log('📴 Offline - serving cached index.html v50');
          return caches.match('./index.html') || caches.match('./index.html?v=50') || caches.match('./');
        })
    );
    return;
  }
  
  // للملفات الأخرى: Cache first with background update
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          fetch(request).then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, networkResponse);
            });
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(request)
          .then(networkResponse => {
            if (request.method === 'GET' && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.log('❌ Offline and not in cache:', request.url);
          });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});
