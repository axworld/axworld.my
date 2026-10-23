const CACHE_NAME = "makan-apa-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/style.css",
  "/app.js",
  "/logo.png",
  "/manifest.json"
];

// Pasang aset ke memori telefon
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Menyimpan aset asas Makan Apa? ke dalam memori...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Bersihkan cache lama jika ada versi baharu
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🧹 Memadamkan cache lama:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategi: Muat turun dari rangkaian dulu, jika offline guna cache
self.addEventListener("fetch", (event) => {
  // Jangan cache panggilan API data restoran supaya data sentiasa terkini
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});