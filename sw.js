const CACHE_NAME = 'restaurant-v60-complete-fix';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  console.log('SW v60: Install - Complete Fix');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching v60');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ SW v60 cached');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('SW v60: Activate - Cleaning old caches');
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
      console.log('✅ Old caches cleaned');
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({type: 'window'}).then(clients => {
        clients.forEach(client => {
          client.postMessage({type: 'SW_UPDATED', version: 'v60'});
        });
      });
    })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // تجاهل Firebase
  if (url.hostname.includes('firestore') || 
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firebaseio')) {
    return;
  }
  
  // HTML: Network first
  if (request.mode === 'navigate' || request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request, {cache: 'no-store'})
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          console.log('📴 Offline - serving cached');
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }
  
  // Others: Cache first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(res => {
        if(request.method === 'GET' && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return res;
      }).catch(() => {
        console.log('❌ Offline not in cache:', request.url);
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => names.forEach(n => caches.delete(n)));
  }
});
