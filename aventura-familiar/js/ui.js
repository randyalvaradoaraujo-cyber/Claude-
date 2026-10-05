'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — ui.js
   Paneles, botones neón y piezas de interfaz compartidas.
   ===================================================================== */

function caminoCortado(g, x, y, w, h, c) {
  g.beginPath();
  g.moveTo(x + c, y);
  g.lineTo(x + w - c, y);
  g.lineTo(x + w, y + c);
  g.lineTo(x + w, y + h - c);
  g.lineTo(x + w - c, y + h);
  g.lineTo(x + c, y + h);
  g.lineTo(x, y + h - c);
  g.lineTo(x, y + c);
  g.closePath();
}

const UI = {
  marco(g, x, y, w, h, color = COL.cian, fondo = COL.panel) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.save();
    caminoCortado(g, x + 0.5, y + 0.5, w - 1, h - 1, 4);
    g.fillStyle = fondo;
    g.fill();
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.stroke();
    g.globalAlpha = 0.35;
    caminoCortado(g, x + 2.5, y + 2.5, w - 5, h - 5, 3);
    g.stroke();
    g.restore();
    rect(g, x + 6, y, 10, 1, '#ffffff');
    rect(g, x + w - 16, y + h - 1, 10, 1, '#ffffff');
  },

  // Botón inmediato: dibuja y devuelve true si se tocó.
  boton(g, r, etiqueta, o = {}) {
    const off = !!o.off;
    const pres = !off && Entrada.presionando(r);
    const sel = !!o.sel;
    const color = off ? '#4a4866' : (o.color || COL.cian);
    const x = Math.round(r.x), y = Math.round(r.y) + (pres ? 1 : 0), w = Math.round(r.w), h = Math.round(r.h);
    g.save();
    if (sel || pres) { g.shadowColor = color; g.shadowBlur = 6; }
    caminoCortado(g, x + 0.5, y + 0.5, w - 1, h - 1, Math.min(5, h / 3));
    g.fillStyle = pres ? 'rgba(63,243,255,0.25)' : (o.fondo || 'rgba(14,12,36,0.92)');
    g.fill();
    g.strokeStyle = color;
    g.stroke();
    g.restore();
    if (sel) rect(g, x + 4, y + h - 2, w - 8, 1, COL.magenta);
    const esc = o.esc || 1;
    const ct = off ? '#6a6680' : (o.colorTexto || COL.crema);
    texto(g, etiqueta, x + w / 2, y + h / 2 - (7 * esc) / 2 + 1, ct, { esc, alin: 'centro', sombra: off ? null : '#3a2a10' });
    return !off && Entrada.tocado(r);
  },

  barra(g, x, y, w, h, frac, color, fondo = '#1b1630', brillo = null) {
    rect(g, x, y, w, h, '#0a0814');
    rect(g, x + 1, y + 1, w - 2, h - 2, fondo);
    const fw = Math.round((w - 2) * clamp(frac, 0, 1));
    if (fw > 0) {
      rect(g, x + 1, y + 1, fw, h - 2, color);
      rect(g, x + 1, y + 1, fw, 1, brillo || shade(color, 60));
    }
  },

  icono(g, tipo, x, y, color) {
    const mapas = {
      corazon: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
      gota: ['...#...', '..###..', '.#####.', '#######', '#######', '.#####.', '..###..'],
      chip: ['.###.', '#####', '##.##', '#####', '.###.'],
      foto: ['#######', '#.....#', '#.#.#.#', '#.....#', '#######'],
      pausa: ['##.##', '##.##', '##.##', '##.##', '##.##'],
      reloj: ['.###.', '#.#.#', '#.###', '#...#', '.###.'],
      candado: ['.###.', '#...#', '#####', '##.##', '#####'],
      estrella: ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'],
    };
    const m = mapas[tipo];
    if (!m) return;
    g.fillStyle = color;
    for (let r = 0; r < m.length; r++) for (let i = 0; i < m[r].length; i++) if (m[r][i] === '#') g.fillRect(x + i, y + r, 1, 1);
  },
};

// Espada pixelada (cursor del menú, como en la portada)
const ESPADA = (() => {
  const m = [
    '...........WW',
    '..........WSW',
    '.........WSW.',
    '........WSW..',
    '.......WSW...',
    '......WSW....',
    '.G...WSW.....',
    '.GG.WSW......',
    '..GGSW.......',
    '..BGGG.......',
    '.BB..GG......',
    'BB....G......',
    'B............',
  ];
  const c = lienzo(13, 13);
  mapaPix(c.getContext('2d'), m, { W: '#ffffff', S: '#9fb4d8', G: '#c8902a', B: '#7a4a2a' }, 0, 0);
  return contornear(c, '#1a1033');
})();

// Cuadro de diálogo con retrato y texto que se escribe solo.
class Dialogo {
  constructor(lineas, alTerminar) {
    this.lineas = lineas;
    this.i = 0;
    this.chars = 0;
    this.alTerminar = alTerminar;
    this.activo = lineas.length > 0;
    this.ultimoSonido = 0;
    if (!this.activo && alTerminar) alTerminar();
  }

  avanzar() {
    const l = this.lineas[this.i];
    if (this.chars < l.t.length) { this.chars = l.t.length; return; }
    this.i++;
    this.chars = 0;
    Sonido.efecto('menu');
    if (this.i >= this.lineas.length) this.terminar();
  }

  terminar() {
    if (!this.activo) return;
    this.activo = false;
    if (this.alTerminar) this.alTerminar();
  }

  actualizar(dt) {
    if (!this.activo) return;
    const l = this.lineas[this.i];
    const antes = Math.floor(this.chars);
    this.chars = Math.min(l.t.length, this.chars + dt * 42);
    if (Math.floor(this.chars) !== antes && Math.floor(this.chars) % 2 === 0) Sonido.efecto('escribir');
  }

  // Devuelve true si consumió la entrada
  dibujar(g, W, H) {
    if (!this.activo) return false;
    const l = this.lineas[this.i];
    const h = 84, x = 6, w = W - 12, y = H - h - 8;
    const pj = l.q === 'cronos' ? { nombre: 'DR. CRONOS', color: '#c86bff' } : PERSONAJES[IDX_PJ[l.q]];
    UI.marco(g, x, y, w, h, pj.color);
    // retrato
    const rx = x + 7, ry = y + 9, rs = 44;
    rect(g, rx - 2, ry - 2, rs + 4, rs + 4, pj.color);
    rect(g, rx - 1, ry - 1, rs + 2, rs + 2, '#0a0814');
    if (l.q === 'cronos') g.drawImage(SPR.cronos, rx, ry, rs, rs);
    else dibujarSuave(g, IMG['cara_' + l.q], 0, 0, 96, 96, rx, ry, rs, rs);
    texto(g, pj.nombre, rx + rs + 8, y + 10, pj.color, { sombra: '#000' });
    const lineas = envolver(l.t.slice(0, Math.floor(this.chars)), w - rs - 26);
    lineas.slice(0, 5).forEach((ln, i) => texto(g, ln, rx + rs + 8, y + 24 + i * 11, COL.blanco));
    if (this.chars >= l.t.length && Math.floor(Date.now() / 300) % 2) texto(g, '▶', x + w - 12, y + h - 13, COL.amarillo);
    // botón saltar
    const rs2 = { x: W - 64, y: y - 22, w: 58, h: 18 };
    if (UI.boton(g, rs2, 'SALTAR', { esc: 1, color: '#8a8fb0' })) { this.terminar(); return true; }
    const dentroCaja = { x: 0, y: 0, w: W, h: H };
    if (Entrada.tocado(dentroCaja) || Entrada.pulso('Space', 'Enter', 'KeyZ', 'KeyX', 'KeyK')) this.avanzar();
    return true;
  }
}
