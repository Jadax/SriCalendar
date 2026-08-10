const CACHE_NAME = 'sri-calendar-shell-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', '/illustrations/flower.svg', '/illustrations/camera.svg', '/illustrations/sparkle.svg'];

/** Pre-caches the stable application shell and activates this worker promptly. */
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())); });

/** Removes obsolete app-shell versions without touching IndexedDB calendar data. */
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('sri-calendar-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });

/** Serves same-origin assets cache-first and navigations network-first with offline fallback. */
self.addEventListener('fetch', (event) => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') { event.respondWith(fetch(request).then((response) => { const copy = response.clone(); void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)); return response; }).catch(() => caches.match('/index.html'))); return; }
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then((response) => { if (response.ok) { const copy = response.clone(); void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)); } return response; })));
});
