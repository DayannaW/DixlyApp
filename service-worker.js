// Nombre del caché (cambiar la versión cuando actualices la app)
const CACHE_NAME = 'mi-pwa-cache-v1';

// Archivos que queremos precargar
const FILES_TO_CACHE = [
  // HTML
  'index.html',
  'inicio.html',
  'historicoInsignias.html',
  'manifest.json',
  // Vistas
  'vistas/juego1/index.html',
  'vistas/juego1/juego1nivel1.html',
  'vistas/juego1/juego1nivel2.html',
  'vistas/juego1/juego1nivel3.html',
  'vistas/juego2/index.html',
  'vistas/juego2/juego2nivel1.html',
  'vistas/juego2/juego2nivel2.html',
  'vistas/juego2/juego2nivel3.html',
  'vistas/juego3/index.html',
  'vistas/juego3/juego3nivel1.html',
  'vistas/juego3/juego3nivel2.html',
  'vistas/juego3/juego3nivel3.html',
  'vistas/insignias.html',
  'vistas/resultados.html',
  // CSS
  'css/style.css',
  'css/juegos.css',
  'css/layout.css',
  'css/ui.css',
  'css/global.css',
  'css/instrucciones.css',
  'css/indexJuegos.css',
  'css/vistas/juego1nivel1.css',
  'css/vistas/juego1nivel2.css',
  'css/vistas/juego1nivel3.css',
  'css/vistas/inicio.css',
  'css/vistas/juego2nivel1.css',
  'css/vistas/juego2nivel2.css',
  'css/vistas/juego2nivel3.css',
  'css/vistas/index.css',
  // JS
  'js/main.js',
  'js/pwa.js',
  'js/util.js',
  'js/juego1nivel1.js',
  'js/juego1nivel2.js',
  'js/juego1nivel3.js',
  'js/juego2nivel1.js',
  'js/juego2nivel2.js',
  'js/juego2nivel3.js',
  'js/juego3nivel1.js',
  'js/juego3nivel2.js',
  'js/juego3nivel3.js',
  'js/insignias.js',
  'js/pet.js',
  'js/cofre_animacion.js',
  'js/lottie.min.js',
  'js/btn-review.html',
  // JSON data
  'js/data/badges.json',
  'js/data/juego1/nivel-dificil.json',
  'js/data/juego1nivel1/nivel-facil.json',
  'js/data/juego1nivel2/nivel-intermedio.json',
  'js/data/juego2/nivel-intermedio.json',
  'js/data/juego2/nivel1.json',
  'js/data/juego2/nivel3.json',
  'js/data/juego3/juego3nivel1.json',
  'js/data/juego3/juego3nivel2.json',
  'js/data/juego3/juego3nivel3.json',
  // Animaciones Lottie
  'assets/animaciones/cofre_abierto.json',
  'assets/animaciones/cofre_cerrado.json',
  'assets/animaciones/cofre.json',
  'assets/animaciones/pixel.json',
  // Imágenes
  'assets/imagenes/juego1.png',
  'assets/imagenes/juego2.png',
  'assets/imagenes/juego3.png',
  'assets/imagenes/pixel.png',
  'assets/imagenes/cuento1Juego1.jpg',
  'assets/imagenes/cuento1Juego1_2.png',
  'assets/imagenes/logoJuego1.jpg',
  'assets/imagenes/instrucciones_1_1.png',
  // Imágenes juego3
  'assets/imagenes/juego3/cofre.jpg',
  'assets/imagenes/juego3/bosque.jpg',
  'assets/imagenes/juego3/reloj.jpg',
  'assets/imagenes/juego3/jarro.jpg',
  'assets/imagenes/juego3/gorra.jpg',
  'assets/imagenes/juego3/cola_animal.jpg',
  'assets/imagenes/juego3/sombrero.jpg',
  'assets/imagenes/juego3/teclado.jpg',
  'assets/imagenes/juego3/llama_fuego.jpg',
  'assets/imagenes/juego3/hoja_papel.jpg',
  'assets/imagenes/juego3/ancla.jpeg',
  'assets/imagenes/juego3/clavo.jpg',
  'assets/imagenes/juego3/cola_fila.jpg',
  'assets/imagenes/juego3/vela_fuego.jpg',
  'assets/imagenes/juego3/puerta.jpg',
  'assets/imagenes/juego3/hoja_arbol.jpg',
  'assets/imagenes/juego3/ventana.jpg',
  'assets/imagenes/juego3/camino.jpg',
  'assets/imagenes/juego3/cebra.jpeg',
  'assets/imagenes/juego3/llama_animal.jpg',
  'assets/imagenes/juego3/arbol.jpg',
  'assets/imagenes/juego3/escalera.jpg',
  'assets/imagenes/juego3/puente.jpg',
  'assets/imagenes/juego3/plato.jpg',
  'assets/imagenes/juego3/barco.jpg',
  'assets/imagenes/juego3/llave.jpg',
  // Iconos y fonts
  'assets/iconos/iconApp.png',
  'assets/fonts/Lexend-Regular.ttf',
  'assets/fonts/Lexend/static/Lexend-Bold.ttf',
  'assets/fonts/Lexend/static/Lexend-Medium.ttf',
  'assets/fonts/Lexend/static/Lexend-Light.ttf',
  'assets/fonts/Lexend/static/Lexend-Thin.ttf',
  'assets/fonts/Lexend/static/Lexend-ExtraLight.ttf',
  'assets/fonts/Lexend/static/Lexend-ExtraBold.ttf',
  'assets/fonts/Lexend/static/Lexend-Black.ttf',
  'assets/fonts/Lexend/static/Lexend-SemiBold.ttf',
  'assets/fonts/Lexend/static/Lexend-Regular.ttf',
  // Sonidos y videos
  'assets/sonidos/correct.mp3',
  'assets/sonidos/wrong.mp3',
  'assets/sonidos/drag.mp3',
  'assets/sonidos/drop.mp3',
  'assets/sonidos/ruleta.mp3',
  'assets/sonidos/aparecer.mp3',
  'assets/sonidos/microcuento1.mp4',
  'assets/sonidos/microcuento2.mp4',
  'assets/sonidos/microcuento3.mp4',
  'assets/sonidos/cuentaRegresiva1.mp4',
  'assets/sonidos/cuentaRegresiva2.mp4',
  // Sonidos juego2 y juego2nivel3 (ejemplo, puedes agregar todos los mp3)
  'assets/sonidos/juego2/pero.mp3',
  'assets/sonidos/juego2/pollo.mp3',
  'assets/sonidos/juego2/lato.mp3',
  'assets/sonidos/juego2/abraso.mp3',
  'assets/sonidos/juego2/cartia.mp3',
  'assets/sonidos/juego2/rande.mp3',
  'assets/sonidos/juego2/masa.mp3',
  'assets/sonidos/juego2/lobo.mp3',
  'assets/sonidos/juego2/villa.mp3',
  'assets/sonidos/juego2/casa.mp3',
  'assets/sonidos/juego2/plato.mp3',
  'assets/sonidos/juego2/laca.mp3',
  'assets/sonidos/juego2/mesa.mp3',
  'assets/sonidos/juego2/brazo.mp3',
  'assets/sonidos/juego2/prisa.mp3',
  'assets/sonidos/juego2/osa.mp3',
  'assets/sonidos/juego2/barzo.mp3',
  'assets/sonidos/juego2/carta.mp3',
  'assets/sonidos/juego2/caino.mp3',
  'assets/sonidos/juego2/rosa.mp3',
  'assets/sonidos/juego2/perro.mp3',
  'assets/sonidos/juego2/mimo.mp3',
  'assets/sonidos/juego2/palo.mp3',
  'assets/sonidos/juego2/lisa.mp3',
  'assets/sonidos/juego2/cama.mp3',
  'assets/sonidos/juego2/lago.mp3',
  'assets/sonidos/juego2/ubre.mp3',
  'assets/sonidos/juego2/lugar.mp3',
  'assets/sonidos/juego2/trazo.mp3',
  'assets/sonidos/juego2/blazo.mp3',
  'assets/sonidos/juego2/camino.mp3',
  'assets/sonidos/juego2/pato.mp3',
  'assets/sonidos/juego2/lego.mp3',
  'assets/sonidos/juego2/lapa.mp3',
  'assets/sonidos/juego2/besa.mp3',
  'assets/sonidos/juego2/pata.mp3',
  'assets/sonidos/juego2/glande.mp3',
  'assets/sonidos/juego2/plado.mp3',
  'assets/sonidos/juego2/trenza.mp3',
  'assets/sonidos/juego2/fresa.mp3',
  'assets/sonidos/juego2/bollo.mp3',
  'assets/sonidos/juego2/cana.mp3',
  'assets/sonidos/juego2/nube.mp3',
  'assets/sonidos/juego2/carita.mp3',
  'assets/sonidos/juego2/caba.mp3',
  'assets/sonidos/juego2/perdo.mp3',
  'assets/sonidos/juego2/trade.mp3',
  'assets/sonidos/juego2/tarde.mp3',
  'assets/sonidos/juego2/gato.mp3',
  'assets/sonidos/juego2/misa.mp3',
  'assets/sonidos/juego2/cubre.mp3',
  'assets/sonidos/juego2/pardo.mp3',
  'assets/sonidos/juego2/loza.mp3',
  'assets/sonidos/juego2/prado.mp3',
  'assets/sonidos/juego2/silla.mp3',
  'assets/sonidos/juego2/lata.mp3',
  'assets/sonidos/juego2/saca.mp3',
  'assets/sonidos/juego2/pedro.mp3',
  'assets/sonidos/juego2/grande.mp3',
  'assets/sonidos/juego2/traer.mp3',
  // Sonidos juego2nivel3
  'assets/sonidos/juego2nivel3/audio_1.mp3',
  'assets/sonidos/juego2nivel3/audio_2.mp3',
  'assets/sonidos/juego2nivel3/audio_3.mp3',
  'assets/sonidos/juego2nivel3/audio_4.mp3',
  'assets/sonidos/juego2nivel3/audio_5.mp3',
  'assets/sonidos/juego2nivel3/audio_6.mp3',
  'assets/sonidos/juego2nivel3/audio_7.mp3',
  'assets/sonidos/juego2nivel3/audio_8.mp3',
  'assets/sonidos/juego2nivel3/audio_9.mp3',
  'assets/sonidos/juego2nivel3/audio_10.mp3',
  'assets/sonidos/juego2nivel3/audio_11.mp3',
  'assets/sonidos/juego2nivel3/audio_12.mp3',
  'assets/sonidos/juego2nivel3/audio_13.mp3',
  'assets/sonidos/juego2nivel3/audio_14.mp3',
  'assets/sonidos/juego2nivel3/audio_15.mp3',
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
