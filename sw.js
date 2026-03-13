const CACHE = 'genesis-monaco-editor-v3';
const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs';

// Files to cache on install
const PRECACHE = [
  './',
  './index.html',
  `${MONACO_BASE}/loader.min.js`,
  `${MONACO_BASE}/editor/editor.main.js`,
  `${MONACO_BASE}/editor/editor.main.css`,
  `${MONACO_BASE}/editor/editor.main.nls.js`,
  `${MONACO_BASE}/base/worker/workerMain.js`,
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
      .catch(() => {}) // don't fail install if CDN unreachable
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Cache-first for Monaco CDN assets
  if (e.request.url.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first for app shell
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
