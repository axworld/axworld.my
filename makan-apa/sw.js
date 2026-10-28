/**
 * MAKAN APA? - Official Service Worker (Offline-First Edition)
 * Co-Architects: Khairul Azzumie & Mia
 * Domain: axworld.my/makan-apa/
 */

const CACHE_NAME = 'makan-apa-core-v1';

// Senarai aset wajib simpan dalam memori telefon
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './restaurants.json',
  './logo.png',
  './manifest.json'
];

// 1. Fasa Pasang (Install) & Simpan Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [Service Worker] Memuat turun aset teras ke memori...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Fasa Aktif (Activate) & Bersihkan Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 [Service Worker] Membuang cache usang:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fasa Panggilan Rangkaian (Cache-First + Ignore Query Search)
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    // ✨ Tambah { ignoreSearch: true } supaya app.js?v=... tetap padan dengan cache!
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    }).catch(() => {
      if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
        return caches.match('./index.html');
      }
    })
  );
});