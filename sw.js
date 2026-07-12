// V79 - KILL ALL CACHE - حل نهائي لمشكلة الدخول العالق
self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))));
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  // لا تخزن شي - جيب من الشبكة مباشرة
  e.respondWith(fetch(e.request, {cache:'no-store'}).catch(()=>fetch(e.request)));
});
