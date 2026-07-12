// V75 - NO CACHE - يقتل كاش V11 نهائيا
self.addEventListener('install', e => {
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // لا تخزن شي - جيب ديما من الشبكة
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
