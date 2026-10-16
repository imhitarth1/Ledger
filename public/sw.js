const CACHE_NAME = 'ledger-pwa-v4';
const BASE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(BASE_ASSETS);
      try {
        const response = await fetch('/index.html');
        if (response.ok) {
          const html = await response.text();
          const assetUrls = [];
          const scriptMatches = html.matchAll(/src=["'](\/assets\/[^"']+)["']/g);
          for (const match of scriptMatches) {
            assetUrls.push(match[1]);
          }
          const linkMatches = html.matchAll(/href=["'](\/assets\/[^"']+)["']/g);
          for (const match of linkMatches) {
            assetUrls.push(match[1]);
          }
          if (assetUrls.length > 0) {
            await Promise.all(
              assetUrls.map((url) =>
                fetch(url).then((res) => {
                  if (res.ok) {
                    return cache.put(url, res);
                  }
                }).catch(() => {})
              )
            );
          }
        }
      } catch {
        // Continue if dynamic asset fetching fails
      }
    })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
