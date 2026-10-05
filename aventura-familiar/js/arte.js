'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — arte.js
   Imágenes de portada, sprites pixel-art generados por código,
   casillas del mapa y fondos de ciudad neón con paralaje.
   ===================================================================== */

const IMG = {};
const RUTAS_IMG = {
  portada: 'assets/portada.jpg',
  escena: 'assets/escena-mision.jpg',
  maquina: 'assets/deco-maquina.png',
  terminal: 'assets/deco-terminal.png',
  carta_joshua: 'assets/carta-joshua.png',
  carta_jacob: 'assets/carta-jacob.png',
  carta_jazzlyn: 'assets/carta-jazzlyn.png',
  carta_randy: 'assets/carta-randy.png',
  cara_joshua: 'assets/cara-joshua.png',
  cara_jacob: 'assets/cara-jacob.png',
  cara_jazzlyn: 'assets/cara-jazzlyn.png',
  cara_randy: 'assets/cara-randy.png',
};

function cargarImagenes(alAvanzar) {
  const lista = Object.entries(RUTAS_IMG);
  let listos = 0;
  return Promise.all(lista.map(([k, src]) => new Promise((res) => {
    const im = new Image();
    const fin = (ok) => { IMG[k] = ok ? im : null; listos++; alAvanzar(listos / lista.length); res(); };
    im.onload = () => fin(true);
    im.onerror = () => fin(false);
    im.src = src;
  })));
}

/* --------------------------- Utilidades de pixel --------------------- */
function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); }
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }

function mapaPix(g, filas, pal, ox, oy) {
  for (let r = 0; r < filas.length; r++) {
    const f = filas[r];
    for (let i = 0; i < f.length; i++) {
      const c = pal[f[i]];
      if (c) px(g, ox + i, oy + r, c);
    }
  }
}

function brocha(g, x0, y0, x1, y1, w, color) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  g.fillStyle = color;
  const o = Math.floor(w / 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    g.fillRect(Math.round(x0 + (x1 - x0) * t) - o, Math.round(y0 + (y1 - y0) * t) - o, w, w);
  }
}

function circulo(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y));
    g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}

// Contorno automático de 1px alrededor de todo lo opaco.
function contornear(c, color = '#140f20') {
  const g = c.getContext('2d');
  const w = c.width, h = c.height;
  const im = g.getImageData(0, 0, w, h);
  const a = im.data;
  const marca = new Uint8Array(w * h);
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 100;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (op(x, y)) continue;
      if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) marca[y * w + x] = 1;
    }
  }
  const r = parseInt(color.slice(1, 3), 16), gg = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
  for (let i = 0; i < marca.length; i++) {
    if (!marca[i]) continue;
    a[i * 4] = r; a[i * 4 + 1] = gg; a[i * 4 + 2] = b; a[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c;
}

function espejo(c) {
  const f = lienzo(c.width, c.height);
  const g = f.getContext('2d');
  g.translate(c.width, 0);
  g.scale(-1, 1);
  g.drawImage(c, 0, 0);
  return f;
}

// Copia teñida (para destellos de daño o congelado)
function tenir(c, color, alfa = 1) {
  const f = lienzo(c.width, c.height);
  const g = f.getContext('2d');
  g.drawImage(c, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alfa;
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return f;
}

function dibujarCubrir(g, img, x, y, w, h, focoY = 0.5) {
  if (!img) { rect(g, x, y, w, h, '#1a1640'); return; }
  const ri = img.width / img.height, rd = w / h;
  let sw, sh, sx, sy;
  if (ri > rd) { sh = img.height; sw = sh * rd; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / rd; sx = 0; sy = (img.height - sh) * focoY; }
  g.save();
  g.imageSmoothingEnabled = true;
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  g.restore();
}

function dibujarSuave(g, img, sx, sy, sw, sh, x, y, w, h) {
  if (!img) return;
  g.save();
  g.imageSmoothingEnabled = true;
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  g.restore();
}

/* --------------------------- Personajes ------------------------------ */
const APARIENCIA = {
  joshua: {
    piel: '#c68a5e', pielS: '#9c6440', pelo: '#1c1411', peloH: '#45332a', ceja: '#1c1411',
    camisa: '#2f5bd0', camisaS: '#22419c', manga: '#2f5bd0', mangaS: '#22419c',
    pantalon: '#2b3050', pantalonS: '#1d2136', zapato: '#eceaf4', zapatoS: '#a2a6bf',
    torso: 10, ancho: 12, piernas: 8, grosor: 4, boca: 'bigote',
  },
  jacob: {
    piel: '#c08055', pielS: '#93603c', pelo: '#22170f', peloH: '#4d3524', ceja: '#2a1c12',
    camisa: '#2f9be8', camisaS: '#1f74b9', manga: '#1d1d2b', mangaS: '#121220',
    pantalon: '#6c7184', pantalonS: '#4f5366', zapato: '#f4f4f8', zapatoS: '#a0a6bc',
    torso: 9, ancho: 10, piernas: 7, grosor: 3, boca: 'sonrisa',
  },
  jazzlyn: {
    piel: '#e6ae88', pielS: '#c28565', pelo: '#3c2620', peloH: '#71493a', ceja: '#3c2620',
    lazo: '#f7a8e6', lazoS: '#c45fb2', vestido: '#ebe7f7', vestidoS: '#b9bddf', brillo: '#ffffff', brillo2: '#c9b8ff',
    cinta: '#e7a3ea', falda: '#f3c3ef', faldaS: '#d39be6', manga: '#e6ae88', mangaS: '#c28565',
    pantalon: '#e6ae88', pantalonS: '#c28565', zapato: '#ff86cf', zapatoS: '#c9529c',
    torso: 9, ancho: 10, piernas: 5, grosor: 3, boca: 'sonrisa', rubor: true, peloLargo: true,
  },
  randy: {
    piel: '#d39a6c', pielS: '#a8734e', pelo: '#121018', peloH: '#33304a', ceja: '#121018',
    camisa: '#5a8640', camisaS: '#40622e', manga: '#5a8640', mangaS: '#40622e',
    chaleco: '#2b3328', chalecoS: '#1c211a', parche: '#d6d6d6',
    pantalon: '#252c40', pantalonS: '#181d2c', zapato: '#22222a', zapatoS: '#0c0c10', reloj: '#3ff3ff',
    torso: 10, ancho: 12, piernas: 9, grosor: 4, boca: 'seria',
  },
  agente: {
    piel: '#c99470', pielS: '#a07050', camisa: '#22243c', camisaS: '#16172a', manga: '#22243c', mangaS: '#16172a',
    pantalon: '#16182a', pantalonS: '#0f101e', zapato: '#0b0b12', zapatoS: '#000000',
    torso: 10, ancho: 12, piernas: 8, grosor: 4, casco: true,
  },
};
for (const k in APARIENCIA) APARIENCIA[k].id = k;

const PELO = {
  joshua: [
    '...h.hh.hh.h....',
    '..hhhhhhhhhhhh..',
    '.hhHhhHhhhHhhhh.',
    'hhhhhHhhHhhhHhhh',
    'hhHhhhhhhhhHhhhh',
    'hhhhHhhhHhhhhhhh',
    'hhhhhhhhhhhhhHhh',
    'hhHhhhhhhhhhhhhh',
    'hhhh.hh.hhh.hhhh',
    '.hh..........hh.',
  ],
  jacob: [
    '................',
    '.....h.hh.h.....',
    '...hhhhhhhhhh...',
    '..hhHhhhHhhhHh..',
    '.hhhhhHhhhhhhhh.',
    '.hHhhhhhhHhhhHh.',
    'hhhhhHhhhhhhhhhh',
    'hhhhhhhhhhhHhhhh',
    'hhh.hhh.hhh.hhhh',
    '.hh..........hh.',
  ],
  jazzlyn: [
    '...bbb....bbb...',
    '..bBbbb..bbbBb..',
    '..bbBbbBBbbBbb..',
    '...bbhhBBhhbb...',
    '..hhhhhhHhhhhh..',
    '.hhhhhhhHhhhhhh.',
    '.hhhhhhhHhhhhhh.',
    'hhhhhhhhHhhhhhhh',
    'hhhhh......hhhhh',
    'hhh..........hhh',
    'hhh..........hhh',
    'hhh..........hhh',
    'hhh..........hhh',
    'hh............hh',
    'hh............hh',
    'hh............hh',
  ],
  randy: [
    '................',
    '................',
    '....hhhhhhhh....',
    '...hhhhhhhhhhh..',
    '..hhhhhHHhhhhhh.',
    '..hhhhhhhhhhHhh.',
    '.hhhhhhhhhhhhhhh',
    '.hhhhhhhhhhhhhhh',
    '.hhhhh.hhhhhh.hh',
    '.hh.......hh..hh',
    '.h............h.',
  ],
};

const CARA_FILAS = { 5: [4, 11], 6: [3, 12], 7: [2, 13], 8: [2, 13], 9: [2, 13], 10: [2, 13], 11: [2, 13], 12: [2, 13], 13: [3, 12], 14: [4, 11], 15: [5, 10] };

function dibujarCabeza(g, d, hx, hy, p) {
  if (d.casco) {
    const filas = { 2: [5, 10], 3: [3, 12], 4: [2, 13], 5: [2, 13], 6: [1, 14], 7: [1, 14], 8: [1, 14], 9: [1, 14], 10: [1, 14], 11: [1, 14], 12: [1, 14], 13: [2, 13], 14: [3, 12], 15: [4, 11] };
    for (const r in filas) { const [a, b] = filas[r]; rect(g, hx + a, hy + +r, b - a + 1, 1, '#2b2d46'); }
    rect(g, hx + 3, hy + 3, 4, 2, '#4a4d70');
    rect(g, hx + 2, hy + 5, 2, 4, '#3b3e5e');
    rect(g, hx + 4, hy + 9, 11, 3, '#ff3f6b');
    rect(g, hx + 4, hy + 11, 11, 1, '#b0204a');
    px(g, hx + 11, hy + 9, '#ffc0d4');
    px(g, hx + 12, hy + 9, '#ffc0d4');
    rect(g, hx + 6, hy + 13, 6, 1, '#1b1c30');
    px(g, hx + 13, hy + 1, '#ff3f6b');
    rect(g, hx + 13, hy + 2, 1, 2, '#4a4d70');
    return;
  }
  for (const r in CARA_FILAS) { const [a, b] = CARA_FILAS[r]; rect(g, hx + a, hy + +r, b - a + 1, 1, d.piel); }
  for (let r = 7; r <= 13; r++) px(g, hx + 2, hy + r, d.pielS);
  rect(g, hx + 3, hy + 13, 1, 1, d.pielS);
  // orejas
  rect(g, hx + 1, hy + 10, 1, 2, d.pielS);
  rect(g, hx + 14, hy + 10, 1, 2, d.piel);
  // ojos (mirando a la derecha)
  if (p.herido) {
    rect(g, hx + 5, hy + 11, 3, 1, '#1b1424');
    rect(g, hx + 10, hy + 11, 3, 1, '#1b1424');
  } else if (p.feliz) {
    rect(g, hx + 5, hy + 10, 3, 1, '#1b1424'); px(g, hx + 5, hy + 11, '#1b1424'); px(g, hx + 7, hy + 11, '#1b1424');
    rect(g, hx + 10, hy + 10, 3, 1, '#1b1424'); px(g, hx + 10, hy + 11, '#1b1424'); px(g, hx + 12, hy + 11, '#1b1424');
  } else {
    for (const ex of [5, 10]) {
      rect(g, hx + ex, hy + 10, 1, 2, '#ffffff');
      rect(g, hx + ex + 1, hy + 10, 2, 2, '#1b1424');
      px(g, hx + ex + 2, hy + 10, '#6c5a7a');
    }
  }
  // cejas
  const grosorCeja = d.boca === 'sonrisa' ? 2 : 3;
  rect(g, hx + 5 + (3 - grosorCeja), hy + 9, grosorCeja, 1, d.ceja);
  rect(g, hx + 10, hy + 9, grosorCeja, 1, d.ceja);
  // nariz
  px(g, hx + 9, hy + 12, d.pielS);
  // boca
  if (p.herido) {
    rect(g, hx + 8, hy + 13, 2, 2, '#5a1e24');
  } else if (d.boca === 'bigote') {
    rect(g, hx + 7, hy + 13, 5, 1, '#4a2e22');
    rect(g, hx + 8, hy + 14, 3, 1, '#83383a');
  } else if (d.boca === 'sonrisa' || p.feliz) {
    rect(g, hx + 8, hy + 13, 3, 1, '#8f3438');
    px(g, hx + 7, hy + 12, '#8f3438');
    px(g, hx + 11, hy + 12, '#8f3438');
  } else {
    rect(g, hx + 8, hy + 13, 3, 1, '#7b4036');
  }
  if (d.rubor) { px(g, hx + 4, hy + 12, '#f08a96'); px(g, hx + 12, hy + 12, '#f08a96'); }
  // pelo
  mapaPix(g, PELO[d.id], { h: d.pelo, H: d.peloH, b: d.lazo, B: d.lazoS }, hx, hy);
}

function dibujarPierna(g, d, hx, hy, L, frente) {
  const w = d.grosor;
  const col = frente ? d.pantalon : d.pantalonS;
  const fx = hx + (L.dx || 0);
  const fy = 39 - (L.alza || 0);
  const fin = Math.max(hy, fy - 2);
  const n = Math.max(1, fin - hy);
  for (let y = hy; y <= fin; y++) {
    const t = (y - hy) / n;
    const x = Math.round(hx + (fx - hx) * t);
    const c = d.id === 'jazzlyn' ? (frente ? d.piel : d.pielS) : col;
    rect(g, x, y, w, 1, c);
  }
  rect(g, fx, fy - 1, w + 2, 1, frente ? d.zapato : d.zapatoS);
  rect(g, fx, fy, w + 2, 1, d.zapatoS);
}

function dibujarPatada(g, d, hx, hy) {
  brocha(g, hx + 1, hy + 1, hx + 9, hy + 2, 3, d.pantalon);
  rect(g, hx + 9, hy - 1, 3, 5, d.zapato);
  rect(g, hx + 12, hy, 1, 4, d.zapatoS);
}

function dibujarBrazo(g, d, sx, sy, A, frente, p) {
  const hx = sx + (A.dx || 0), hy = sy + 7 + (A.dy || 0);
  const piel = frente ? d.piel : d.pielS;
  const manga = frente ? d.manga : (d.mangaS || d.manga);
  if (frente) brocha(g, sx, sy, hx, hy, 5, '#140f20');
  const n = Math.max(1, Math.round(Math.max(Math.abs(hx - sx), Math.abs(hy - sy))));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(sx + (hx - sx) * t), y = Math.round(sy + (hy - sy) * t);
    rect(g, x - 1, y - 1, 3, 3, t < 0.4 ? manga : piel);
  }
  if (frente && p.puno) {
    rect(g, hx - 2, hy - 3, 6, 6, '#140f20');
    rect(g, hx - 1, hy - 2, 4, 4, piel);
    px(g, hx, hy - 2, '#f0c09a');
  } else {
    rect(g, hx - 1, hy - 1, 3, 3, piel);
  }
  if (frente && d.id === 'randy') {
    const wx = Math.round(sx + (hx - sx) * 0.72), wy = Math.round(sy + (hy - sy) * 0.72);
    rect(g, wx - 1, wy - 1, 3, 2, '#1a1a22');
    px(g, wx, wy - 1, d.reloj);
  }
  if (frente && p.varita) {
    brocha(g, hx, hy, hx + 4, hy - 4, 1, '#e8d8ff');
    px(g, hx + 5, hy - 5, '#ffe066'); px(g, hx + 4, hy - 5, '#ffe066'); px(g, hx + 6, hy - 5, '#ffe066');
    px(g, hx + 5, hy - 6, '#ffe066'); px(g, hx + 5, hy - 4, '#ffe066');
  }
  if (frente && p.blaster) {
    rect(g, hx, hy - 2, 6, 3, '#2a2a38');
    rect(g, hx + 1, hy - 2, 4, 1, '#4a4a60');
    px(g, hx + 6, hy - 1, '#3ff3ff');
  }
}

function dibujarTorso(g, d, cx, ty, p) {
  const w = d.ancho, h = d.torso, x = cx - (w >> 1);
  if (d.id === 'jazzlyn') {
    rect(g, x + 1, ty, w - 2, 5, d.vestido);
    rect(g, x + 1, ty, 1, 5, d.vestidoS);
    const pts = [[2, 1], [5, 0], [7, 2], [3, 3], [6, 4], [8, 1], [4, 2], [7, 4]];
    pts.forEach(([a, b], i) => px(g, x + a, ty + b, i % 2 ? d.brillo : d.brillo2));
    rect(g, x, ty + 5, w, 1, d.cinta);
    const vuelo = p.vuelo ? 2 : 0;
    for (let i = 0; i < h - 6; i++) {
      const ext = i + vuelo;
      rect(g, x - ext, ty + 6 + i, w + 2 * ext, 1, i % 2 ? d.faldaS : d.falda);
      px(g, x - ext + 2 + i, ty + 6 + i, '#ffffff');
      px(g, x + w + ext - 3 - i, ty + 6 + i, '#ffffff');
    }
    return;
  }
  rect(g, x, ty, w, h, d.camisa);
  rect(g, x, ty, 2, h, d.camisaS);
  if (d.id === 'joshua') {
    rect(g, cx - 2, ty, 4, 1, d.piel);
    px(g, cx - 1, ty + 1, d.piel); px(g, cx, ty + 1, d.piel);
    rect(g, x + 3, ty + 5, 2, 1, d.camisaS);
    rect(g, x, ty + h - 2, w, 2, d.pantalon);
  } else if (d.id === 'jacob') {
    rect(g, x, ty, 2, 4, d.manga);
    rect(g, x + w - 2, ty, 2, 4, d.manga);
    rect(g, cx - 2, ty, 4, 1, d.manga);
    rect(g, cx - 1, ty + 4, 4, 1, '#14304f');
    px(g, cx + 3, ty + 3, '#14304f'); px(g, cx - 2, ty + 5, '#14304f');
    rect(g, x, ty + h - 2, w, 2, d.pantalon);
  } else if (d.id === 'randy') {
    rect(g, x, ty + 2, w, h - 4, d.chaleco);
    rect(g, x, ty + 2, 1, h - 4, d.chalecoS);
    rect(g, cx - 2, ty + 2, 4, 1, d.camisa);
    px(g, cx - 1, ty + 3, d.camisa);
    rect(g, x + 2, ty + 5, 3, 2, d.chalecoS);
    rect(g, cx + 1, ty + 4, 4, 2, d.parche);
    px(g, cx + 2, ty + 4, '#444'); px(g, cx + 4, ty + 4, '#444');
    rect(g, x, ty + h - 2, w, 2, '#191920');
    px(g, cx, ty + h - 2, '#c8b060');
  } else {
    // agente de Chrono-Corp
    rect(g, cx - 1, ty, 2, h - 2, '#a46bff');
    px(g, cx + 2, ty + 3, '#3ff3ff'); px(g, cx + 3, ty + 3, '#3ff3ff'); px(g, cx + 2, ty + 4, '#3ff3ff');
    rect(g, x, ty + h - 2, w, 2, '#0e0f1c');
  }
}

function dibujarCuerpo(g, d, p) {
  const cx = 16;
  const bob = p.bob || 0;
  const caderaY = 39 - d.piernas - 1 + bob;
  const torsoY = caderaY - d.torso + 1;
  const cabezaY = torsoY - 15 + (p.cabezaDy || 0);
  const hombroY = torsoY + 2;
  const mitad = d.ancho >> 1;
  const hx = cx - 8;
  if (d.peloLargo) {
    rect(g, hx, cabezaY + 12, 3, 13, d.pelo);
    rect(g, hx + 13, cabezaY + 12, 3, 13, d.pelo);
    rect(g, hx + 1, cabezaY + 24, 2, 2, d.pelo);
    rect(g, hx + 13, cabezaY + 24, 2, 2, d.pelo);
  }
  dibujarBrazo(g, d, cx - mitad, hombroY, p.bA || {}, false, p);
  const atrasX = cx - (d.grosor === 4 ? 4 : 3);
  dibujarPierna(g, d, atrasX, caderaY, p.pA || {}, false);
  if (p.patada) dibujarPatada(g, d, cx, caderaY);
  else dibujarPierna(g, d, cx, caderaY, p.pF || {}, true);
  dibujarTorso(g, d, cx, torsoY, p);
  dibujarCabeza(g, d, hx, cabezaY, p);
  dibujarBrazo(g, d, cx + mitad - 1, hombroY, p.bF || {}, true, p);
}

const ANIMS = {
  quieto: [
    { bob: 0, pA: { dx: -1 }, pF: { dx: 1 }, bA: { dx: -1 }, bF: { dx: 1 } },
    { bob: 1, pA: { dx: -1 }, pF: { dx: 1 }, bA: { dx: -1, dy: -1 }, bF: { dx: 1, dy: -1 } },
  ],
  correr: [
    { bob: 0, pA: { dx: -4 }, pF: { dx: 4, alza: 2 }, bA: { dx: 3, dy: -1 }, bF: { dx: -3, dy: -1 } },
    { bob: 1, pA: { dx: -2, alza: 3 }, pF: { dx: 1 }, bA: { dx: 1 }, bF: { dx: -1 } },
    { bob: 0, pA: { dx: 4, alza: 2 }, pF: { dx: -4 }, bA: { dx: -3, dy: -1 }, bF: { dx: 3, dy: -1 } },
    { bob: 1, pA: { dx: 1 }, pF: { dx: -2, alza: 3 }, bA: { dx: -1 }, bF: { dx: 1 } },
  ],
  saltar: [{ bob: -1, pA: { dx: -3, alza: 5 }, pF: { dx: 3, alza: 3 }, bA: { dx: -4, dy: -7 }, bF: { dx: 4, dy: -8 } }],
  caer: [{ bob: 0, pA: { dx: -3, alza: 2 }, pF: { dx: 3 }, bA: { dx: -5, dy: -4 }, bF: { dx: 5, dy: -5 } }],
  atacar: [
    { bob: 0, pA: { dx: -3 }, pF: { dx: 3 }, bA: { dx: -2 }, bF: { dx: -3, dy: -3 } },
    { bob: 0, pA: { dx: -4 }, pF: { dx: 4 }, bA: { dx: -3, dy: -1 }, bF: { dx: 9, dy: -6 }, golpe: true },
  ],
  herido: [{ bob: 1, pA: { dx: -3, alza: 1 }, pF: { dx: 2 }, bA: { dx: -5, dy: -6 }, bF: { dx: 4, dy: -6 }, herido: true }],
  especial: [{ bob: 0, pA: { dx: -3 }, pF: { dx: 3 }, bA: { dx: -3, dy: -12 }, bF: { dx: 3, dy: -12 }, feliz: true }],
  planear: [{ bob: 0, pA: { dx: -2, alza: 2 }, pF: { dx: 2, alza: 1 }, bA: { dx: -7, dy: -5 }, bF: { dx: 7, dy: -5 }, vuelo: true, feliz: true }],
  victoria: [{ bob: 0, pA: { dx: -2 }, pF: { dx: 2 }, bA: { dx: -2 }, bF: { dx: 2, dy: -13 }, feliz: true }],
};

function generarPersonaje(d) {
  const out = {};
  for (const [nombre, poses] of Object.entries(ANIMS)) {
    out[nombre] = poses.map((p0) => {
      const p = Object.assign({}, p0);
      if (p.golpe) {
        if (d.id === 'jacob') { p.patada = true; p.bF = { dx: 3, dy: -2 }; }
        if (d.id === 'joshua') p.puno = true;
        if (d.id === 'jazzlyn') { p.varita = true; p.bF = { dx: 8, dy: -5 }; }
        if (d.id === 'randy' || d.id === 'agente') p.blaster = true;
      }
      const c = lienzo(32, 40);
      dibujarCuerpo(c.getContext('2d'), d, p);
      contornear(c);
      return { d: c, i: espejo(c) };
    });
  }
  return out;
}

/* --------------------------- Enemigos -------------------------------- */
function sprDron(f) {
  const c = lienzo(26, 18), g = c.getContext('2d');
  rect(g, 3, 7, 5, 1, '#2a2f50'); rect(g, 18, 7, 5, 1, '#2a2f50');
  rect(g, 4, 5, 1, 3, '#2a2f50'); rect(g, 21, 5, 1, 3, '#2a2f50');
  if (f === 0) { rect(g, 0, 4, 9, 1, '#a8b6e8'); rect(g, 17, 4, 9, 1, '#a8b6e8'); }
  else { rect(g, 2, 4, 5, 1, '#a8b6e8'); rect(g, 19, 4, 5, 1, '#a8b6e8'); }
  circulo(g, 13, 10, 5, '#3a3f66');
  rect(g, 8, 7, 11, 2, '#5a6296');
  rect(g, 8, 12, 11, 2, '#252a48');
  rect(g, 11, 8, 5, 4, '#ff3f6b');
  rect(g, 12, 9, 3, 2, '#ffb0c8');
  px(g, 14, 9, '#ffffff');
  rect(g, 13, 3, 1, 2, '#2a2f50');
  px(g, 13, 2, '#ff3f6b');
  rect(g, 11, 15, 5, 1, '#3ff3ff');
  contornear(c);
  return c;
}

function sprRobot(f) {
  const c = lienzo(26, 28), g = c.getContext('2d');
  // piernas
  if (f === 0) { rect(g, 8, 20, 4, 6, '#2c2648'); rect(g, 15, 20, 4, 5, '#2c2648'); rect(g, 7, 26, 6, 2, '#1c1834'); rect(g, 14, 25, 6, 2, '#1c1834'); }
  else { rect(g, 8, 20, 4, 5, '#2c2648'); rect(g, 15, 20, 4, 6, '#2c2648'); rect(g, 7, 25, 6, 2, '#1c1834'); rect(g, 14, 26, 6, 2, '#1c1834'); }
  // brazos
  rect(g, 2, 11, 4, 8, '#2c2648'); rect(g, 21, 11, 4, 8, '#2c2648');
  rect(g, 2, 18, 4, 2, '#ff3fbf'); rect(g, 21, 18, 4, 2, '#ff3fbf');
  // cuerpo
  rect(g, 6, 10, 15, 10, '#3d3366');
  rect(g, 6, 10, 15, 2, '#5a4c8c');
  rect(g, 6, 10, 2, 10, '#2e2752');
  rect(g, 11, 13, 5, 4, '#ffe066');
  rect(g, 12, 14, 3, 2, '#fff7c0');
  // cabeza
  rect(g, 7, 2, 13, 8, '#4b4078');
  rect(g, 7, 2, 13, 2, '#6a5ca2');
  rect(g, 10, 5, 10, 3, '#1a1630');
  rect(g, 12, 5, 7, 2, '#ff3f6b');
  px(g, 17, 5, '#ffd0de');
  rect(g, 9, 0, 1, 2, '#6a5ca2'); px(g, 9, 0, '#3ff3ff');
  contornear(c);
  return c;
}

function sprTorreta() {
  const c = lienzo(20, 16), g = c.getContext('2d');
  rect(g, 2, 10, 16, 6, '#2c3050');
  rect(g, 2, 10, 16, 1, '#4c5480');
  rect(g, 4, 12, 2, 2, '#ffe066'); rect(g, 14, 12, 2, 2, '#ffe066');
  circulo(g, 10, 9, 5, '#454b78');
  rect(g, 7, 5, 5, 2, '#6a72a8');
  rect(g, 8, 8, 4, 3, '#ff3f6b');
  contornear(c);
  return c;
}

function sprJefe() {
  const c = lienzo(84, 70), g = c.getContext('2d');
  const cx = 42, cy = 40;
  // propulsores
  rect(g, 28, 62, 9, 6, '#2a2c46'); rect(g, 47, 62, 9, 6, '#2a2c46');
  rect(g, 28, 62, 9, 1, '#4a4d70'); rect(g, 47, 62, 9, 1, '#4a4d70');
  // cuerpo de reloj
  circulo(g, cx, cy, 26, '#b8862e');
  circulo(g, cx, cy, 24, '#e8b84a');
  circulo(g, cx, cy, 21, '#23264a');
  circulo(g, cx, cy, 18, '#efe3c2');
  circulo(g, cx, cy, 16, '#f8f0da');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 12 : 14;
    brocha(g, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, 1, '#3a2a40');
  }
  // remaches del aro
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    px(g, cx + Math.cos(a) * 25, cy + Math.sin(a) * 25, '#fff0b0');
  }
  // cabina de cristal
  for (let y = -12; y <= 0; y++) {
    const w = Math.round(Math.sqrt(144 - y * y));
    rect(g, cx - w, 16 + y, w * 2 + 1, 1, '#2e8fb8');
  }
  // Dr. Cronos dentro de la cabina
  rect(g, cx - 5, 7, 10, 9, '#e6b896');
  rect(g, cx - 7, 4, 3, 5, '#f4f4ff'); rect(g, cx + 4, 4, 3, 5, '#f4f4ff');
  rect(g, cx - 4, 3, 8, 3, '#f4f4ff');
  rect(g, cx - 3, 9, 2, 2, '#1b1424'); rect(g, cx + 1, 9, 2, 2, '#1b1424');
  rect(g, cx + 0, 8, 4, 4, '#e8b84a'); rect(g, cx + 1, 9, 2, 2, '#a8f0ff');
  rect(g, cx - 3, 13, 6, 1, '#6a2a3a');
  rect(g, cx - 4, 12, 8, 1, '#d8d8e8');
  rect(g, cx - 6, 16, 12, 2, '#a46bff');
  // brillo del cristal
  rect(g, cx - 9, 8, 2, 4, '#9ff4ff');
  rect(g, cx - 7, 6, 2, 1, '#9ff4ff');
  // base de la cabina
  rect(g, cx - 13, 16, 27, 3, '#4a4d70');
  rect(g, cx - 13, 16, 27, 1, '#6c70a0');
  contornear(c);
  return c;
}

// Retrato del Dr. Cronos para diálogos
function retratoCronos() {
  const c = lienzo(32, 32), g = c.getContext('2d');
  rect(g, 0, 0, 32, 32, '#3a1d5c');
  for (let i = 0; i < 32; i += 4) rect(g, 0, i, 32, 1, '#43226a');
  rect(g, 8, 8, 16, 18, '#e6b896');
  rect(g, 8, 8, 2, 18, '#c49474');
  rect(g, 4, 3, 7, 10, '#f4f4ff'); rect(g, 21, 3, 7, 10, '#f4f4ff');
  rect(g, 9, 2, 14, 5, '#f4f4ff'); rect(g, 6, 1, 3, 3, '#f4f4ff'); rect(g, 23, 1, 3, 3, '#f4f4ff');
  rect(g, 10, 11, 5, 1, '#1b1424'); rect(g, 18, 11, 5, 1, '#1b1424');
  rect(g, 11, 13, 3, 2, '#1b1424');
  circulo(g, 20, 14, 3, '#e8b84a'); circulo(g, 20, 14, 2, '#a8f0ff'); px(g, 20, 14, '#1b1424'); px(g, 21, 13, '#ffffff');
  rect(g, 23, 16, 1, 6, '#e8b84a');
  rect(g, 11, 19, 10, 2, '#f4f4ff');
  rect(g, 13, 21, 6, 1, '#6a2a3a');
  rect(g, 4, 26, 24, 6, '#f2f2f8');
  rect(g, 14, 26, 4, 6, '#a46bff');
  circulo(g, 9, 29, 2, '#e8b84a');
  return c;
}

/* --------------------------- Objetos ---------------------------------- */
function sprChip(f) {
  const c = lienzo(10, 10), g = c.getContext('2d');
  const anchos = [4, 3, 1, 3];
  const a = anchos[f];
  for (let y = -4; y <= 4; y++) {
    const w = Math.round(Math.sqrt(16 - y * y) * (a / 4));
    rect(g, 5 - w, 5 + y, w * 2 + 1, 1, '#ffd23f');
  }
  if (a > 1) {
    for (let y = -2; y <= 2; y++) {
      const w = Math.round(Math.sqrt(4 - y * y) * (a / 4));
      rect(g, 5 - w, 5 + y, w * 2 + 1, 1, '#e09a1a');
    }
    px(g, 5 - Math.round(a / 2), 3, '#fff6c0');
  } else rect(g, 5, 1, 1, 9, '#e09a1a');
  contornear(c, '#5a3a10');
  return c;
}

function sprEnergia() {
  const c = lienzo(10, 14), g = c.getContext('2d');
  rect(g, 3, 1, 4, 2, '#d8ccff');
  rect(g, 1, 3, 8, 10, '#7a3fe0');
  rect(g, 2, 4, 6, 8, '#a46bff');
  rect(g, 2, 4, 1, 8, '#c8a8ff');
  rect(g, 5, 5, 2, 2, '#ffe066'); rect(g, 4, 7, 3, 1, '#ffe066'); rect(g, 3, 8, 2, 2, '#ffe066');
  contornear(c);
  return c;
}

function sprPozole() {
  const c = lienzo(18, 13), g = c.getContext('2d');
  for (let y = 0; y < 6; y++) {
    const w = Math.round(Math.sqrt(1 - (y / 6) * (y / 6)) * 8);
    rect(g, 9 - w, 6 + y, w * 2, 1, y < 2 ? '#ffffff' : '#dcdce8');
  }
  rect(g, 2, 4, 14, 3, '#d8432c');
  rect(g, 3, 3, 12, 1, '#e8603c');
  rect(g, 5, 3, 3, 2, '#5fd35f'); rect(g, 9, 4, 2, 1, '#5fd35f'); rect(g, 11, 3, 2, 1, '#9ff09f');
  px(g, 7, 5, '#ffffff'); px(g, 12, 5, '#ffffff'); px(g, 4, 5, '#f0e0a0');
  rect(g, 6, 12, 6, 1, '#b0b0c0');
  contornear(c);
  return c;
}

function sprFoto() {
  const c = lienzo(14, 14), g = c.getContext('2d');
  rect(g, 0, 0, 14, 14, '#f8f4e8');
  rect(g, 1, 1, 12, 9, '#7a5cff');
  rect(g, 1, 1, 12, 4, '#ff7ac8');
  rect(g, 1, 7, 12, 3, '#3a2d6a');
  const caras = [['#1c1411', '#c68a5e'], ['#22170f', '#c08055'], ['#3c2620', '#e6ae88'], ['#121018', '#d39a6c']];
  caras.forEach(([pelo, piel], i) => {
    const x = 2 + i * 3;
    rect(g, x, 4, 2, 1, pelo);
    rect(g, x, 5, 2, 2, piel);
    rect(g, x, 7, 2, 2, ['#2f5bd0', '#2f9be8', '#ebe7f7', '#5a8640'][i]);
  });
  px(g, 8, 3, '#f7a8e6');
  rect(g, 3, 11, 8, 1, '#c8c0b0');
  contornear(c);
  return c;
}

function sprMicrochip() {
  const c = lienzo(20, 20), g = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    rect(g, 0, 4 + i * 4, 3, 1, '#c8a040'); rect(g, 17, 4 + i * 4, 3, 1, '#c8a040');
    rect(g, 4 + i * 4, 0, 1, 3, '#c8a040'); rect(g, 4 + i * 4, 17, 1, 3, '#c8a040');
  }
  rect(g, 3, 3, 14, 14, '#2a2c46');
  rect(g, 3, 3, 14, 1, '#4a4d70');
  rect(g, 4, 4, 12, 12, '#e8b84a');
  rect(g, 5, 5, 10, 10, '#1a2a44');
  circulo(g, 10, 10, 4, '#3ff3ff');
  circulo(g, 10, 10, 3, '#0f3a50');
  rect(g, 10, 7, 1, 4, '#ffffff'); rect(g, 10, 10, 3, 1, '#ffffff');
  return c;
}

function sprAntena(encendida) {
  const c = lienzo(14, 34), g = c.getContext('2d');
  rect(g, 3, 30, 8, 4, '#3a4472');
  rect(g, 3, 30, 8, 1, '#6a7ab0');
  rect(g, 6, 8, 2, 22, '#5a6390');
  rect(g, 6, 8, 1, 22, '#8090c0');
  for (let y = 12; y < 30; y += 5) rect(g, 4, y, 6, 1, '#4a5380');
  circulo(g, 7, 6, 4, encendida ? '#4dff9a' : '#ff4d6d');
  circulo(g, 7, 6, 2, encendida ? '#d0ffe4' : '#ffc0c8');
  contornear(c);
  return c;
}

function sprLetrero() {
  const c = lienzo(18, 22), g = c.getContext('2d');
  rect(g, 8, 12, 2, 10, '#5a6390');
  rect(g, 5, 20, 8, 2, '#3a4472');
  rect(g, 1, 1, 16, 12, '#103a4a');
  rect(g, 1, 1, 16, 1, '#3ff3ff');
  rect(g, 1, 12, 16, 1, '#1c8fa6');
  rect(g, 1, 1, 1, 12, '#1c8fa6'); rect(g, 16, 1, 1, 12, '#1c8fa6');
  const q = ['0110', '1001', '0010', '0100', '0000', '0100'];
  q.forEach((f, y) => { for (let x = 0; x < 4; x++) if (f[x] === '1') px(g, 7 + x, 3 + y, '#9ff9ff'); });
  contornear(c);
  return c;
}

/* --------------------------- Casillas -------------------------------- */
function casSueloTop() {
  const c = lienzo(16, 16), g = c.getContext('2d');
  rect(g, 0, 0, 16, 16, '#3a4472');
  rect(g, 0, 0, 16, 1, '#c3d0f0');
  rect(g, 0, 1, 16, 1, '#8d9dcc');
  rect(g, 0, 2, 16, 1, '#2fd0e0');
  rect(g, 0, 3, 16, 1, '#5a6aa0');
  rect(g, 0, 9, 16, 1, '#2c3560');
  rect(g, 15, 4, 1, 12, '#2c3560');
  px(g, 2, 6, '#7f8fc4'); px(g, 12, 6, '#7f8fc4');
  px(g, 2, 12, '#7f8fc4'); px(g, 12, 12, '#7f8fc4');
  rect(g, 5, 11, 5, 1, '#4c5a90');
  return c;
}

function casSueloIn() {
  const c = lienzo(16, 16), g = c.getContext('2d');
  rect(g, 0, 0, 16, 16, '#242a4c');
  for (let i = 0; i < 16; i++) { px(g, i, i, '#1b203d'); px(g, 15 - i, i, '#1b203d'); }
  rect(g, 0, 15, 16, 1, '#181c36');
  rect(g, 15, 0, 1, 16, '#181c36');
  rect(g, 0, 0, 16, 1, '#2e3560');
  px(g, 7, 7, '#3d4778'); px(g, 8, 8, '#3d4778');
  return c;
}

function casPlataforma() {
  const c = lienzo(16, 16), g = c.getContext('2d');
  rect(g, 0, 0, 16, 1, '#d2dcf6');
  rect(g, 0, 1, 16, 2, '#8d9dcc');
  rect(g, 0, 3, 16, 1, '#2fd0e0');
  rect(g, 0, 4, 16, 2, '#55639a');
  rect(g, 0, 6, 16, 1, '#2a3260');
  px(g, 3, 4, '#8d9dcc'); px(g, 11, 4, '#8d9dcc');
  rect(g, 6, 7, 4, 3, '#2a3260');
  return c;
}

function casBaranda() {
  const c = lienzo(16, 12), g = c.getContext('2d');
  rect(g, 0, 0, 16, 1, '#a9b8e6');
  rect(g, 0, 1, 16, 1, '#5d6ca0');
  rect(g, 0, 6, 16, 1, '#5d6ca0');
  rect(g, 1, 0, 2, 12, '#6f7fb0');
  rect(g, 9, 0, 2, 12, '#6f7fb0');
  return c;
}

function casViga() {
  const c = lienzo(16, 16), g = c.getContext('2d');
  rect(g, 0, 0, 16, 2, '#9aa8d8');
  rect(g, 0, 2, 16, 2, '#4c5888');
  for (let i = 0; i < 4; i++) { px(g, i * 4 + 0, 4 + i % 2, '#3a4470'); }
  brocha(g, 0, 4, 4, 8, 1, '#3a4470'); brocha(g, 4, 8, 8, 4, 1, '#3a4470');
  brocha(g, 8, 4, 12, 8, 1, '#3a4470'); brocha(g, 12, 8, 15, 5, 1, '#3a4470');
  rect(g, 0, 8, 16, 1, '#3a4470');
  return c;
}

function casAgrietado() {
  const c = lienzo(16, 16), g = c.getContext('2d');
  rect(g, 0, 0, 16, 16, '#5d5070');
  rect(g, 0, 0, 16, 1, '#8f80a8');
  rect(g, 0, 0, 1, 16, '#7a6b92');
  rect(g, 0, 15, 16, 1, '#3a3050');
  rect(g, 15, 0, 1, 16, '#3a3050');
  rect(g, 2, 2, 5, 4, '#6a5c80');
  rect(g, 9, 9, 5, 4, '#6a5c80');
  const grieta = [[3, 1], [4, 2], [5, 3], [5, 4], [6, 5], [6, 6], [5, 7], [5, 8], [6, 9], [7, 10], [8, 11], [8, 12], [9, 13], [10, 14],
    [11, 1], [11, 2], [10, 3], [10, 4], [11, 5], [12, 6], [13, 7], [6, 6], [7, 6], [8, 7], [9, 7], [3, 11], [4, 12], [2, 10]];
  for (const [x, y] of grieta) px(g, x, y, '#1f1830');
  px(g, 7, 2, '#ffa94d'); px(g, 12, 12, '#ffa94d');
  return c;
}

function casResorte(comprimido) {
  const c = lienzo(16, 16), g = c.getContext('2d');
  rect(g, 0, 12, 16, 4, '#3a4472');
  rect(g, 0, 12, 16, 1, '#6a7ab0');
  const top = comprimido ? 8 : 3;
  for (let y = top + 2; y < 12; y += 2) {
    rect(g, 3, y, 10, 1, '#c0c8e0');
    rect(g, 4, y + 1, 8, 1, '#7a84a8');
  }
  for (let x = 0; x < 16; x += 4) { rect(g, x, top, 2, 2, '#ffd23f'); rect(g, x + 2, top, 2, 2, '#22222a'); }
  rect(g, 0, top - 1, 16, 1, '#fff0a0');
  return c;
}

function sprEmisor() {
  const c = lienzo(16, 7), g = c.getContext('2d');
  rect(g, 2, 0, 12, 5, '#4a5080');
  rect(g, 2, 0, 12, 1, '#7a80b0');
  rect(g, 5, 5, 6, 2, '#2a2f50');
  rect(g, 6, 5, 4, 1, '#ff3f6b');
  contornear(c);
  return c;
}

/* --------------------------- Fondos ---------------------------------- */
const TEMAS = {
  neon: {
    cielo: ['#07061a', '#141134', '#2b1b54', '#46286c'],
    lejos: ['#1c2350', '#222a5c', '#1a2048'], ventanas: ['#3ff3ff', '#58e1ff', '#ff6ad5', '#b18cff'],
    medio: ['#251d4e', '#2b2259', '#1f1a44'], cerca: ['#17132f', '#1c1738', '#120f28'],
    neones: ['#3ff3ff', '#ff3fbf', '#4dff9a', '#c86bff', '#ffe066'],
    letreros: ['KON', 'MOKOS', 'DESEO', 'KCRA', '24H', 'POZOLE', 'TACOS', 'NEO', 'ARAUJO'],
    niebla: '#5a2f8a', abismo: '#06051a', luna: true,
  },
  puentes: {
    cielo: ['#040f1f', '#0b2140', '#164070', '#2a5f8a'],
    lejos: ['#173055', '#1c3a64', '#142a4c'], ventanas: ['#7ff9ff', '#3ff3ff', '#ffe066', '#ffffff'],
    medio: ['#163052', '#1b385e', '#122844'], cerca: ['#0f1f38', '#122540', '#0b182e'],
    neones: ['#3ff3ff', '#4dff9a', '#ffe066', '#ff3fbf'],
    letreros: ['SKY', 'PUENTE', 'METRO', 'S-7', 'NUBE', 'VUELO', 'DESEO'],
    niebla: '#2a6a9a', abismo: '#030b18', luna: true,
  },
  mercado: {
    cielo: ['#12051a', '#2c0b33', '#5a1846', '#8a2a4e'],
    lejos: ['#2a1440', '#33184a', '#24103a'], ventanas: ['#ffb84d', '#ff6ad5', '#ffe066', '#3ff3ff'],
    medio: ['#2d1236', '#36163f', '#260f2e'], cerca: ['#1c0b22', '#220d28', '#16081b'],
    neones: ['#ff3fbf', '#ffa94d', '#ffe066', '#3ff3ff', '#4dff9a'],
    letreros: ['TACOS', 'POZOLE', 'RAMEN', 'MERCADO', 'ABIERTO', 'DULCES', 'ELOTES'],
    niebla: '#a0306a', abismo: '#0d0412', luna: true,
  },
  torre: {
    cielo: ['#03050c', '#0a1226', '#141f3e', '#26355a'],
    lejos: ['#121d36', '#16223f', '#0f182e'], ventanas: ['#3ff3ff', '#ff4d6d', '#9fb4ff'],
    medio: ['#141d38', '#182240', '#10172e'], cerca: ['#0b1124', '#0e152c', '#080d1c'],
    neones: ['#3ff3ff', '#ff4d6d', '#a46bff'],
    letreros: ['CHRONO', 'CORP', 'TIEMPO', 'PELIGRO', 'S-7', 'ALTO'],
    niebla: '#2a3f7a', abismo: '#02040c', luna: false, lluvia: true,
  },
  nucleo: {
    interior: true,
    cielo: ['#0a0716', '#120d24', '#1b1233', '#24183f'],
    neones: ['#a46bff', '#3ff3ff', '#ff3fbf'], letreros: ['CRONOS'], abismo: '#05030c',
  },
};

function letreroNeon(g, x, y, palabra, color, vertical, r) {
  const fuente = 'normal';
  if (vertical) {
    const w = 11, h = palabra.length * 9 + 5;
    rect(g, x, y, w, h, '#0d0a1c');
    g.strokeStyle = color; g.globalAlpha = 0.9;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    g.globalAlpha = 1;
    for (let i = 0; i < palabra.length; i++) {
      texto(g, palabra[i], x + 3, y + 4 + i * 9, color, { fuente });
    }
    return { w, h };
  }
  const tw = anchoTexto(palabra, fuente);
  const w = tw + 8, h = 13;
  rect(g, x, y, w, h, '#0d0a1c');
  g.strokeStyle = color;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  texto(g, palabra, x + 4, y + 3, color, { fuente });
  if (r() < 0.5) { rect(g, x + 2, y + h, 1, 6, '#3a3555'); rect(g, x + w - 3, y + h, 1, 6, '#3a3555'); }
  return { w, h };
}

function edificio(g, r, x, base, w, h, colores, ventanas, densidad, tamVentana) {
  const col = elegirR(r, colores);
  const top = base - h;
  rect(g, x, top, w, h, col);
  rect(g, x, top, 1, h, shade(col, 18));
  rect(g, x + w - 1, top, 1, h, shade(col, -14));
  // remate superior
  if (r() < 0.5) rect(g, x + 2, top - 3, w - 4, 3, col);
  if (r() < 0.35) { rect(g, x + (w >> 1), top - 12, 1, 12, shade(col, 20)); px(g, x + (w >> 1), top - 13, '#ff4d6d'); }
  const [vw, vh, sx, sy] = tamVentana;
  for (let yy = top + 4; yy < base - 4; yy += sy) {
    for (let xx = x + 2; xx < x + w - 2 - vw; xx += sx) {
      if (r() < densidad) {
        g.globalAlpha = 0.35 + r() * 0.6;
        rect(g, xx, yy, vw, vh, elegirR(r, ventanas));
        g.globalAlpha = 1;
      }
    }
  }
  return top;
}

function elegirR(r, arr) { return arr[Math.floor(r() * arr.length)]; }

function shade(hex, cant) {
  const n = parseInt(hex.slice(1), 16);
  const cl = (v) => clamp(v + cant, 0, 255);
  const rr = cl(n >> 16), gg = cl((n >> 8) & 255), bb = cl(n & 255);
  return '#' + ((1 << 24) | (rr << 16) | (gg << 8) | bb).toString(16).slice(1);
}

function generarFondo(nombreTema) {
  const tm = TEMAS[nombreTema];
  const r = semilla(nombreTema.length * 977 + 31);
  const F = { tema: tm, ventilas: [] };
  if (tm.interior) return generarFondoInterior(tm, r, F);

  // capa lejana: rascacielos con ventanas
  const lej = lienzo(480, 430);
  let g = lej.getContext('2d');
  let x = -4;
  while (x < 480) {
    const w = 14 + Math.floor(r() * 30);
    const h = 130 + Math.floor(r() * 250);
    edificio(g, r, x, 430, w, h, tm.lejos, tm.ventanas, 0.28, [1, 1, 3, 3]);
    x += w + Math.floor(r() * 5) - 1;
  }
  // gran torre central (como en la portada)
  const tx = 214, tw = 50;
  rect(g, tx, 20, tw, 410, shade(tm.lejos[1], 6));
  rect(g, tx + 6, 6, tw - 12, 16, shade(tm.lejos[1], 6));
  rect(g, tx + tw / 2 - 1, -10, 2, 18, shade(tm.lejos[1], 30));
  px(g, tx + tw / 2, 0, '#ff4d6d');
  for (let yy = 26; yy < 430; yy += 4) {
    for (let xx = tx + 3; xx < tx + tw - 3; xx += 3) {
      if (r() < 0.55) { g.globalAlpha = 0.4 + r() * 0.6; rect(g, xx, yy, 2, 1, tm.ventanas[0]); g.globalAlpha = 1; }
    }
  }
  rect(g, tx, 20, 2, 410, shade(tm.lejos[1], 40));
  F.lejos = lej;

  // capa media: edificios con letreros de neón
  const med = lienzo(640, 360);
  g = med.getContext('2d');
  x = -10;
  let letrero = 0;
  const tops = [];
  while (x < 640) {
    const w = 30 + Math.floor(r() * 50);
    const h = 110 + Math.floor(r() * 200);
    const top = edificio(g, r, x, 360, w, h, tm.medio, tm.ventanas, 0.2, [2, 2, 5, 6]);
    tops.push({ x, w, top });
    const tipo = r();
    const color = elegirR(r, tm.neones);
    const palabra = tm.letreros[letrero++ % tm.letreros.length];
    if (tipo < 0.45) letreroNeon(g, x + 4 + Math.floor(r() * Math.max(1, w - 18)), top + 10 + Math.floor(r() * 40), palabra.slice(0, 6), color, true, r);
    else if (tipo < 0.8 && anchoTexto(palabra) + 8 < w + 20) letreroNeon(g, x + 2, top + 14 + Math.floor(r() * 30), palabra, color, false, r);
    else {
      // letrero redondo (como el verde de la portada)
      const cx = x + w / 2, cy = top + 24;
      g.globalAlpha = 0.9;
      circulo(g, cx | 0, cy | 0, 9, color);
      circulo(g, cx | 0, cy | 0, 7, '#0d0a1c');
      px(g, cx - 3, cy - 2, color); px(g, cx + 3, cy - 2, color);
      rect(g, cx - 3, cy + 3, 7, 1, color);
      g.globalAlpha = 1;
    }
    x += w + Math.floor(r() * 10);
  }
  // pasarela aérea
  const py = 200;
  rect(g, 0, py, 640, 5, shade(tm.medio[0], 16));
  rect(g, 0, py, 640, 1, shade(tm.medio[0], 50));
  for (let i = 0; i < 640; i += 6) { g.globalAlpha = 0.7; px(g, i, py + 2, tm.ventanas[0]); g.globalAlpha = 1; }
  F.medio = med;

  // capa cercana: fachadas oscuras con ventilas, tuberías y anuncios
  const cer = lienzo(720, 240);
  g = cer.getContext('2d');
  x = -20;
  let grande = 0;
  while (x < 720) {
    const w = 60 + Math.floor(r() * 90);
    const h = 130 + Math.floor(r() * 105);
    const col = elegirR(r, tm.cerca);
    const top = 240 - h;
    rect(g, x, top, w, h, col);
    rect(g, x, top, w, 2, shade(col, 22));
    rect(g, x, top, 2, h, shade(col, 12));
    for (let yy = top + 8; yy < 236; yy += 14) {
      for (let xx = x + 6; xx < x + w - 10; xx += 12) {
        if (r() < 0.32) {
          const vc = elegirR(r, tm.ventanas);
          g.globalAlpha = 0.25 + r() * 0.45;
          rect(g, xx, yy, 6, 5, vc);
          g.globalAlpha = 1;
          rect(g, xx, yy + 5, 6, 1, shade(col, 30));
        }
      }
    }
    // tubería vertical
    if (r() < 0.6) {
      const tx2 = x + 4 + Math.floor(r() * (w - 8));
      rect(g, tx2, top, 3, h, shade(col, 26));
      rect(g, tx2, top, 1, h, shade(col, 44));
    }
    // aire acondicionado con vapor
    if (r() < 0.7) {
      const ax = x + 8 + Math.floor(r() * (w - 26)), ay = top - 10;
      rect(g, ax, ay, 18, 10, shade(col, 34));
      rect(g, ax, ay, 18, 1, shade(col, 60));
      circulo(g, ax + 6, ay + 5, 3, shade(col, 10));
      rect(g, ax + 12, ay + 3, 4, 5, shade(col, 10));
      F.ventilas.push({ x: ax + 6, y: ay });
    }
    // gran anuncio
    if (r() < 0.45) {
      const color = elegirR(r, tm.neones);
      if (grande++ % 3 === 1) {
        const bx = x + 6, by = top + 12;
        rect(g, bx, by, 64, 30, '#140a24');
        g.strokeStyle = color; g.strokeRect(bx + 0.5, by + 0.5, 63, 29);
        g.strokeRect(bx + 2.5, by + 2.5, 59, 25);
        texto(g, 'AVENTURA', bx + 32, by + 7, color, { alin: 'centro' });
        texto(g, 'FAMILIAR', bx + 32, by + 18, color, { alin: 'centro' });
      } else {
        const pal = elegirR(r, tm.letreros);
        letreroNeon(g, x + 8, top + 16, pal, color, false, r);
      }
    }
    x += w + Math.floor(r() * 16);
  }
  F.cerca = cer;
  return F;
}

function generarFondoInterior(tm, r, F) {
  const p = lienzo(128, 128);
  const g = p.getContext('2d');
  rect(g, 0, 0, 128, 128, '#140f26');
  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 128; x += 32) {
      rect(g, x + 1, y + 1, 30, 30, '#1b1432');
      rect(g, x + 1, y + 1, 30, 1, '#261c44');
      px(g, x + 4, y + 4, '#3a2c60'); px(g, x + 27, y + 4, '#3a2c60');
      px(g, x + 4, y + 27, '#3a2c60'); px(g, x + 27, y + 27, '#3a2c60');
      if (r() < 0.4) { rect(g, x + 10, y + 12, 12, 2, '#a46bff'); g.globalAlpha = 0.5; rect(g, x + 10, y + 15, 8, 1, '#3ff3ff'); g.globalAlpha = 1; }
    }
  }
  rect(g, 60, 0, 6, 128, '#221a3c');
  rect(g, 61, 0, 1, 128, '#3a2c60');
  F.pared = p;
  return F;
}

/* --------------------------- Generación global ----------------------- */
const SPR = {};
function generarSprites() {
  SPR.pj = {};
  for (const id of ['joshua', 'jacob', 'jazzlyn', 'randy', 'agente']) SPR.pj[id] = generarPersonaje(APARIENCIA[id]);
  SPR.dron = [sprDron(0), sprDron(1)].map((c) => ({ d: c, i: espejo(c) }));
  SPR.robot = [sprRobot(0), sprRobot(1)].map((c) => ({ d: c, i: espejo(c) }));
  SPR.torreta = sprTorreta();
  SPR.jefe = sprJefe();
  SPR.jefeBlanco = tenir(SPR.jefe, '#ffffff', 0.85);
  SPR.cronos = retratoCronos();
  SPR.chip = [0, 1, 2, 3].map(sprChip);
  SPR.energia = sprEnergia();
  SPR.pozole = sprPozole();
  SPR.foto = sprFoto();
  SPR.microchip = sprMicrochip();
  SPR.antena = [sprAntena(false), sprAntena(true)];
  SPR.letrero = sprLetrero();
  SPR.emisor = sprEmisor();
  SPR.cas = {
    sueloTop: casSueloTop(), sueloIn: casSueloIn(), plataforma: casPlataforma(), baranda: casBaranda(),
    viga: casViga(), agrietado: casAgrietado(), resorte: casResorte(false), resorteC: casResorte(true),
  };
  // versiones blancas para destello de daño
  SPR.blanco = new Map();
}

// Devuelve una versión blanca (cacheada) de un sprite para el destello de golpe.
function sprBlanco(c) {
  let b = SPR.blanco.get(c);
  if (!b) { b = tenir(c, '#ffffff', 0.9); SPR.blanco.set(c, b); }
  return b;
}
