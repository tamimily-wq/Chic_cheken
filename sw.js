const CACHE_NAME = 'restaurant-v44-offline-full';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192.jpg',
  './icon-512.jpg'
];

// تثبيت - حفظ الملفات الأساسية
self.addEventListener('install', event => {
  console.log('SW v44: Install - Offline Full Support');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ App shell cached - Ready for offline');
        return self.skipWaiting();
      })
  );
});

// تفعيل - تنظيف الكاش القديم
self.addEventListener('activate', event => {
  console.log('SW v44: Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// جلب - استراتيجية Network first مع fallback للكاش
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // تجاهل طلبات Firebase - اتركها للمتصفح (مع persistence)
  if (url.hostname.includes('firestore') || 
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firebaseio')) {
    // للـ Firebase: حاول الشبكة، إذا فشل لا تفعل شيء (persistence سيتكفل)
    return;
  }
  
  // للصفحات (navigation): Network first, fallback to cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // حفظ نسخة في الكاش
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          console.log('📴 Offline - serving cached index.html');
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }
  
  // للملفات الأخرى: Cache first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // وجد في الكاش، أرجعه وحاول تحديثه في الخلفية
          fetch(request).then(networkResponse => {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, networkResponse);
            });
          }).catch(() => {});
          return cachedResponse;
        }
        
        // غير موجود في الكاش، جرب الشبكة
        return fetch(request)
          .then(networkResponse => {
            // احفظ في الكاش
            if (request.method === 'GET' && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // فشل الشبكة والكاش
            console.log('❌ Offline and not in cache:', request.url);
          });
      })
  );
});

// رسائل من التطبيق
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
