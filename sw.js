const CACHE_NAME = 'restaurant-v60-gold-clean';
const urlsToCache = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  console.log('SW v60 Gold: Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('SW v60 Gold: Activate - cleaning old');
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.map(n => { if(n !== CACHE_NAME) return caches.delete(n); })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if(url.hostname.includes('firebase') || url.hostname.includes('firestore') || url.hostname.includes('googleapis')) return;
  if(req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if(req.method === 'GET' && res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
      }
      return res;
    }))
  );
});
