// public/service-worker.js

const CACHE_NAME = 'power-service-cache-v3'; // Incrementamos la versión para forzar la actualización
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Añade aquí la ruta a tu favicon y logo si están en /public
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalación: Cacheamos los archivos estáticos principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto, añadiendo app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación: Limpiamos cachés antiguos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});

// Fetch: Servimos desde caché si es posible, si no, vamos a la red
self.addEventListener('fetch', (event) => {
  // --- ESTA ES LA LÓGICA CLAVE ---
  // 1. Ignoramos todas las peticiones que no sean GET (como POST a Firebase)
  if (event.request.method !== 'GET') {
    return;
  }
  // 2. Ignoramos las peticiones de extensiones de Chrome
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  // 3. Ignoramos las peticiones a la API de Firebase (siempre queremos datos frescos)
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebasestorage.googleapis.com')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si encontramos una respuesta en caché, la devolvemos
        if (response) {
          return response;
        }
        // Si no, vamos a la red
        return fetch(event.request);
      })
  );
});