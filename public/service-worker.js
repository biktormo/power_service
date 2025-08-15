const CACHE_NAME = 'power-service-cache-v1';

// Se activa cuando el navegador instala el service worker por primera vez
self.addEventListener('install', (event) => {
  // Forzamos al nuevo service worker a activarse inmediatamente
  event.waitUntil(self.skipWaiting());
});

// Se activa después de la instalación, limpia cachés antiguos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepta las peticiones de red
self.addEventListener('fetch', (event) => {
  // Estrategia: "Network Falling Back to Cache"
  // 1. Intenta obtener el recurso de la red.
  // 2. Si falla (estás offline), intenta obtenerlo del caché.
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si la petición a la red tiene éxito, la guardamos en caché para el futuro
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Si la petición a la red falla, buscamos en el caché
        return caches.match(event.request);
      })
  );
});