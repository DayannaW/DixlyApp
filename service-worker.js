// Nombre del caché (cambiar la versión cuando actualices la app)
const CACHE_NAME = 'mi-pwa-cache-v1';

// Archivos que queremos precargar
const FILES_TO_CACHE = [

  // Inicio/
  'inicio.html',
  'index.php',

  // Manifest
  'manifest.json',

  // CSS
  'css/style.css',
  'css/juegos.css',

  // JS
  'js/main.js',
  'js/pwa.js',
  'js/util.js',
  'js/juego1.js',
  'js/juego2.js',
  'js/juego3.js',

  // Otras vistas
  'vistas/juego1.html',
  'vistas/juego2.html',
  'vistas/juego3.html',
  'vistas/resultados.html',

  // Imágenes y fonts esenciales
  'assets/imagenes/coheteBienvenida.gif',
  'assets/fonts/Lexend-Regular.ttf'
];

// Instalación del service worker: precarga los archivos en cache
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precargando archivos');
        caches.open(CACHE_NAME).then(cache => {
            FILES_TO_CACHE.forEach(url => {
              cache.add(url).catch(err => console.error('E c:', url, err));
            });
          });
         // return;
        return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activación: limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activado');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminando cache viejo', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: intercepta solicitudes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devuelve archivo desde cache
        return cachedResponse;
      }

      // Si no está en cache, intenta buscar en la red
      return fetch(event.request)
        .then((networkResponse) => {
          // Solo cachear respuestas válidas (status 200)
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clonar la respuesta para cachearla
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Fallback offline para HTML
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('inicio.html');
          }
        });
    })
  );
});
