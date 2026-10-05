/* Service worker: guarda el juego en el teléfono para jugar sin internet. */
const VERSION = 'aventura-familiar-v1';
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest',
  './js/motor.js', './js/arte.js', './js/niveles.js', './js/ui.js',
  './js/entidades.js', './js/juego.js', './js/escenas.js', './js/main.js',
  './assets/portada.jpg', './assets/escena-mision.jpg',
  './assets/deco-maquina.png', './assets/deco-terminal.png',
  './assets/carta-joshua.png', './assets/carta-jacob.png', './assets/carta-jazzlyn.png', './assets/carta-randy.png',
  './assets/cara-joshua.png', './assets/cara-jacob.png', './assets/cara-jazzlyn.png', './assets/cara-randy.png',
  './assets/icono-192.png', './assets/icono-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
      const copia = resp.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copia)).catch(() => {});
      return resp;
    }))
  );
});
