// Offline cache. Bump VERSION on every release so players get the new files.
const VERSION = 'vb-1.0.0-11';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/main.js', 'js/game.js', 'js/ui.js', 'js/data.js', 'js/weapons.js', 'js/sprites.js',
  'js/audio.js', 'js/background.js', 'js/icons.js', 'js/save.js', 'js/util.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'fonts/orbitron.woff2', 'fonts/rajdhani-500.woff2', 'fonts/rajdhani-600.woff2', 'fonts/rajdhani-700.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && (new URL(e.request.url).origin === location.origin)) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('index.html'))),
  );
});
