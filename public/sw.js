const CACHE_NAME = 'mishnah-yomit-v1';
const SEFARIA_CACHE = 'mishnah-sefaria-v1';

// App shell to cache
const APP_SHELL = [
  '/',
  '/index.html',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== SEFARIA_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Vite dev server resources (HMR, React Refresh, etc.)
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // Cache Sefaria API responses for offline use
  if (url.hostname === 'www.sefaria.org') {
    event.respondWith(
      caches.open(SEFARIA_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'offline' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // Network first, fall back to cache for app resources
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
      .then((response) => {
        return response || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
