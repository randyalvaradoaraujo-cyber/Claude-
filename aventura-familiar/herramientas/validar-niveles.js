#!/usr/bin/env node
/* Revisa los mapas: anchos de fila, inicio/meta, fotos, letreros y una
   prueba aproximada de que la meta y las fotos se pueden alcanzar
   usando los poderes de la familia. Uso: node herramientas/validar-niveles.js */
'use strict';
const path = require('path');
const { NIVELES, construirMapa } = require(path.join(__dirname, '..', 'js', 'niveles.js'));

const SOLIDO = new Set(['#', 'X', 'J', 'L', 'G']);
const APOYO = new Set(['#', 'X', 'J', '=', '-', 'H']);
let errores = 0;
const mal = (n, m) => { errores++; console.log(`  ✗ [${n}] ${m}`); };

NIVELES.forEach((def, n) => {
  const nombre = `${n + 1} ${def.nombre}`;
  console.log(`Nivel ${nombre}`);
  def.trozos.forEach((tr, i) => {
    const anchos = new Set(tr.map((f) => f.length));
    if (anchos.size > 1) mal(nombre, `trozo ${i}: filas de distinto ancho ${[...anchos]}`);
    if (tr.length !== 10 && tr.length !== 16) mal(nombre, `trozo ${i}: ${tr.length} filas (usa 10 o 16)`);
  });
  const m = construirMapa(def);
  const W = m[0].length, H = m.length;
  const cuenta = (c) => m.join('').split(c).length - 1;
  if (cuenta('P') !== 1) mal(nombre, `debe haber exactamente un inicio P (hay ${cuenta('P')})`);
  if (!def.jefe && cuenta('D') !== 1) mal(nombre, 'falta el elevador D');
  if (def.jefe && cuenta('B') !== 1) mal(nombre, 'falta el jefe B');
  if (!def.jefe && cuenta('f') !== 3) mal(nombre, `debe tener 3 fotos (tiene ${cuenta('f')})`);
  if (cuenta('?') !== def.pistas.length) mal(nombre, `${cuenta('?')} letreros pero ${def.pistas.length} pistas`);

  const at = (x, y) => (x < 0 || x >= W ? '#' : y < 0 || y >= H ? '.' : m[y][x]);
  // apoyos extra de plataformas móviles
  const extra = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (m[y][x] === 'm') for (let xx = x - 4; xx <= x + 6; xx++) extra.add(xx + ',' + y);
    if (m[y][x] === 'v') for (let yy = y - 4; yy <= y; yy++) for (let xx = x; xx <= x + 2; xx++) extra.add(xx + ',' + yy);
  }
  const apoyo = (x, y) => APOYO.has(at(x, y)) || extra.has(x + ',' + y);
  const libre = (x, y) => !SOLIDO.has(at(x, y)) || at(x, y) === 'X' || at(x, y) === 'L' || at(x, y) === 'G';
  const parado = (x, y) => libre(x, y) && libre(x, y - 1) && apoyo(x, y + 1) && y + 1 < H;

  let ini = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y][x] === 'P') ini = [x, y];
  if (!ini) return;
  const vistos = new Set([ini.join(',')]);
  const cola = [ini];
  while (cola.length) {
    const [x, y] = cola.shift();
    const resorte = at(x, y + 1) === 'J';
    for (let x2 = x - 10; x2 <= x + 10; x2++) {
      for (let y2 = y - 10; y2 <= H; y2++) {
        if (!parado(x2, y2)) continue;
        const k = x2 + ',' + y2;
        if (vistos.has(k)) continue;
        const dx = Math.abs(x2 - x), sube = y - y2, baja = y2 - y;
        let ok = false;
        if (sube <= 3 && dx <= 3) ok = true;                       // salto normal
        if (sube <= 0 && dx <= 3 + Math.ceil(baja / 2)) ok = true;  // caída con impulso
        if (sube <= 5 && dx <= 5) ok = true;                       // doble salto de Jacob
        if (sube <= 0 && dx <= 8 + 2 * baja) ok = true;             // planeo de Jazzlyn
        if (resorte && sube <= 8 && dx <= 4) ok = true;            // resorte
        if (ok) { vistos.add(k); cola.push([x2, y2]); }
      }
    }
  }
  const alcanzable = (cx, cy, aereo = false) => {
    for (const k of vistos) {
      const [x, y] = k.split(',').map(Number);
      if (Math.abs(x - cx) <= 1 && cy <= y && cy >= y - 4) return true;
      // en el aire: al alcance de un planeo o doble salto desde una posición cercana
      if (aereo && Math.abs(x - cx) <= 7 && cy >= y - 5 && cy <= y + 3 && libre(cx, cy)) return true;
    }
    return false;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = m[y][x];
    if (c === 'D' && !alcanzable(x, y)) mal(nombre, `el elevador en (${x},${y}) no parece alcanzable`);
    if (c === 'f' && !alcanzable(x, y, true)) mal(nombre, `la foto en (${x},${y}) no parece alcanzable`);
    if (c === 'B' && !alcanzable(x, y)) mal(nombre, `la arena del jefe en (${x},${y}) no parece alcanzable`);
  }
  console.log(`  ancho ${W} casillas, ${vistos.size} posiciones alcanzables`);
});

if (errores) { console.log(`\n${errores} problema(s) encontrados.`); process.exit(1); }
console.log('\nTodos los niveles están bien.');
