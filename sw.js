// V80 FINAL - KILL ALL CACHE - يمنع تعليق الدخول نهائيا
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))));
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  e.respondWith(fetch(e.request, {cache:'no-store'}).catch(()=>fetch(e.request)));
});
