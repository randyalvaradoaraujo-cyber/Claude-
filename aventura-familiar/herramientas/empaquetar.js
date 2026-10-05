#!/usr/bin/env node
/* Genera una versión del juego en UN SOLO archivo HTML (scripts e imágenes
   incrustados), lista para descargar y abrir en el teléfono sin servidor.
   Uso: node herramientas/empaquetar.js [salida.html] */
'use strict';
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const salida = path.resolve(process.argv[2] || path.join(raiz, 'aventura-familiar.html'));
const leer = (r) => fs.readFileSync(path.join(raiz, r));
const dataUri = (r) => {
  const tipo = r.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${tipo};base64,${leer(r).toString('base64')}`;
};

let html = leer('index.html').toString('utf8');
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '');
html = html.replace(/href="(assets\/icono-192\.png)"/g, (_, r) => `href="${dataUri(r)}"`);
html = html.replace(/<script src="(js\/[\w-]+\.js)"><\/script>/g, (_, r) => {
  let js = leer(r).toString('utf8');
  if (r === 'js/arte.js') js = js.replace(/'(assets\/[\w-]+\.(?:png|jpg))'/g, (m, a) => `'${dataUri(a)}'`);
  return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
});
fs.writeFileSync(salida, html);
console.log(`Listo: ${salida} (${(fs.statSync(salida).size / 1024 / 1024).toFixed(2)} MB)`);
