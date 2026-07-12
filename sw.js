// V81 - NO CACHE - يمنع تعليق الدخول نهائيا - لا يخزن شي
self.addEventListener('install', e=>{ self.skipWaiting(); e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{ e.respondWith(fetch(e.request, {cache:'no-store', credentials:'omit'})); });
