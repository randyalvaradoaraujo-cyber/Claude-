'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — motor.js
   Utilidades, fuente pixel, entrada táctil/teclado, audio chiptune
   y guardado de partida.
   ===================================================================== */

const TS = 16; // tamaño de una casilla del mapa (px lógicos)

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const elegir = (arr) => arr[Math.floor(Math.random() * arr.length)];
const signo = (v) => (v < 0 ? -1 : 1);

function semilla(s) {
  return function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

function choca(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function dentro(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/* --------------------------- Paleta ---------------------------------- */
const COL = {
  fondo: '#0f0d24',
  noche: '#0b0a1e',
  borde: '#140f20',
  cian: '#3ff3ff',
  cianOsc: '#1c8fa6',
  magenta: '#ff3fbf',
  morado: '#a46bff',
  verde: '#4dff9a',
  amarillo: '#ffe066',
  crema: '#fff1b8',
  naranja: '#ffa94d',
  rojo: '#ff4d6d',
  blanco: '#f4f1ff',
  gris: '#8a8fb0',
  grisOsc: '#4a4866',
  panel: 'rgba(12,10,32,0.88)',
};

/* ------------------------- Fuente pixel ------------------------------ */
// Cada glifo: filas de bits (1 = píxel encendido).
const FUENTES = {
  normal: {
    w: 5, h: 7, adv: 6, esp: 4,
    marcas: {
      agudo: [[3, -3], [2, -2]],
      tilde: [[1, -3], [2, -3], [4, -3], [0, -2], [3, -2]],
      dieresis: [[1, -2], [3, -2]],
    },
    datos: {
      A: '01110 10001 10001 11111 10001 10001 10001',
      B: '11110 10001 10001 11110 10001 10001 11110',
      C: '01110 10001 10000 10000 10000 10001 01110',
      D: '11110 10001 10001 10001 10001 10001 11110',
      E: '11111 10000 10000 11110 10000 10000 11111',
      F: '11111 10000 10000 11110 10000 10000 10000',
      G: '01110 10001 10000 10111 10001 10001 01111',
      H: '10001 10001 10001 11111 10001 10001 10001',
      I: '01110 00100 00100 00100 00100 00100 01110',
      J: '00111 00010 00010 00010 00010 10010 01100',
      K: '10001 10010 10100 11000 10100 10010 10001',
      L: '10000 10000 10000 10000 10000 10000 11111',
      M: '10001 11011 10101 10101 10001 10001 10001',
      N: '10001 10001 11001 10101 10011 10001 10001',
      O: '01110 10001 10001 10001 10001 10001 01110',
      P: '11110 10001 10001 11110 10000 10000 10000',
      Q: '01110 10001 10001 10001 10101 10010 01101',
      R: '11110 10001 10001 11110 10100 10010 10001',
      S: '01111 10000 10000 01110 00001 00001 11110',
      T: '11111 00100 00100 00100 00100 00100 00100',
      U: '10001 10001 10001 10001 10001 10001 01110',
      V: '10001 10001 10001 10001 10001 01010 00100',
      W: '10001 10001 10001 10101 10101 10101 01010',
      X: '10001 10001 01010 00100 01010 10001 10001',
      Y: '10001 10001 01010 00100 00100 00100 00100',
      Z: '11111 00001 00010 00100 01000 10000 11111',
      0: '01110 10001 10011 10101 11001 10001 01110',
      1: '00100 01100 00100 00100 00100 00100 01110',
      2: '01110 10001 00001 00010 00100 01000 11111',
      3: '11111 00010 00100 00010 00001 10001 01110',
      4: '00010 00110 01010 10010 11111 00010 00010',
      5: '11111 10000 11110 00001 00001 10001 01110',
      6: '00110 01000 10000 11110 10001 10001 01110',
      7: '11111 00001 00010 00100 01000 01000 01000',
      8: '01110 10001 10001 01110 10001 10001 01110',
      9: '01110 10001 10001 01111 00001 00010 01100',
      '.': '00000 00000 00000 00000 00000 01100 01100',
      ',': '00000 00000 00000 00000 01100 00100 01000',
      ':': '00000 01100 01100 00000 01100 01100 00000',
      ';': '00000 01100 01100 00000 01100 00100 01000',
      '!': '00100 00100 00100 00100 00100 00000 00100',
      '?': '01110 10001 00001 00010 00100 00000 00100',
      '¡': '00100 00000 00100 00100 00100 00100 00100',
      '¿': '00100 00000 00100 01000 10000 10001 01110',
      '-': '00000 00000 00000 01110 00000 00000 00000',
      '–': '00000 00000 00000 11111 00000 00000 00000',
      '+': '00000 00100 00100 11111 00100 00100 00000',
      '/': '00001 00010 00010 00100 01000 01000 10000',
      '(': '00010 00100 01000 01000 01000 00100 00010',
      ')': '01000 00100 00010 00010 00010 00100 01000',
      "'": '00100 00100 01000 00000 00000 00000 00000',
      '"': '01010 01010 00000 00000 00000 00000 00000',
      '%': '11001 11010 00010 00100 01000 01011 10011',
      '&': '01100 10010 10100 01000 10101 10010 01101',
      '*': '00000 00100 10101 01110 10101 00100 00000',
      '#': '01010 01010 11111 01010 11111 01010 01010',
      '=': '00000 00000 11111 00000 11111 00000 00000',
      '<': '00010 00100 01000 10000 01000 00100 00010',
      '>': '01000 00100 00010 00001 00010 00100 01000',
      _: '00000 00000 00000 00000 00000 00000 11111',
      '◀': '00010 00110 01110 11110 01110 00110 00010',
      '▶': '01000 01100 01110 01111 01110 01100 01000',
      '★': '00100 00100 11111 01110 01110 11011 10001',
      '♥': '00000 01010 11111 11111 01110 00100 00000',
      '⇄': '00010 11111 00010 00000 01000 11111 01000',
      '·': '00000 00000 00000 01100 01100 00000 00000',
      '◆': '00100 01110 11111 11111 11111 01110 00100',
      '✓': '00000 00001 00010 10100 01000 00000 00000',
    },
  },
  mini: {
    w: 3, h: 5, adv: 4, esp: 3,
    marcas: {
      agudo: [[2, -2]],
      tilde: [[0, -2], [1, -2], [2, -2]],
      dieresis: [[0, -2], [2, -2]],
    },
    datos: {
      A: '010 101 111 101 101', B: '110 101 110 101 110', C: '011 100 100 100 011',
      D: '110 101 101 101 110', E: '111 100 110 100 111', F: '111 100 110 100 100',
      G: '011 100 101 101 011', H: '101 101 111 101 101', I: '111 010 010 010 111',
      J: '001 001 001 101 010', K: '101 101 110 101 101', L: '100 100 100 100 111',
      M: '101 111 111 101 101', N: '110 101 101 101 101', O: '010 101 101 101 010',
      P: '110 101 110 100 100', Q: '010 101 101 110 011', R: '110 101 110 101 101',
      S: '011 100 010 001 110', T: '111 010 010 010 010', U: '101 101 101 101 111',
      V: '101 101 101 101 010', W: '101 101 111 111 101', X: '101 101 010 101 101',
      Y: '101 101 010 010 010', Z: '111 001 010 100 111',
      0: '111 101 101 101 111', 1: '010 110 010 010 111', 2: '110 001 010 100 111',
      3: '110 001 010 001 110', 4: '101 101 111 001 001', 5: '111 100 110 001 110',
      6: '011 100 111 101 111', 7: '111 001 010 010 010', 8: '111 101 111 101 111',
      9: '111 101 111 001 110',
      '.': '000 000 000 000 010', ',': '000 000 000 010 100', ':': '000 010 000 010 000',
      '!': '010 010 010 000 010', '?': '110 001 010 000 010', '¡': '010 000 010 010 010',
      '¿': '010 000 010 100 011', '-': '000 000 111 000 000', '–': '000 000 111 000 000',
      '+': '000 010 111 010 000', '/': '001 001 010 100 100', '(': '001 010 010 010 001',
      ')': '100 010 010 010 100', "'": '010 010 000 000 000', '%': '101 001 010 100 101',
      '*': '000 101 010 101 000', '=': '000 111 000 111 000', '<': '001 010 100 010 001',
      '>': '100 010 001 010 100', '♥': '000 101 111 010 000', '★': '010 111 010 101 000',
      '◀': '001 011 111 011 001', '▶': '100 110 111 110 100', '·': '000 000 010 000 000',
      '◆': '010 111 111 111 010', '"': '101 101 000 000 000', '⇄': '010 111 000 111 010',
      '✓': '000 001 101 010 000',
    },
  },
};
const ACENTOS = {
  'Á': ['A', 'agudo'], 'É': ['E', 'agudo'], 'Í': ['I', 'agudo'], 'Ó': ['O', 'agudo'],
  'Ú': ['U', 'agudo'], 'Ñ': ['N', 'tilde'], 'Ü': ['U', 'dieresis'],
};
for (const f of Object.values(FUENTES)) {
  for (const k in f.datos) f.datos[k] = f.datos[k].replace(/ /g, '');
}

const cacheGlifos = new Map();
function glifo(fuente, ch, color) {
  const k = fuente + '|' + color + '|' + ch;
  let c = cacheGlifos.get(k);
  if (c) return c;
  const F = FUENTES[fuente];
  c = lienzo(F.w, F.h + 3);
  const g = c.getContext('2d');
  g.fillStyle = color;
  let base = ch, marca = null;
  if (ACENTOS[ch]) { base = ACENTOS[ch][0]; marca = ACENTOS[ch][1]; }
  const d = F.datos[base] || F.datos['?'];
  for (let i = 0; i < d.length; i++) {
    if (d[i] === '1') g.fillRect(i % F.w, 3 + Math.floor(i / F.w), 1, 1);
  }
  if (marca) for (const [x, y] of F.marcas[marca]) g.fillRect(x, 3 + y, 1, 1);
  cacheGlifos.set(k, c);
  return c;
}

function anchoTexto(s, fuente = 'normal', esc = 1) {
  const F = FUENTES[fuente];
  s = String(s);
  if (!s.length) return 0;
  let w = 0;
  for (const ch of s) w += ch === ' ' ? F.esp : F.adv;
  return (w - (F.adv - F.w)) * esc;
}

function lineaTexto(g, s, x, y, color, fuente, esc) {
  const F = FUENTES[fuente];
  for (const ch of s) {
    if (ch === ' ') { x += F.esp * esc; continue; }
    const c = glifo(fuente, ch, color);
    g.drawImage(c, x, y - 3 * esc, c.width * esc, c.height * esc);
    x += F.adv * esc;
  }
}

const OCHO = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];

// Dibuja texto pixelado. o: {fuente, esc, alin:'centro'|'der', sombra, borde}
function texto(g, s, x, y, color, o = {}) {
  const fuente = o.fuente || 'normal';
  const esc = o.esc || 1;
  s = String(s).toUpperCase();
  const w = anchoTexto(s, fuente, esc);
  if (o.alin === 'centro') x -= w / 2;
  else if (o.alin === 'der') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (o.borde) for (const [dx, dy] of OCHO) lineaTexto(g, s, x + dx * esc, y + dy * esc, o.borde, fuente, esc);
  if (o.sombra) lineaTexto(g, s, x + esc, y + esc, o.sombra, fuente, esc);
  lineaTexto(g, s, x, y, color, fuente, esc);
  return w;
}

function envolver(s, maxW, fuente = 'normal', esc = 1) {
  const res = [];
  for (const parrafo of String(s).toUpperCase().split('\n')) {
    let cur = '';
    for (const p of parrafo.split(' ')) {
      const prueba = cur ? cur + ' ' + p : p;
      if (cur && anchoTexto(prueba, fuente, esc) > maxW) { res.push(cur); cur = p; }
      else cur = prueba;
    }
    res.push(cur);
  }
  return res;
}

// Texto grande con degradado cian→magenta (como el logo) y brillo.
const cacheNeon = new Map();
function textoNeon(g, s, x, y, o = {}) {
  const esc = o.esc || 2;
  const c1 = o.c1 || '#7ff9ff', c2 = o.c2 || '#ff5fd2';
  s = String(s).toUpperCase();
  const k = s + '|' + esc + '|' + c1 + '|' + c2;
  let c = cacheNeon.get(k);
  if (!c) {
    const w = anchoTexto(s, 'normal', esc);
    const pad = 2 * esc;
    c = lienzo(w + pad * 2, 10 * esc + pad * 2);
    const cg = c.getContext('2d');
    for (const [dx, dy] of OCHO) lineaTexto(cg, s, pad + dx * esc, pad + 3 * esc + dy * esc, '#000', 'normal', esc);
    lineaTexto(cg, s, pad, pad + 3 * esc + esc, '#000', 'normal', esc);
    const t = lienzo(c.width, c.height);
    const tg = t.getContext('2d');
    lineaTexto(tg, s, pad, pad + 3 * esc, '#fff', 'normal', esc);
    tg.globalCompositeOperation = 'source-in';
    const gr = tg.createLinearGradient(0, pad, 0, pad + 10 * esc);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.3, c1);
    gr.addColorStop(0.62, c1);
    gr.addColorStop(0.63, c2);
    gr.addColorStop(1, c2);
    tg.fillStyle = gr;
    tg.fillRect(0, 0, t.width, t.height);
    // contorno oscuro con borde de color
    const cont = lienzo(c.width, c.height);
    const kg = cont.getContext('2d');
    kg.drawImage(c, 0, 0);
    kg.globalCompositeOperation = 'source-in';
    kg.fillStyle = '#1a1033';
    kg.fillRect(0, 0, c.width, c.height);
    cg.clearRect(0, 0, c.width, c.height);
    cg.drawImage(cont, 0, 0);
    cg.drawImage(t, 0, 0);
    cacheNeon.set(k, c);
  }
  let dx = x - 2 * esc;
  if (o.alin === 'centro') dx = x - c.width / 2;
  const dy = y - 2 * esc - 3 * esc;
  if (o.brillo !== false) {
    g.save();
    g.globalAlpha = 0.35 + 0.1 * Math.sin(Date.now() / 300);
    g.shadowColor = c1; g.shadowBlur = 8;
    g.drawImage(c, Math.round(dx), Math.round(dy));
    g.restore();
  }
  g.drawImage(c, Math.round(dx), Math.round(dy));
  return c.width;
}

/* --------------------------- Entrada --------------------------------- */
const Entrada = {
  lienzo: null,
  W: 270, H: 480,
  punteros: new Map(),
  toques: [],      // toques completados este frame {x,y,x0,y0}
  bajadas: [],     // puntero recién presionado {x,y,id}
  teclas: new Set(),
  pulsadas: new Set(),
  usoTactil: false,

  iniciar(cv) {
    this.lienzo = cv;
    const aL = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (this.W / r.width), y: (e.clientY - r.top) * (this.H / r.height) };
    };
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (e.pointerType === 'touch') this.usoTactil = true;
      Sonido.iniciar();
      const p = aL(e);
      this.punteros.set(e.pointerId, { x: p.x, y: p.y, x0: p.x, y0: p.y, t0: performance.now() });
      this.bajadas.push({ x: p.x, y: p.y, id: e.pointerId });
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    }, { passive: false });
    cv.addEventListener('pointermove', (e) => {
      const q = this.punteros.get(e.pointerId);
      if (!q) return;
      const p = aL(e);
      q.x = p.x; q.y = p.y;
    });
    const fin = (e, valido) => {
      const q = this.punteros.get(e.pointerId);
      if (!q) return;
      const p = aL(e);
      if (valido) this.toques.push({ x: p.x, y: p.y, x0: q.x0, y0: q.y0 });
      this.punteros.delete(e.pointerId);
    };
    cv.addEventListener('pointerup', (e) => { Sonido.iniciar(); fin(e, true); });
    cv.addEventListener('pointercancel', (e) => fin(e, false));
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      const bloquear = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
      if (bloquear.includes(e.code)) e.preventDefault();
      Sonido.iniciar();
      if (!e.repeat) this.pulsadas.add(e.code);
      this.teclas.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.teclas.delete(e.code));
    window.addEventListener('blur', () => { this.teclas.clear(); this.punteros.clear(); });
  },

  // ¿Se tocó (presionar y soltar) dentro del rectángulo?
  tocado(r) {
    for (const t of this.toques) if (dentro(t.x, t.y, r) && dentro(t.x0, t.y0, r)) return true;
    return false;
  },
  // ¿Hay un dedo sobre el rectángulo ahora mismo?
  presionando(r) {
    for (const p of this.punteros.values()) if (dentro(p.x0, p.y0, r) && dentro(p.x, p.y, r)) return true;
    return false;
  },
  tecla(...cods) { return cods.some((c) => this.teclas.has(c)); },
  pulso(...cods) { return cods.some((c) => this.pulsadas.has(c)); },
  algunToque() { return this.toques.length > 0; },
  finFrame() { this.toques.length = 0; this.bajadas.length = 0; this.pulsadas.clear(); },
};

/* --------------------------- Opciones y guardado --------------------- */
const Opciones = {
  musica: 0.6, efectos: 0.8, vibracion: true, botones: 1, completa: false,
  cargar() {
    try {
      const s = localStorage.getItem('aventura-familiar-opciones');
      if (s) Object.assign(this, JSON.parse(s));
    } catch (e) { /* sin almacenamiento */ }
  },
  guardar() {
    try {
      const { musica, efectos, vibracion, botones, completa } = this;
      localStorage.setItem('aventura-familiar-opciones', JSON.stringify({ musica, efectos, vibracion, botones, completa }));
    } catch (e) { /* sin almacenamiento */ }
  },
};

const Guardado = {
  CLAVE: 'aventura-familiar-partida',
  datos: null,
  nuevo() {
    return {
      v: 1, desbloqueado: 0, fotos: [0, 0, 0, 0, 0], completado: [false, false, false, false, false],
      chips: 0, mejoras: { salud: 0, energia: 0, fuerza: 0, vidas: 0 }, tiempos: [0, 0, 0, 0, 0], terminado: false,
    };
  },
  cargar() {
    try {
      const s = localStorage.getItem(this.CLAVE);
      if (s) {
        const d = JSON.parse(s);
        const n = this.nuevo();
        this.datos = Object.assign(n, d, { mejoras: Object.assign(n.mejoras, d.mejoras || {}) });
      } else this.datos = null;
    } catch (e) { this.datos = null; }
  },
  guardar() {
    try { if (this.datos) localStorage.setItem(this.CLAVE, JSON.stringify(this.datos)); } catch (e) { /* sin almacenamiento */ }
  },
  borrar() {
    this.datos = null;
    try { localStorage.removeItem(this.CLAVE); } catch (e) { /* sin almacenamiento */ }
  },
  hay() { return !!this.datos; },
};

function vibrar(ms) {
  if (!Opciones.vibracion || !navigator.vibrate) return;
  try { navigator.vibrate(ms); } catch (e) { /* no soportado */ }
}

/* --------------------------- Sonido ---------------------------------- */
function frecNota(n) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) return 0;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (parseInt(m[3], 10) + 1) + base;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const Sonido = {
  ctx: null, maestro: null, gMusica: null, gEfectos: null, ruido: null,

  iniciar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.maestro = c.createGain();
    this.maestro.connect(c.destination);
    this.gMusica = c.createGain();
    this.gMusica.connect(this.maestro);
    this.gEfectos = c.createGain();
    this.gEfectos.connect(this.maestro);
    const len = c.sampleRate;
    this.ruido = c.createBuffer(1, len, c.sampleRate);
    const d = this.ruido.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.volumen();
    if (Musica.pendiente) { const p = Musica.pendiente; Musica.pendiente = null; Musica.tocar(p); }
  },

  volumen() {
    if (!this.ctx) return;
    this.gMusica.gain.value = Opciones.musica * 0.55;
    this.gEfectos.gain.value = Opciones.efectos * 0.75;
  },

  tono(tipo, f0, f1, dur, vol, t0 = 0, destino = null) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + t0;
    const o = c.createOscillator();
    const gn = c.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn);
    gn.connect(destino || this.gEfectos);
    o.start(t);
    o.stop(t + dur + 0.02);
  },

  chasquido(dur, vol, tipoFiltro, frec, t0 = 0, frec1 = 0, destino = null) {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime + t0;
    const s = c.createBufferSource();
    s.buffer = this.ruido;
    const f = c.createBiquadFilter();
    f.type = tipoFiltro;
    f.frequency.setValueAtTime(frec, t);
    if (frec1) f.frequency.exponentialRampToValueAtTime(frec1, t + dur);
    const gn = c.createGain();
    gn.gain.setValueAtTime(vol, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(gn); gn.connect(destino || this.gEfectos);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  },

  arpegio(notas, paso, tipo = 'square', vol = 0.15, dur = 0.12) {
    notas.forEach((n, i) => this.tono(tipo, frecNota(n), 0, dur, vol, i * paso));
  },

  efecto(nombre) {
    if (!this.ctx || Opciones.efectos <= 0) return;
    switch (nombre) {
      case 'salto': this.tono('square', 280, 620, 0.13, 0.12); break;
      case 'doble': this.tono('square', 420, 900, 0.14, 0.12); break;
      case 'golpe': this.chasquido(0.08, 0.35, 'highpass', 2500); this.tono('square', 180, 90, 0.07, 0.08); break;
      case 'patada': this.chasquido(0.06, 0.3, 'bandpass', 3000); break;
      case 'impacto': this.tono('square', 220, 70, 0.12, 0.15); this.chasquido(0.1, 0.25, 'lowpass', 1800); break;
      case 'disparo': this.tono('square', 1100, 300, 0.1, 0.09); break;
      case 'estrella': this.tono('triangle', 880, 1760, 0.12, 0.14); this.tono('sine', 1320, 2000, 0.1, 0.06, 0.05); break;
      case 'chip': this.tono('square', 988, 0, 0.06, 0.09); this.tono('square', 1319, 0, 0.16, 0.09, 0.06); break;
      case 'energia': this.tono('triangle', 400, 1300, 0.22, 0.18); break;
      case 'salud': this.arpegio(['C5', 'E5', 'G5', 'C6'], 0.06, 'triangle', 0.18, 0.14); break;
      case 'foto': this.arpegio(['G5', 'C6', 'E6', 'G6', 'C7'], 0.07, 'square', 0.09, 0.18); break;
      case 'dano': this.tono('sawtooth', 420, 90, 0.28, 0.16); break;
      case 'explosion': this.chasquido(0.6, 0.5, 'lowpass', 1600, 0, 80); this.tono('sine', 120, 30, 0.5, 0.35); break;
      case 'romper': this.chasquido(0.25, 0.45, 'lowpass', 2400, 0, 300); this.tono('square', 140, 50, 0.18, 0.12); break;
      case 'pozole': this.tono('sine', 90, 30, 0.5, 0.5); this.chasquido(0.5, 0.5, 'lowpass', 900, 0, 60); break;
      case 'sigilo': this.chasquido(0.3, 0.3, 'bandpass', 600, 0, 4000); this.tono('sine', 300, 1500, 0.25, 0.1); break;
      case 'luz': this.arpegio(['E5', 'G#5', 'B5', 'E6', 'G#6', 'B6'], 0.05, 'triangle', 0.13, 0.3); break;
      case 'crono': this.tono('sine', 1400, 120, 0.7, 0.2); this.tono('square', 700, 60, 0.7, 0.05); this.chasquido(0.7, 0.15, 'bandpass', 3000, 0, 300); break;
      case 'reanudar': this.tono('sine', 150, 1200, 0.4, 0.15); break;
      case 'cambio': this.tono('square', 600, 0, 0.05, 0.1); this.tono('square', 900, 0, 0.08, 0.1, 0.05); break;
      case 'menu': this.tono('square', 720, 0, 0.04, 0.07); break;
      case 'aceptar': this.tono('square', 600, 1200, 0.1, 0.1); break;
      case 'atras': this.tono('square', 500, 250, 0.1, 0.08); break;
      case 'checkpoint': this.arpegio(['C5', 'G5', 'C6'], 0.08, 'square', 0.1, 0.14); break;
      case 'resorte': this.tono('square', 180, 900, 0.28, 0.12); break;
      case 'caida': this.tono('triangle', 700, 80, 0.6, 0.18); break;
      case 'disparoEnemigo': this.tono('sawtooth', 600, 200, 0.12, 0.06); break;
      case 'jefe': this.tono('sawtooth', 70, 40, 0.9, 0.25); this.tono('square', 140, 70, 0.9, 0.08); break;
      case 'onda': this.chasquido(0.4, 0.4, 'lowpass', 500, 0, 100); break;
      case 'puerta': this.tono('triangle', 300, 600, 0.3, 0.12); this.tono('triangle', 450, 900, 0.3, 0.1, 0.15); break;
      case 'victoria': this.arpegio(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], 0.1, 'square', 0.12, 0.2); break;
      case 'derrota': this.arpegio(['G4', 'F#4', 'F4', 'E4', 'D#4'], 0.16, 'square', 0.1, 0.25); break;
      case 'comprar': this.arpegio(['E5', 'B5', 'E6'], 0.06, 'square', 0.1, 0.12); break;
      case 'error': this.tono('square', 160, 120, 0.18, 0.1); break;
      case 'escribir': this.tono('square', 1200 + Math.random() * 300, 0, 0.02, 0.025); break;
    }
  },
};

/* --------------------------- Música ---------------------------------- */
// Notación: un token por semicorchea. "A4" = nota, "-" = sostener, "." = silencio.
const CANCIONES = {
  titulo: {
    bpm: 104,
    canales: [
      { onda: 'triangle', vol: 0.32, notas:
        'A2 . . . A2 . A3 . A2 . . . A2 . A3 . F2 . . . F2 . F3 . F2 . . . F2 . F3 . ' +
        'C3 . . . C3 . C4 . C3 . . . C3 . C4 . G2 . . . G2 . G3 . G2 . . . G2 . G3 .' },
      { onda: 'square', vol: 0.035, notas:
        'A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 A4 C5 E5 C5 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 F4 A4 C5 A4 ' +
        'C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4 G4 B4 D5 B4' },
      { onda: 'square', vol: 0.07, notas:
        'E5 - - - . . A4 - C5 - B4 - A4 - . . C5 - - - . . F4 - A4 - C5 - D5 - . . ' +
        'E5 - - - G5 - E5 - D5 - C5 - D5 - . . D5 - - - . . B4 - G4 - B4 - D5 - - -' },
    ],
    bateria: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
  },
  nivel: {
    bpm: 132,
    canales: [
      { onda: 'triangle', vol: 0.34, notas:
        'D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 . A#1 . A#2 . A#1 . A#2 . A#1 . A#2 . A#1 . A#2 . ' +
        'C2 . C3 . C2 . C3 . C2 . C3 . C2 . C3 . A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .' },
      { onda: 'square', vol: 0.075, notas:
        'D5 - F5 - A5 - - . G5 - F5 - E5 - D5 - D5 - - . C5 - D5 - F5 - - . D5 - - . ' +
        'E5 - G5 - C6 - - . A5 - G5 - E5 - C5 - E5 - - - C#5 - E5 - A5 - - - G5 - E5 -' },
      { onda: 'square', vol: 0.03, notas:
        'A4 . F4 . A4 . F4 . A4 . F4 . A4 . F4 . F4 . D4 . F4 . D4 . F4 . D4 . F4 . D4 . ' +
        'G4 . E4 . G4 . E4 . G4 . E4 . G4 . E4 . E4 . C#4 . E4 . C#4 . E4 . C#4 . E4 . C#4 .' },
    ],
    bateria: { k: 'x...x...x...x...', s: '....x.......x..x', h: 'x.x.x.x.x.x.x.x.' },
  },
  jefe: {
    bpm: 150,
    canales: [
      { onda: 'sawtooth', vol: 0.11, notas:
        'E2 E2 E3 E2 E2 E2 E3 E2 E2 E2 E3 E2 G2 G2 F#2 F#2 C2 C2 C3 C2 C2 C2 C3 C2 C2 C2 C3 C2 D2 D2 D#2 D#2 ' +
        'A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 A2 A1 C2 C2 B1 B1 B1 B1 B2 B1 B1 B1 B2 B1 B1 B1 B2 B1 D#2 D#2 F#2 F#2' },
      { onda: 'square', vol: 0.075, notas:
        'E5 . E5 . G5 . E5 . F#5 . E5 . D#5 . E5 . C5 . C5 . E5 . C5 . D5 . C5 . B4 . C5 . ' +
        'A4 . C5 . E5 . A5 . G5 . E5 . C5 . E5 . B4 . D#5 . F#5 . B5 . A5 . F#5 . D#5 . B4 .' },
    ],
    bateria: { k: 'x..x..x.x..x..x.', s: '....x.......x.xx', h: 'xxxxxxxxxxxxxxxx' },
  },
  mapa: {
    bpm: 96,
    canales: [
      { onda: 'triangle', vol: 0.3, notas:
        'C3 . . . G2 . . . A2 . . . E2 . . . F2 . . . C3 . . . F2 . . . G2 . . . ' +
        'C3 . . . G2 . . . A2 . . . E2 . . . F2 . . . G2 . . . C3 . . . . . . .' },
      { onda: 'square', vol: 0.06, notas:
        'E5 - - D5 C5 - G4 - A4 - C5 - E5 - - - F5 - - E5 D5 - C5 - D5 - - - . . . . ' +
        'E5 - - D5 C5 - G4 - A4 - C5 - E5 - - - F5 - E5 - D5 - B4 - C5 - - - - - - -' },
    ],
    bateria: { k: 'x.......x.......', s: '........x.......', h: '....x.......x...' },
  },
  final: {
    bpm: 88,
    canales: [
      { onda: 'triangle', vol: 0.3, notas:
        'F2 . . . . . . . G2 . . . . . . . E2 . . . . . . . A2 . . . . . . . ' +
        'D2 . . . . . . . G2 . . . . . . . C3 . . . . . . . C3 . . . . . . .' },
      { onda: 'square', vol: 0.06, notas:
        'A4 - C5 - F5 - - - E5 - D5 - B4 - - - G4 - B4 - E5 - - - C5 - B4 - A4 - - - ' +
        'F4 - A4 - D5 - - - B4 - D5 - G5 - - - E5 - - - D5 - - - C5 - - - - - - -' },
      { onda: 'sine', vol: 0.05, notas:
        'F4 A4 C5 A4 F4 A4 C5 A4 G4 B4 D5 B4 G4 B4 D5 B4 E4 G4 B4 G4 E4 G4 B4 G4 A4 C5 E5 C5 A4 C5 E5 C5 ' +
        'D4 F4 A4 F4 D4 F4 A4 F4 G4 B4 D5 B4 G4 B4 D5 B4 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5 C5 E5 G5 E5' },
    ],
    bateria: { k: 'x...............', s: '........x.......', h: 'x...x...x...x...' },
  },
};

function compilarCancion(def) {
  const eventos = [];
  let largo = 0;
  for (const can of def.canales) {
    const toks = can.notas.trim().split(/\s+/);
    largo = Math.max(largo, toks.length);
    const ev = new Array(toks.length).fill(null);
    let ult = null;
    toks.forEach((tk, i) => {
      if (tk === '-') { if (ult) ult.dur++; }
      else if (tk === '.') ult = null;
      else { ult = { f: frecNota(tk), dur: 1 }; ev[i] = ult; }
    });
    eventos.push(ev);
  }
  return { bpm: def.bpm, canales: def.canales, eventos, largo, bateria: def.bateria };
}
const CANCIONES_C = {};

const Musica = {
  actual: null, nombre: null, paso: 0, tSig: 0, timer: null, pendiente: null,

  tocar(nombre) {
    if (this.nombre === nombre && this.timer) return;
    this.parar();
    if (!Sonido.ctx) { this.pendiente = nombre; this.nombre = null; return; }
    if (!CANCIONES_C[nombre]) CANCIONES_C[nombre] = compilarCancion(CANCIONES[nombre]);
    this.actual = CANCIONES_C[nombre];
    this.nombre = nombre;
    this.paso = 0;
    this.tSig = Sonido.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.programar(), 30);
  },

  parar() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.nombre = null;
    this.pendiente = null;
  },

  programar() {
    const c = Sonido.ctx;
    if (!c || !this.actual || c.state !== 'running') return;
    const s = this.actual;
    const dPaso = 60 / s.bpm / 4;
    if (this.tSig < c.currentTime - 0.2) this.tSig = c.currentTime + 0.02;
    while (this.tSig < c.currentTime + 0.15) {
      const i = this.paso % s.largo;
      s.eventos.forEach((ev, ci) => {
        const e = ev[i % ev.length];
        if (e) this.nota(s.canales[ci].onda, e.f, e.dur * dPaso, s.canales[ci].vol, this.tSig);
      });
      const b = s.bateria;
      if (b) {
        const j = i % 16;
        if (b.k[j] === 'x') this.bombo(this.tSig);
        if (b.s[j] === 'x') this.caja(this.tSig);
        if (b.h[j] === 'x') this.platillo(this.tSig);
      }
      this.tSig += dPaso;
      this.paso++;
    }
  },

  nota(onda, f, dur, vol, t) {
    const c = Sonido.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = onda;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.02, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95 + 0.02);
    o.connect(g); g.connect(Sonido.gMusica);
    o.start(t); o.stop(t + dur + 0.05);
  },

  bombo(t) {
    const c = Sonido.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.connect(g); g.connect(Sonido.gMusica);
    o.start(t); o.stop(t + 0.17);
  },

  caja(t) {
    const c = Sonido.ctx;
    const s = c.createBufferSource();
    s.buffer = Sonido.ruido;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800;
    const g = c.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(f); f.connect(g); g.connect(Sonido.gMusica);
    s.start(t, Math.random() * 0.5); s.stop(t + 0.14);
  },

  platillo(t) {
    const c = Sonido.ctx;
    const s = c.createBufferSource();
    s.buffer = Sonido.ruido;
    const f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    s.connect(f); f.connect(g); g.connect(Sonido.gMusica);
    s.start(t, Math.random() * 0.5); s.stop(t + 0.05);
  },
};

document.addEventListener('visibilitychange', () => {
  if (!Sonido.ctx) return;
  if (document.hidden) Sonido.ctx.suspend();
  else Sonido.ctx.resume();
});
