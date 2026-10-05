'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — juego.js
   La escena de juego: mapa, física, cámara, poderes, HUD, controles
   táctiles, pausa, derrota, resultados y pelea contra el Dr. Cronos.
   ===================================================================== */

const CACHE_FONDOS = {};
function fondoTema(t) {
  if (!CACHE_FONDOS[t]) CACHE_FONDOS[t] = generarFondo(t);
  return CACHE_FONDOS[t];
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function contarBits(n) { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }

function formatoTiempo(s) {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

class EscenaJuego {
  entrar(p) {
    this.nivelIdx = p.nivel || 0;
    this.cargar();
  }

  /* ---------------------------- carga ------------------------------ */
  cargar() {
    const def = NIVELES[this.nivelIdx];
    this.def = def;
    const filas = construirMapa(def);
    this.ancho = filas[0].length; this.alto = filas.length;
    this.anchoPx = this.ancho * TS; this.altoPx = this.alto * TS;
    this.mapa = filas.map((f) => f.split(''));
    this.resortes = new Map();
    this.enemigos = []; this.proyectiles = []; this.objetos = []; this.plataformas = [];
    this.particulas = new Particulas();
    this.jefe = null; this.arena = null;
    this.t = 0; this.tiempo = 0; this.chips = 0; this.fotos = 0;
    this.stats = { enemigos: 0, chips: 0 };
    this.tiempoDetenido = 0; this.sacT = 0; this.sacF = 0; this.flashDano = 0;
    this.avisos = []; this.letreroActivo = null; this.victoria = false;
    this.compuerta = false; this.peleaJefe = false; this.mision = null;
    this.estado = 'jugando'; this.dialogo = null; this.prev = {};
    this.tCambio = 0; this.fundidoFinal = 0;

    const M = Guardado.datos.mejoras;
    this.M = M;
    this.factorCosto = 1 - 0.1 * M.energia;
    this.regen = 5 * (1 + 0.25 * M.energia);
    this.vidas = 3 + M.vidas;
    this.equipo = PERSONAJES.map((d) => {
      const vm = Math.round(d.vida * (1 + 0.15 * M.salud));
      return { vida: vm, vidaMax: vm, energia: 60, energiaMax: 100 };
    });
    this.activo = IDX_PJ.randy;

    let iFoto = 0, iLetrero = 0;
    for (let y = 0; y < this.alto; y++) {
      for (let x = 0; x < this.ancho; x++) {
        const c = this.mapa[y][x];
        const px = x * TS, py = y * TS;
        let marcador = true;
        switch (c) {
          case 'P': this.inicio = { x: px + 2, y: py + TS - 28 }; break;
          case 'c': this.objetos.push(new Objeto(this, 'chip', px + 4, py + 4)); break;
          case 'e': this.objetos.push(new Objeto(this, 'energia', px + 3, py + 2)); break;
          case 'p': this.objetos.push(new Objeto(this, 'pozole', px, py + 5)); break;
          case 'f': this.objetos.push(new Objeto(this, 'foto', px + 1, py + 1, { indice: iFoto++ })); break;
          case 'k': this.objetos.push(new Objeto(this, 'antena', px + 2, py + TS - 32)); break;
          case '?': this.objetos.push(new Objeto(this, 'letrero', px, py + TS - 22, { indice: iLetrero++ })); break;
          case 'D': this.objetos.push(new Objeto(this, 'elevador', px - 8, py + TS - 48)); break;
          case 'd': this.enemigos.push(new Dron(this, px, py)); break;
          case 'r': this.enemigos.push(new Robot(this, px, py)); break;
          case 't': this.enemigos.push(new Torreta(this, px, py)); break;
          case 'a': this.enemigos.push(new Agente(this, px, py)); break;
          case 'm': case 'v': this.plataformas.push(new PlataformaMovil(this, px, py, c)); break;
          case 'B': this.posJefe = { x: px, y: py }; break;
          default: marcador = false;
        }
        if (marcador) this.mapa[y][x] = '.';
      }
    }
    // el elevador va detrás de todo
    this.objetos.sort((a, b) => (a.tipo === 'elevador' ? -1 : 0) - (b.tipo === 'elevador' ? -1 : 0));

    if (def.jefe) {
      let gx = 0;
      for (let x = 0; x < this.ancho; x++) if (this.mapa[11][x] === 'G') { gx = x; break; }
      this.arena = { x0: gx * TS, x1: this.anchoPx };
      this.jefe = new Jefe(this, (gx + 1) * TS, (this.ancho - 1) * TS, 12 * TS);
    }

    this.punto = { x: this.inicio.x, y: this.inicio.y };
    this.jugador = new Jugador(this, this.inicio.x, this.inicio.y);
    this.camX = clamp(this.jugador.x - App.W / 2, 0, Math.max(0, this.anchoPx - App.W));
    this.camY = 0;
    this.fondo = fondoTema(def.tema);
    const r = semilla(this.nivelIdx * 31 + 7);
    this.estrellas = [];
    for (let i = 0; i < 90; i++) this.estrellas.push({ x: r() * 600, y: r() * 420, f: r() * 6, c: r() < 0.15 ? '#9ff4ff' : '#ffffff' });
    this.vapor = []; this.autos = []; this.gotas = []; this.rayo = 0;

    this.actualizarCamara(1);
    if (def.intro.length) {
      this.estado = 'dialogo';
      this.dialogo = new Dialogo(def.intro, () => { this.estado = 'jugando'; this.mostrarMision(); });
    } else this.mostrarMision();
    Musica.tocar(def.jefe ? 'mapa' : def.musica);
  }

  mostrarMision() { this.mision = { t: 0 }; }

  /* ---------------------------- mapa ------------------------------- */
  cas(tx, ty) {
    if (tx < 0 || tx >= this.ancho) return '#';
    if (ty < 0 || ty >= this.alto) return '.';
    return this.mapa[ty][tx];
  }

  get holoActivo() { return this.activo === IDX_PJ.jazzlyn; }

  solidoCas(tx, ty) {
    const c = this.cas(tx, ty);
    if (c === '#' || c === 'X' || c === 'J') return true;
    if (c === 'L') return this.tiempoDetenido <= 0;
    if (c === 'G') return this.compuerta;
    return false;
  }

  plataformaCas(c, e) {
    if (c === '=' || c === '-') return true;
    if (c === 'H') return e.esJugador || e instanceof Objeto ? this.holoActivo : true;
    return false;
  }

  solidoEn(px, py) { return this.solidoCas(Math.floor(px / TS), Math.floor(py / TS)); }

  apoyoEn(px, py) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    return this.solidoCas(tx, ty) || this.plataformaCas(this.cas(tx, ty), {});
  }

  esMacizo(tx, ty) { const c = this.cas(tx, ty); return c === '#' || c === 'X'; }

  esTope(tx, ty) {
    return tx >= 0 && tx < this.ancho && this.cas(tx, ty) === '#' && !this.esMacizo(tx, ty - 1) && this.cas(tx, ty - 1) !== 'L';
  }

  // Movimiento con colisiones contra casillas (eje X y luego Y).
  // Si el jugador choca con un borde que está apenas por encima de sus pies, lo sube.
  escalon(e, tx, ty) {
    if (!e.esJugador || !e.suelo) return false;
    const tope = ty * TS;
    if (e.y + e.h - tope > 5 || this.solidoCas(tx, ty - 1)) return false;
    for (let r = Math.floor((tope - e.h) / TS); r < ty; r++) if (this.solidoCas(tx, r)) return false;
    e.y = tope - e.h;
    return true;
  }

  mover(e, dt) {
    e.x += e.vx * dt;
    e.chocoPared = 0;
    const y0 = Math.floor(e.y / TS), y1 = Math.floor((e.y + e.h - 0.01) / TS);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w - 0.01) / TS);
      for (let ty = y0; ty <= y1; ty++) {
        if (this.solidoCas(tx, ty)) {
          if (ty === y1 && this.escalon(e, tx, ty)) break;
          e.x = tx * TS - e.w; e.vx = 0; e.chocoPared = 1; break;
        }
      }
    } else if (e.vx < 0) {
      const tx = Math.floor(e.x / TS);
      for (let ty = y0; ty <= y1; ty++) {
        if (this.solidoCas(tx, ty)) {
          if (ty === y1 && this.escalon(e, tx, ty)) break;
          e.x = (tx + 1) * TS; e.vx = 0; e.chocoPared = -1; break;
        }
      }
    }
    const lim = this.arena && this.compuerta ? this.arena : { x0: 0, x1: this.anchoPx };
    if (e.x < lim.x0) { e.x = lim.x0; e.vx = 0; e.chocoPared = -1; }
    if (e.x + e.w > lim.x1) { e.x = lim.x1 - e.w; e.vx = 0; e.chocoPared = 1; }

    const antes = e.y + e.h;
    e.y += e.vy * dt;
    e.suelo = false;
    const x0 = Math.floor(e.x / TS), x1 = Math.floor((e.x + e.w - 0.01) / TS);
    if (e.vy >= 0) {
      const ty = Math.floor((e.y + e.h - 0.01) / TS);
      for (let tx = x0; tx <= x1; tx++) {
        const c = this.cas(tx, ty);
        if (this.solidoCas(tx, ty) || (this.plataformaCas(c, e) && antes <= ty * TS + 1)) {
          e.y = ty * TS - e.h; e.vy = 0; e.suelo = true;
          break;
        }
      }
      if (e.esJugador && !e.suelo) {
        e.plataforma = null;
        for (const pl of this.plataformas) {
          if (e.x + e.w > pl.x && e.x < pl.x + pl.w && antes <= pl.y + 2 + Math.max(0, pl.dy) && e.y + e.h >= pl.y) {
            e.y = pl.y - e.h; e.vy = 0; e.suelo = true; e.plataforma = pl;
            break;
          }
        }
      }
    } else {
      const ty = Math.floor(e.y / TS);
      for (let tx = x0; tx <= x1; tx++) {
        if (this.solidoCas(tx, ty)) { e.y = (ty + 1) * TS; e.vy = 0; break; }
      }
    }
  }

  revisarResorte(p) {
    const ty = Math.floor((p.y + p.h + 1) / TS);
    for (let tx = Math.floor(p.x / TS); tx <= Math.floor((p.x + p.w - 0.01) / TS); tx++) {
      if (this.cas(tx, ty) === 'J') {
        p.vy = -585; p.suelo = false; p.cortable = false; p.saltos = 1;
        this.resortes.set(tx + ',' + ty, 0.25);
        Sonido.efecto('resorte');
        this.particulas.chispa(tx * TS + 8, ty * TS, '#ffd23f', 6, 60);
        return;
      }
    }
  }

  revisarLaser(p) {
    if (this.tiempoDetenido > 0 || this.estado !== 'jugando') return;
    const x0 = Math.floor((p.x - 1) / TS), x1 = Math.floor((p.x + p.w + 1) / TS);
    const y0 = Math.floor(p.y / TS), y1 = Math.floor((p.y + p.h - 1) / TS);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.cas(tx, ty) !== 'L') continue;
        const centro = tx * TS + 8;
        if (p.x < (tx + 1) * TS && p.x + p.w > tx * TS) p.x = p.cx < centro ? tx * TS - p.w - 1 : (tx + 1) * TS + 1;
        if (p.herir(20, centro)) this.aviso('¡LÁSER! USA EL CRONO-ATAQUE DE RANDY', COL.rojo);
        return;
      }
    }
  }

  /* ---------------------------- combate ---------------------------- */
  objetivos() {
    const l = this.enemigos.filter((e) => e.vivo);
    if (this.jefe && this.jefe.vivo && this.jefe.activo && this.jefe.estado !== 'muerte') l.push(this.jefe);
    return l;
  }

  multDano() { return (1 + 0.2 * this.M.fuerza) * (this.tiempoDetenido > 0 ? 2 : 1); }

  golpearArea(r, dano, dir, ya, romper = false) {
    let n = 0;
    const d = Math.round(dano * this.multDano());
    for (const e of this.objetivos()) {
      if (ya && ya.has(e)) continue;
      if (choca(r, e)) { e.herir(d, dir); if (ya) ya.add(e); n++; }
    }
    if (romper) n += this.romperEn(r);
    return n;
  }

  romperCasilla(tx, ty) {
    if (this.cas(tx, ty) !== 'X') return false;
    this.mapa[ty][tx] = '.';
    const cx = tx * TS + 8, cy = ty * TS + 8;
    for (let i = 0; i < 10; i++) {
      this.particulas.agregar({ x: cx + rnd(-6, 6), y: cy + rnd(-6, 6), vx: rnd(-90, 90), vy: rnd(-160, -40), vida: 0.7, color: elegir(['#5d5070', '#8f80a8', '#3a3050']), grav: 600, tam: 2 });
    }
    return true;
  }

  romperEn(r) {
    let n = 0;
    for (let ty = Math.floor(r.y / TS); ty <= Math.floor((r.y + r.h) / TS); ty++) {
      for (let tx = Math.floor(r.x / TS); tx <= Math.floor((r.x + r.w) / TS); tx++) {
        if (this.romperCasilla(tx, ty)) n++;
      }
    }
    if (n) { Sonido.efecto('romper'); this.sacudir(0.15, 3); vibrar(40); }
    return n;
  }

  disparar(o) { this.proyectiles.push(new Proyectil(o)); }

  explosion(x, y, grande) {
    Sonido.efecto('explosion');
    const n = grande ? 40 : 14;
    this.particulas.chispa(x, y, '#ffa94d', n, grande ? 160 : 90, 0.6);
    this.particulas.chispa(x, y, '#fff1b8', n / 2, grande ? 120 : 60, 0.4);
    this.particulas.chispa(x, y, '#ff3fbf', n / 2, grande ? 140 : 70, 0.5);
    this.particulas.anillo(x, y, '#ffe066', grande ? 60 : 18, 0.35);
    if (grande) { this.sacudir(0.8, 6); vibrar(200); }
  }

  soltar(tipo, x, y) {
    const o = new Objeto(this, tipo, x - 5, y - 5, { fisica: true });
    o.vx = rnd(-50, 50); o.vy = -180;
    if (tipo === 'chip') { o.suelto = true; o.vidaRest = 9; }
    this.objetos.push(o);
  }

  soltarBotin(e) {
    const n = rndi(1, 3);
    for (let i = 0; i < n; i++) this.soltar('chip', e.cx, e.cy);
    const r = Math.random();
    if (r < 0.18) this.soltar('energia', e.cx, e.cy);
    else if (r < 0.27) this.soltar('pozole', e.cx, e.cy);
  }

  sacudir(t, f) { this.sacT = Math.max(this.sacT, t); this.sacF = Math.max(this.sacF, f); }

  aviso(t, color = COL.crema) {
    if (this.avisos.length && this.avisos[this.avisos.length - 1].t === t) return;
    this.avisos.push({ t, color, vida: 2 });
    if (this.avisos.length > 3) this.avisos.shift();
  }

  cuentaFotos() { return contarBits(this.fotos); }

  /* ---------------------------- poderes ---------------------------- */
  explosionPozole(p) {
    const cx = p.cx, cy = p.y + p.h - 6;
    Sonido.efecto('pozole');
    this.sacudir(0.45, 5); vibrar(120);
    this.particulas.anillo(cx, cy, '#ffa94d', 74, 0.5);
    this.particulas.anillo(cx, cy, '#ff4d6d', 52, 0.4);
    for (let i = 0; i < 34; i++) {
      const a = Math.PI + Math.random() * Math.PI, v = rnd(60, 200);
      this.particulas.agregar({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.8, color: elegir(['#d8432c', '#e8603c', '#5fd35f', '#ffffff', '#f0e0a0']), grav: 500, tam: 2 });
    }
    this.aviso('¡EXPLOSIÓN DE POZOLE!', '#ffa94d');
    const d = Math.round(8 * this.multDano());
    for (const e of this.objetivos()) if (Math.hypot(e.cx - cx, e.cy - cy) < 76) e.herir(d, e.cx > cx ? 1 : -1);
    let rotos = 0;
    for (let ty = Math.floor((cy - 64) / TS); ty <= Math.floor((cy + 48) / TS); ty++) {
      for (let tx = Math.floor((cx - 64) / TS); tx <= Math.floor((cx + 64) / TS); tx++) {
        if (Math.hypot(tx * TS + 8 - cx, ty * TS + 8 - cy) < 60 && this.romperCasilla(tx, ty)) rotos++;
      }
    }
    if (rotos) Sonido.efecto('romper');
  }

  luzDeDeseo(p) {
    Sonido.efecto('luz');
    this.particulas.anillo(p.cx, p.cy, '#ff8ad8', 96, 0.6);
    this.particulas.anillo(p.cx, p.cy, '#3ff3ff', 70, 0.5);
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(40, 140);
      this.particulas.agregar({ x: p.cx, y: p.cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.9, color: elegir(['#ffe066', '#ff8ad8', '#ffffff', '#9ff4ff']), grav: 0, tam: 1 });
    }
    for (const m of this.equipo) m.vida = Math.min(m.vidaMax, m.vida + Math.round(m.vidaMax * 0.35));
    const d = Math.round(4 * this.multDano());
    for (const e of this.objetivos()) if (Math.hypot(e.cx - p.cx, e.cy - p.cy) < 92) e.herir(d, e.cx > p.cx ? 1 : -1);
    for (const b of this.proyectiles) if (b.duenio === 'enemigo' && Math.hypot(b.x - p.cx, b.y - p.cy) < 92) b.vivo = false;
    this.aviso('¡LUZ DE DESEO! LA FAMILIA SE CURA', '#ff8ad8');
  }

  cronoAtaque(p) {
    this.tiempoDetenido = 4;
    Sonido.efecto('crono');
    this.particulas.anillo(p.cx, p.cy, '#4dff9a', 160, 0.7);
    this.aviso('¡CRONO-ATAQUE! EL TIEMPO SE DETUVO', COL.verde);
    vibrar(60);
  }

  cambiarPersonaje(i) {
    if (i === this.activo || this.tCambio > 0 || this.estado !== 'jugando') return;
    const p = this.jugador;
    if (p.tDash > 0 || p.slam) return;
    this.activo = i;
    this.tCambio = 0.2;
    p.animAtaque = 0; p.tAtaque = 0; p.planeando = false;
    if (!p.suelo && p.saltos === 0) p.saltos = 1;
    Sonido.efecto('cambio');
    const d = PERSONAJES[i];
    this.particulas.anillo(p.cx, p.cy, d.color, 22, 0.3);
    this.particulas.chispa(p.cx, p.cy, d.color, 10, 70, 0.4, 0);
    this.aviso(d.nombre + ' · ' + d.poder, d.color);
  }

  /* ---------------------------- estados ---------------------------- */
  jugadorCae(porCaida = false) {
    if (this.estado !== 'jugando') return;
    this.estado = 'muerto';
    this.tMuerte = 0;
    this.porCaida = porCaida;
    this.tiempoDetenido = 0;
    this.vidas--;
    const p = this.jugador;
    p.slam = false; p.tDash = 0; p.plataforma = null;
    if (porCaida) { Sonido.efecto('caida'); p.oculto = true; }
    else { p.vy = -320; p.vx = 0; p.tHerido = 2; }
    vibrar(150);
  }

  reaparecer() {
    const p = this.jugador;
    const m = this.equipo[this.activo];
    m.vida = m.vidaMax;
    p.x = this.punto.x; p.y = this.punto.y; p.vx = 0; p.vy = 0;
    p.oculto = false; p.tHerido = 0; p.inv = 2; p.slam = false; p.saltos = 0;
    this.camX = clamp(p.cx - App.W / 2, 0, Math.max(0, this.anchoPx - App.W));
    if (this.peleaJefe) this.camX = clamp(this.camX, this.arena.x0, this.arena.x1 - App.W);
    this.proyectiles = this.proyectiles.filter((b) => b.duenio === 'jugador');
    this.estado = 'jugando';
    this.aviso('¡A SEGUIR, FAMILIA!', COL.cian);
  }

  pausar() {
    if (this.estado !== 'jugando') return;
    this.estado = 'pausa';
    Sonido.efecto('menu');
  }

  llegarElevador(o) {
    this.estado = 'elevador';
    this.tElev = 0;
    this.elevador = o;
    this.tiempoDetenido = 0;
    Sonido.efecto('puerta');
    Musica.parar();
  }

  completarNivel() {
    const d = Guardado.datos, i = this.nivelIdx;
    const nuevas = this.fotos & ~d.fotos[i];
    d.fotos[i] |= this.fotos;
    d.completado[i] = true;
    d.desbloqueado = Math.max(d.desbloqueado, Math.min(NIVELES.length - 1, i + 1));
    const bono = contarBits(nuevas) * 10;
    d.chips += this.chips + bono;
    const t = Math.round(this.tiempo);
    const record = !d.tiempos[i] || t < d.tiempos[i];
    if (record) d.tiempos[i] = t;
    Guardado.guardar();
    this.resultado = { chips: this.chips, bono, fotos: this.cuentaFotos(), tiempo: t, record, enemigos: this.stats.enemigos, t: 0 };
    this.estado = 'resultado';
    Sonido.efecto('victoria');
    setTimeout(() => { if (App.escena === this && this.estado === 'resultado') Musica.tocar('mapa'); }, 1400);
  }

  iniciarPelea() {
    this.peleaJefe = true;
    this.compuerta = true;
    Musica.parar();
    Sonido.efecto('jefe');
    this.sacudir(0.5, 3);
    this.jefe.iniciar();
    this.aviso('¡PELIGRO! SE CERRÓ LA COMPUERTA', COL.rojo);
  }

  dialogoJefe() {
    this.estado = 'dialogo';
    this.dialogo = new Dialogo(HISTORIA.jefe, () => {
      this.estado = 'jugando';
      this.jefe.cambiar('flotar');
      Musica.tocar('jefe');
    });
  }

  jefeVencido() {
    for (const e of this.enemigos) if (e.vivo) e.morir();
    this.proyectiles = this.proyectiles.filter((b) => b.duenio === 'jugador');
    this.tiempoDetenido = 0;
    Musica.parar();
    Sonido.efecto('jefe');
    this.aviso('¡DR. CRONOS DERROTADO!', COL.amarillo);
  }

  recogerMicrochip() {
    this.estado = 'final';
    this.victoria = true;
    this.tFinal = 0;
    Sonido.efecto('victoria');
    vibrar(200);
    this.particulas.anillo(this.jugador.cx, this.jugador.cy, '#3ff3ff', 120, 0.9);
    this.aviso('¡MICROCHIP DEL TIEMPO RECUPERADO!', COL.cian);
  }

  terminarJuego() {
    const d = Guardado.datos, i = this.nivelIdx;
    d.fotos[i] |= this.fotos;
    d.completado[i] = true;
    d.chips += this.chips;
    d.terminado = true;
    const t = Math.round(this.tiempo);
    if (!d.tiempos[i] || t < d.tiempos[i]) d.tiempos[i] = t;
    Guardado.guardar();
    App.ir('final');
  }

  /* ---------------------------- controles -------------------------- */
  reserva() {
    const W = App.W, H = App.H;
    if (H < W * 1.25) return 0;
    return clamp(H - this.altoPx - 64, 0, 150);
  }

  layoutControles() {
    const W = App.W, H = App.H, s = Opciones.botones;
    const R = Math.round(21 * s), m = 12;
    const by = H - m - R;
    const izq = { x: m + R, y: by }, der = { x: m + 3 * R + 8, y: by };
    return {
      R, izq, der,
      mitad: (izq.x + der.x) / 2,
      zona: { x: 0, y: by - R - 34, w: der.x + R + 28, h: H - (by - R - 34) },
      A: { k: 'salto', x: W - m - R, y: by - 4, r: R, et: 'A', color: COL.verde },
      B: { k: 'ataque', x: W - m - 3 * R - 6, y: by + 6, r: R, et: 'B', color: COL.magenta },
      E: { k: 'especial', x: W - m - 2 * R - 2, y: by - 2 * R - 12, r: Math.round(R * 0.85), et: '★', color: COL.amarillo },
      S: { k: 'cambio', x: W - m - 4 * R - 14, y: by - 2 * R - 2, r: Math.round(R * 0.7), et: '⇄', color: COL.cian },
    };
  }

  leerControles() {
    const L = this.layoutControles();
    const C = { izq: false, der: false, saltoMant: false, ataqueMant: false, especialMant: false, cambioMant: false, elegir: -1 };
    for (const p of Entrada.punteros.values()) {
      if (dentro(p.x0, p.y0, L.zona)) { if (p.x < L.mitad) C.izq = true; else C.der = true; continue; }
      for (const b of [L.A, L.B, L.E, L.S]) {
        if (Math.hypot(p.x - b.x, p.y - b.y) < b.r * 1.4) C[b.k + 'Mant'] = true;
      }
    }
    const T = (...c) => Entrada.tecla(...c);
    if (T('ArrowLeft', 'KeyA')) C.izq = true;
    if (T('ArrowRight', 'KeyD')) C.der = true;
    if (T('Space', 'ArrowUp', 'KeyW', 'KeyZ', 'KeyK')) C.saltoMant = true;
    if (T('KeyX', 'KeyJ')) C.ataqueMant = true;
    if (T('KeyC', 'KeyL')) C.especialMant = true;
    if (T('KeyQ', 'ShiftLeft', 'ShiftRight', 'Tab')) C.cambioMant = true;
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((k, i) => { if (Entrada.pulso(k)) C.elegir = i; });
    const P = this.prev;
    C.saltoPulso = (C.saltoMant && !P.saltoMant) || Entrada.pulso('Space', 'ArrowUp', 'KeyW', 'KeyZ', 'KeyK');
    C.ataquePulso = (C.ataqueMant && !P.ataqueMant) || Entrada.pulso('KeyX', 'KeyJ');
    C.especialPulso = (C.especialMant && !P.especialMant) || Entrada.pulso('KeyC', 'KeyL');
    C.cambioPulso = (C.cambioMant && !P.cambioMant) || Entrada.pulso('KeyQ', 'ShiftLeft', 'ShiftRight', 'Tab');
    this.prev = { saltoMant: C.saltoMant, ataqueMant: C.ataqueMant, especialMant: C.especialMant, cambioMant: C.cambioMant };
    this.C = C;
    return C;
  }

  /* ---------------------------- actualización ---------------------- */
  actualizar(dt) {
    this.t += dt;
    this.actualizarFondo(dt);
    for (const a of this.avisos) a.vida -= dt;
    this.avisos = this.avisos.filter((a) => a.vida > 0);
    if (this.mision) { this.mision.t += dt; if (this.mision.t > 6) this.mision = null; }
    if (this.estado === 'pausa' || this.estado === 'gameover' || this.estado === 'resultado') {
      if (this.estado === 'resultado') this.resultado.t += dt;
      return;
    }
    if (this.estado === 'dialogo') {
      if (this.dialogo) this.dialogo.actualizar(dt);
      this.particulas.actualizar(dt);
      if (this.jefe && this.jefe.estado === 'dialogo') this.jefe.actualizar(dt);
      this.actualizarCamara(dt);
      this.prev = {};
      return;
    }
    if (Entrada.pulso('Escape', 'KeyP')) { this.pausar(); return; }
    const C = this.leerControles();
    const n = Math.max(1, Math.ceil(dt / (1 / 60) - 0.01));
    const sdt = dt / n;
    for (let i = 0; i < n; i++) {
      this.paso(sdt, C);
      C.saltoPulso = C.ataquePulso = C.especialPulso = C.cambioPulso = false;
      C.elegir = -1;
    }
  }

  paso(dt, C) {
    const p = this.jugador;
    if (this.estado === 'jugando') this.tiempo += dt;
    if (this.tiempoDetenido > 0) {
      this.tiempoDetenido -= dt;
      if (this.tiempoDetenido <= 0) { this.tiempoDetenido = 0; Sonido.efecto('reanudar'); }
    }
    this.sacT = Math.max(0, this.sacT - dt);
    if (this.sacT <= 0) this.sacF = 0;
    this.flashDano = Math.max(0, this.flashDano - dt);
    this.tCambio -= dt;
    for (const [k, v] of this.resortes) { if (v - dt <= 0) this.resortes.delete(k); else this.resortes.set(k, v - dt); }
    for (const m of this.equipo) m.energia = Math.min(m.energiaMax, m.energia + this.regen * dt);

    if (this.estado === 'jugando') {
      if (C.elegir >= 0) this.cambiarPersonaje(C.elegir);
      if (C.cambioPulso) this.cambiarPersonaje((this.activo + 1) % 4);
    }
    for (const pl of this.plataformas) pl.actualizar(dt);

    if (this.estado === 'jugando') {
      p.actualizar(dt, C);
      this.revisarLaser(p);
      if (p.y > this.altoPx + 30) this.jugadorCae(true);
    } else if (this.estado === 'muerto') {
      this.tMuerte += dt;
      if (!this.porCaida) { p.vy += GRAV * dt; p.y += p.vy * dt; }
      if (this.tMuerte > 1.5) {
        if (this.vidas < 0) {
          this.estado = 'gameover';
          Musica.parar();
          Sonido.efecto('derrota');
        } else this.reaparecer();
      }
    } else if (this.estado === 'elevador') {
      this.tElev += dt;
      const o = this.elevador;
      o.apertura = clamp(this.tElev / 0.5, 0, 1);
      if (this.tElev > 1.3) o.apertura = clamp(1 - (this.tElev - 1.3) / 0.5, 0, 1);
      const meta = o.x + 10;
      if (this.tElev > 0.4 && this.tElev < 1.2) { p.x += clamp(meta - p.x, -70 * dt, 70 * dt); p.vx = 1; }
      else p.vx = 0;
      if (this.tElev > 1.2) p.oculto = true;
      if (this.tElev > 2.1) this.completarNivel();
    } else if (this.estado === 'final') {
      this.tFinal += dt;
      p.vx = 0;
      if (this.tFinal > 2.2 && !this.dialogoFinal) {
        this.dialogoFinal = true;
        this.estado = 'dialogo';
        Musica.tocar('final');
        this.dialogo = new Dialogo(HISTORIA.final, () => this.terminarJuego());
      }
    }

    if (this.estado === 'jugando' || this.estado === 'muerto' || this.estado === 'final') {
      const congelado = this.tiempoDetenido > 0;
      for (const e of this.enemigos) {
        if (!e.vivo) continue;
        if (!congelado) e.actualizar(dt);
        else e.flash = Math.max(0, e.flash - dt);
        if (!congelado && e.vivo && this.estado === 'jugando' && choca(p, e)) p.herir(e.contacto, e.cx);
      }
      this.enemigos = this.enemigos.filter((e) => e.vivo);
      if (this.jefe && this.jefe.vivo) {
        this.jefe.actualizar(dt);
        const j = this.jefe;
        const inofensivo = ['muerte', 'entrada', 'dialogo', 'aturdido'].includes(j.estado);
        if (!congelado && this.estado === 'jugando' && j.activo && !inofensivo && choca(p, j)) p.herir(j.contacto, j.cx);
      }
      for (const b of this.proyectiles) b.actualizar(dt, this);
      this.proyectiles = this.proyectiles.filter((b) => b.vivo && b.x > -40 && b.x < this.anchoPx + 40 && b.y < this.altoPx + 60 && b.y > -200);
      for (const o of this.objetos) o.actualizar(dt);
      this.objetos = this.objetos.filter((o) => o.vivo);
      if (this.jefe && !this.peleaJefe && this.estado === 'jugando' && p.x > this.arena.x0 + 3 * TS) this.iniciarPelea();
    }
    this.particulas.actualizar(dt);
    this.actualizarCamara(dt);
  }

  actualizarCamara(dt) {
    const W = App.W, H = App.H, p = this.jugador;
    let minX = 0, maxX = Math.max(0, this.anchoPx - W);
    if (this.peleaJefe) { minX = this.arena.x0; maxX = Math.max(minX, this.arena.x1 - W); }
    let obj = p.cx - W / 2 + p.dir * W * 0.1;
    if (this.anchoPx < W) obj = (this.anchoPx - W) / 2;
    if (this.peleaJefe && this.arena.x1 - this.arena.x0 < W) { obj = (this.arena.x0 + this.arena.x1 - W) / 2; minX = maxX = obj; }
    this.camX += (obj - this.camX) * Math.min(1, dt * 5);
    if (this.anchoPx >= W) this.camX = clamp(this.camX, minX, maxX);
    const vista = H - this.reserva();
    if (this.altoPx <= vista) this.camY = this.altoPx - vista;
    else {
      const objY = clamp(p.cy - vista * 0.55, 0, this.altoPx - vista);
      this.camY += (objY - this.camY) * Math.min(1, dt * 5);
    }
  }

  actualizarFondo(dt) {
    const tm = this.fondo.tema;
    if (tm.interior) return;
    if (Math.random() < dt * 0.35) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.autos.push({ x: dir > 0 ? -20 : App.W + 20, y: rnd(0.25, 0.6), v: dir * rnd(25, 60), c: elegir(tm.neones) });
    }
    for (const a of this.autos) a.x += a.v * dt;
    this.autos = this.autos.filter((a) => a.x > -40 && a.x < App.W + 40);
    if (Math.random() < dt * 3 && this.fondo.ventilas.length) {
      const v = elegir(this.fondo.ventilas);
      this.vapor.push({ x: v.x + rnd(-2, 2), y: v.y, vida: 2.2, r: 2 });
    }
    for (const v of this.vapor) { v.vida -= dt; v.y -= 9 * dt; v.x += 3 * dt; v.r += 2.2 * dt; }
    this.vapor = this.vapor.filter((v) => v.vida > 0);
    if (tm.lluvia) {
      while (this.gotas.length < 70) this.gotas.push({ x: rnd(0, App.W + 60), y: rnd(-App.H, 0), v: rnd(260, 360) });
      for (const g of this.gotas) { g.y += g.v * dt; g.x -= g.v * 0.25 * dt; if (g.y > App.H) { g.y = rnd(-40, 0); g.x = rnd(0, App.W + 60); } }
      this.rayo = Math.max(0, this.rayo - dt);
      if (Math.random() < dt * 0.08) this.rayo = 0.25;
    }
  }

  /* ---------------------------- dibujo ------------------------------ */
  dibujar(g) {
    const W = App.W, H = App.H;
    const sx = this.sacF ? rnd(-this.sacF, this.sacF) : 0, sy = this.sacF ? rnd(-this.sacF, this.sacF) : 0;
    const cx = Math.round(this.camX + sx), cy = Math.round(this.camY + sy);
    this.dibujarFondo(g, cx, cy);
    this.dibujarCasillas(g, cx, cy);
    for (const o of this.objetos) if (o.x + o.w > cx - 40 && o.x < cx + W + 40) o.dibujar(g, cx, cy);
    for (const pl of this.plataformas) pl.dibujar(g, cx, cy);
    for (const e of this.enemigos) if (e.x + e.w > cx - 40 && e.x < cx + W + 40) e.dibujar(g, cx, cy);
    if (this.jefe) this.jefe.dibujar(g, cx, cy);
    this.jugador.dibujar(g, cx, cy);
    for (const b of this.proyectiles) b.dibujar(g, cx, cy);
    this.particulas.dibujar(g, cx, cy);

    if (this.tiempoDetenido > 0) {
      g.fillStyle = 'rgba(90,150,255,0.16)';
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 0.12;
      for (let y = (this.t * 20) % 4; y < H; y += 4) rect(g, 0, y, W, 1, '#c0e0ff');
      g.globalAlpha = 1;
    }
    if (this.flashDano > 0) {
      g.globalAlpha = this.flashDano * 1.2;
      g.strokeStyle = '#ff2050';
      g.lineWidth = 6;
      g.strokeRect(0, 0, W, H);
      g.lineWidth = 1;
      g.globalAlpha = 1;
    }
    if (this.estado === 'elevador' && this.tElev > 1.6) {
      g.fillStyle = `rgba(0,0,0,${clamp((this.tElev - 1.6) / 0.5, 0, 1)})`;
      g.fillRect(0, 0, W, H);
    }

    this.dibujarHUD(g);
    if (this.estado === 'jugando' || this.estado === 'muerto') this.dibujarControles(g);
    if (this.dialogo && this.dialogo.activo && this.estado === 'dialogo') this.dialogo.dibujar(g, W, H);
    if (this.estado === 'pausa') this.dibujarPausa(g);
    if (this.estado === 'gameover') this.dibujarGameOver(g);
    if (this.estado === 'resultado') this.dibujarResultado(g);
  }

  capa(g, img, despl, base) {
    const y = Math.round(base - img.height);
    let x = -Math.floor(despl % img.width);
    if (x > 0) x -= img.width;
    for (; x < App.W; x += img.width) g.drawImage(img, x, y);
  }

  dibujarFondo(g, cx, cy) {
    const W = App.W, H = App.H;
    const F = this.fondo, tm = F.tema;
    const hz = this.altoPx - cy;
    const gr = g.createLinearGradient(0, 0, 0, hz);
    tm.cielo.forEach((c, i) => gr.addColorStop(i / (tm.cielo.length - 1), c));
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);

    if (tm.interior) {
      const p = F.pared;
      const ox = -Math.floor((cx * 0.3) % p.width), oy = -Math.floor((cy * 0.3) % p.height) - p.height;
      for (let y = oy; y < H; y += p.height) for (let x = ox - p.width; x < W; x += p.width) g.drawImage(p, x, y);
      // gran reloj del núcleo
      const rx = Math.round(W / 2 - (cx - (this.arena ? this.arena.x0 : 0)) * 0.15 + 60), ry = Math.round(hz - 170);
      g.globalAlpha = 0.5;
      circulo(g, rx, ry, 58, '#3a2c60'); circulo(g, rx, ry, 52, '#1b1432'); circulo(g, rx, ry, 48, '#241a40');
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; rect(g, rx + Math.cos(a) * 42 - 1, ry + Math.sin(a) * 42 - 1, 3, 3, '#a46bff'); }
      brocha(g, rx, ry, rx + Math.cos(this.t) * 38, ry + Math.sin(this.t) * 38, 2, '#c86bff');
      brocha(g, rx, ry, rx + Math.cos(this.t / 12) * 26, ry + Math.sin(this.t / 12) * 26, 3, '#ff3fbf');
      g.globalAlpha = 1;
      // engranes
      for (const [gx, gy, r, s] of [[30, hz - 60, 26, 1], [W - 40, hz - 210, 34, -0.7], [W - 10, hz - 40, 18, 1.4]]) {
        g.globalAlpha = 0.35;
        circulo(g, gx, gy, r, '#3a2c60');
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + this.t * s; rect(g, gx + Math.cos(a) * (r + 2) - 2, gy + Math.sin(a) * (r + 2) - 2, 5, 5, '#3a2c60'); }
        circulo(g, gx, gy, r * 0.4, '#140f26');
        g.globalAlpha = 1;
      }
      const alarma = this.peleaJefe && Math.floor(this.t * 2) % 2 && this.jefe && this.jefe.vivo;
      if (alarma) { g.fillStyle = 'rgba(255,40,80,0.08)'; g.fillRect(0, 0, W, H); }
    } else {
      for (const s of this.estrellas) {
        const x = Math.round((s.x - cx * 0.02) % 600);
        const y = Math.round(s.y - (this.altoPx - hz) * 0);
        if (y > hz - 120 || x < 0 || x > W) continue;
        g.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(this.t * 1.3 + s.f));
        px(g, x, y, s.c);
      }
      g.globalAlpha = 1;
      if (tm.luna) {
        const mx = Math.round(W * 0.8 - cx * 0.01), my = Math.max(16, Math.round(hz - 400));
        g.globalAlpha = 0.18; circulo(g, mx, my, 22, '#bff8ff'); g.globalAlpha = 1;
        circulo(g, mx, my, 15, '#cfeff0');
        circulo(g, mx - 4, my - 3, 3, '#a8d4d8'); circulo(g, mx + 5, my + 4, 2, '#a8d4d8'); circulo(g, mx + 2, my - 7, 1, '#a8d4d8'); circulo(g, mx - 6, my + 6, 2, '#b8e0e2');
      }
      if (this.rayo > 0) { g.fillStyle = `rgba(200,220,255,${this.rayo})`; g.fillRect(0, 0, W, H); }
      this.capa(g, F.lejos, cx * 0.08, hz + 20);
      const niebla = g.createLinearGradient(0, hz - 260, 0, hz);
      niebla.addColorStop(0, hexA(tm.niebla, 0));
      niebla.addColorStop(1, hexA(tm.niebla, 0.25));
      g.fillStyle = niebla;
      g.fillRect(0, hz - 260, W, 260);
      for (const a of this.autos) {
        const ay = Math.round(hz - 340 + a.y * 200), ax = Math.round(a.x);
        rect(g, ax, ay, 12, 3, '#2a2f50'); rect(g, ax + 3, ay - 2, 6, 2, '#3a4070');
        px(g, a.v > 0 ? ax + 12 : ax - 1, ay + 1, '#fff1b8');
        g.globalAlpha = 0.5; rect(g, a.v > 0 ? ax - 8 : ax + 12, ay + 1, 8, 1, a.c); g.globalAlpha = 1;
      }
      this.capa(g, F.medio, cx * 0.2, hz + 40);
      this.capa(g, F.cerca, cx * 0.42, hz + 60);
      const ox = -Math.floor((cx * 0.42) % F.cerca.width);
      for (const v of this.vapor) {
        g.globalAlpha = clamp(v.vida / 2.2, 0, 1) * 0.35;
        for (const k of [-1, 0, 1]) {
          const x = Math.round(v.x + ox + k * F.cerca.width), y = Math.round(hz + 60 - F.cerca.height + v.y);
          if (x > -10 && x < W + 10) circulo(g, x, y, Math.round(v.r), '#c8c8e0');
        }
      }
      g.globalAlpha = 1;
    }

    // pilares que se pierden en el abismo
    const x0 = Math.floor(cx / TS) - 1, x1 = Math.floor((cx + W) / TS) + 1;
    for (let tx = x0; tx <= x1; tx++) {
      if (((tx % 7) + 7) % 7 !== 3 || !this.esMacizo(tx, this.alto - 1)) continue;
      const x = tx * TS - cx + 3;
      rect(g, x, hz, 10, H - hz, '#232a4c');
      rect(g, x, hz, 2, H - hz, '#3a4472');
      for (let y = hz + 12; y < H; y += 22) rect(g, x - 2, y, 14, 2, '#1b203d');
    }
    const ga = g.createLinearGradient(0, hz - 30, 0, H);
    ga.addColorStop(0, hexA(tm.abismo, 0));
    ga.addColorStop(0.3, hexA(tm.abismo, 0.75));
    ga.addColorStop(1, hexA(tm.abismo, 1));
    g.fillStyle = ga;
    g.fillRect(0, hz - 30, W, H - hz + 30);
    if (tm.lluvia) {
      g.strokeStyle = 'rgba(160,190,255,0.35)';
      g.beginPath();
      for (const d of this.gotas) { g.moveTo(d.x, d.y); g.lineTo(d.x - 2, d.y + 7); }
      g.stroke();
    }
  }

  dibujarCasillas(g, cx, cy) {
    const W = App.W, H = App.H, S = SPR.cas;
    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(this.ancho - 1, Math.floor((cx + W) / TS));
    for (let ty = 0; ty < this.alto; ty++) {
      const y = ty * TS - cy;
      if (y < -TS - 12 || y > H) continue;
      for (let tx = x0; tx <= x1; tx++) {
        const c = this.mapa[ty][tx];
        if (c === '.') continue;
        const x = tx * TS - cx;
        switch (c) {
          case '#': {
            const tope = !this.esMacizo(tx, ty - 1) && ty > 0;
            if (tope && ty >= 9 && this.esTope(tx - 1, ty) && this.esTope(tx + 1, ty)) g.drawImage(S.baranda, x, y - 12);
            g.drawImage(tope ? S.sueloTop : S.sueloIn, x, y);
            if (!this.esMacizo(tx - 1, ty)) rect(g, x, y, 1, TS, '#6a7ab0');
            if (!this.esMacizo(tx + 1, ty)) rect(g, x + TS - 1, y, 1, TS, '#11152b');
            if (!this.esMacizo(tx, ty + 1) && ty < this.alto - 1) rect(g, x, y + TS - 1, TS, 1, '#11152b');
            break;
          }
          case 'X': g.drawImage(S.agrietado, x, y); break;
          case '=': g.drawImage(S.baranda, x, y - 12); g.drawImage(S.plataforma, x, y); break;
          case '-': g.drawImage(S.viga, x, y); break;
          case 'J': g.drawImage(this.resortes.has(tx + ',' + ty) ? S.resorteC : S.resorte, x, y); break;
          case 'H':
            if (this.holoActivo) {
              g.globalAlpha = 0.55 + 0.2 * Math.sin(this.t * 6 + tx);
              rect(g, x, y, TS, 6, '#3ff3ff');
              rect(g, x, y, TS, 1, '#e8ffff');
              g.globalAlpha = 0.3;
              rect(g, x, y + 7, TS, 1, '#3ff3ff');
              rect(g, x, y + 10, TS, 1, '#3ff3ff');
              g.globalAlpha = 1;
              if ((tx + Math.floor(this.t * 4)) % 5 === 0) px(g, x + 8, y + 2, '#ffffff');
            } else {
              g.globalAlpha = 0.3 + 0.1 * Math.sin(this.t * 3);
              for (let i = 0; i < TS; i += 3) { px(g, x + i, y, '#3ff3ff'); px(g, x + i + 1, y + 5, '#3ff3ff'); }
              g.globalAlpha = 1;
            }
            break;
          case 'L': {
            if (this.cas(tx, ty - 1) !== 'L') g.drawImage(SPR.emisor, x, y - 1);
            if (this.tiempoDetenido <= 0) {
              const a = 0.7 + 0.3 * Math.random();
              g.globalAlpha = 0.25; rect(g, x + 3, y, 10, TS, '#ff3f6b');
              g.globalAlpha = a; rect(g, x + 6, y, 4, TS, '#ff3f6b'); rect(g, x + 7, y, 2, TS, '#ffe0ea');
              g.globalAlpha = 1;
            } else {
              g.globalAlpha = 0.35;
              for (let i = 0; i < TS; i += 4) rect(g, x + 7, y + i, 2, 2, '#7fc8ff');
              g.globalAlpha = 1;
            }
            if (this.cas(tx, ty + 1) !== 'L') rect(g, x + 4, y + TS - 3, 8, 3, '#4a5080');
            break;
          }
          case 'G':
            if (this.compuerta) {
              g.globalAlpha = 0.6 + 0.3 * Math.sin(this.t * 8);
              for (let i = 2; i < TS; i += 5) rect(g, x + i, y, 2, TS, '#c86bff');
              g.globalAlpha = 1;
            }
            break;
        }
      }
    }
  }

  /* ---------------------------- HUD -------------------------------- */
  dibujarHUD(g) {
    const W = App.W, H = App.H;
    const jugable = this.estado === 'jugando';
    // retratos de la familia (como en la imagen del juego)
    for (let i = 0; i < 4; i++) {
      const d = PERSONAJES[i], m = this.equipo[i];
      const y = 4 + i * 23, act = i === this.activo;
      rect(g, 2, y - 2, 86, 22, act ? 'rgba(20,16,48,0.85)' : 'rgba(10,8,24,0.6)');
      rect(g, 3, y - 1, 22, 22, act ? d.color : '#3a3555');
      rect(g, 4, y, 20, 20, '#0a0814');
      dibujarSuave(g, IMG['cara_' + d.id], 0, 0, 96, 96, 4, y, 20, 20);
      if (!act) { g.globalAlpha = 0.45; rect(g, 4, y, 20, 20, '#0a0814'); g.globalAlpha = 1; }
      UI.icono(g, 'corazon', 28, y + 1, '#ff4d6d');
      UI.barra(g, 37, y + 1, 46, 7, m.vida / m.vidaMax, '#ff3f5f');
      UI.icono(g, 'gota', 28, y + 10, '#4fb8ff');
      const lista = m.energia >= Math.round(d.costo * this.factorCosto);
      UI.barra(g, 37, y + 11, 46, 6, m.energia / m.energiaMax, lista ? '#b07aff' : '#6a46b0');
      if (lista && act && Math.floor(this.t * 3) % 2) px(g, 84, y + 13, '#ffffff');
      if (jugable && Entrada.tocado({ x: 0, y: y - 3, w: 90, h: 23 })) this.cambiarPersonaje(i);
    }
    const d = PERSONAJES[this.activo];
    texto(g, d.nombre + ' · ' + d.poder, 4, 4 + 4 * 23 + 1, d.color, { fuente: 'mini', borde: '#0a0814' });

    // pausa, chips, fotos y vidas
    const pr = { x: W - 26, y: 3, w: 23, h: 21 };
    UI.marco(g, pr.x, pr.y, pr.w, pr.h, COL.cian);
    UI.icono(g, 'pausa', pr.x + 9, pr.y + 8, COL.cian);
    if (jugable && Entrada.tocado({ x: pr.x - 6, y: 0, w: pr.w + 10, h: pr.h + 8 })) this.pausar();
    const total = Guardado.datos.chips + this.chips;
    UI.icono(g, 'chip', W - 66, 6, COL.amarillo);
    texto(g, String(total).padStart(4, '0'), W - 30, 6, COL.amarillo, { alin: 'der', borde: '#0a0814' });
    UI.icono(g, 'foto', W - 66, 17, '#fff1b8');
    texto(g, this.cuentaFotos() + '/3', W - 30, 17, '#fff1b8', { alin: 'der', borde: '#0a0814' });
    for (let i = 0; i < Math.max(0, this.vidas); i++) UI.icono(g, 'corazon', W - 37 - i * 9, 28, '#ff4d6d');
    if (this.vidas > 0) texto(g, 'x' + this.vidas, W - 4, 28, '#ff8aa0', { fuente: 'mini', alin: 'der' });

    // reloj del Crono-Ataque
    if (this.tiempoDetenido > 0) {
      const bx = Math.round(W / 2 - 34);
      UI.icono(g, 'reloj', bx - 8, 40, COL.verde);
      UI.barra(g, bx, 40, 68, 5, this.tiempoDetenido / 4, COL.verde);
    }
    // barra del jefe
    if (this.jefe && this.peleaJefe && this.jefe.vivo) {
      const bw = Math.min(160, W - 130), bx = Math.round((W - bw) / 2 + 20), by = H - this.reserva() - 18 > 120 ? 48 : 34;
      texto(g, 'DR. CRONOS · CRONOTRÓN', bx, by, '#c86bff', { fuente: 'mini', borde: '#0a0814' });
      UI.barra(g, bx, by + 7, bw, 6, this.jefe.vida / this.jefe.vidaMax, '#ff3fbf');
    }
    this.dibujarMensajes(g);
  }

  zonaMensajes() {
    const W = App.W, H = App.H;
    const vertical = H >= W * 1.25;
    const levelTop = this.altoPx <= H - this.reserva() ? H - this.reserva() - this.altoPx : 0;
    if (vertical) return { x: 8, y: Math.max(112, Math.min(levelTop - 46, 130)), w: W - 16 };
    return { x: 96, y: 34, w: W - 130 };
  }

  dibujarMensajes(g) {
    const W = App.W;
    const Z = this.zonaMensajes();
    // misión activada (como el recuadro de la imagen)
    if (this.mision && this.estado !== 'dialogo') {
      const a = clamp(Math.min(this.mision.t * 3, (6 - this.mision.t) * 2), 0, 1);
      const mw = 150;
      const lineas = envolver(this.def.mision, mw - 10, 'mini');
      const mh = 16 + lineas.length * 8;
      const mx = W - mw - 4, my = 40;
      g.globalAlpha = a;
      UI.marco(g, mx, my, mw, mh, COL.cian, 'rgba(10,14,30,0.92)');
      texto(g, 'MISIÓN ACTIVADA:', mx + 6, my + 6, COL.crema, { fuente: 'mini' });
      lineas.forEach((l, i) => texto(g, l, mx + 6, my + 14 + i * 8, i === lineas.length - 1 && l.startsWith('(') ? COL.cian : COL.crema, { fuente: 'mini' }));
      g.globalAlpha = 1;
    }
    // pista del letrero cercano
    if (this.letreroActivo && this.estado === 'jugando') {
      const txt = this.def.pistas[this.letreroActivo.indice] || '';
      const lineas = envolver(txt, Z.w - 16);
      const h = 10 + lineas.length * 10;
      UI.marco(g, Z.x, Z.y, Z.w, h, COL.cian, 'rgba(8,24,40,0.94)');
      lineas.forEach((l, i) => texto(g, l, Z.x + 8, Z.y + 6 + i * 10, '#c8fbff'));
    }
    // avisos
    let ay = (this.letreroActivo ? Z.y + 50 : Z.y) + 4;
    for (const av of this.avisos) {
      g.globalAlpha = clamp(av.vida * 2, 0, 1);
      texto(g, av.t, W / 2, ay, av.color, { alin: 'centro', borde: '#0a0814' });
      g.globalAlpha = 1;
      ay += 12;
    }
  }

  dibujarControles(g) {
    const L = this.layoutControles();
    const C = this.C || {};
    const boton = (b, mant, etiqueta, frac = 1) => {
      g.globalAlpha = mant ? 0.95 : 0.55;
      circulo(g, b.x, b.y, b.r, b.color);
      circulo(g, b.x, b.y, b.r - 2, mant ? shade(b.color, -120) : 'rgba(10,8,30,1)');
      if (frac < 1) {
        g.globalAlpha = 0.4;
        circulo(g, b.x, b.y, b.r - 2, '#0a0814');
        g.globalAlpha = 0.8;
        g.strokeStyle = b.color; g.lineWidth = 2;
        g.beginPath(); g.arc(b.x, b.y, b.r - 4, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); g.stroke();
        g.lineWidth = 1;
      }
      g.globalAlpha = mant ? 1 : 0.8;
      texto(g, etiqueta, b.x + 1, b.y - 3, b.color, { alin: 'centro', esc: b.r > 18 ? 2 : 1 });
      g.globalAlpha = 1;
    };
    const izq = { ...L.izq, r: L.R, color: COL.cian }, der = { ...L.der, r: L.R, color: COL.cian };
    boton(izq, C.izq, '◀');
    boton(der, C.der, '▶');
    boton(L.A, C.saltoMant, 'A');
    boton(L.B, C.ataqueMant, 'B');
    const pj = this.equipo[this.activo];
    const costo = Math.round(PERSONAJES[this.activo].costo * this.factorCosto);
    boton(L.E, C.especialMant, '★', clamp(pj.energia / costo, 0, 1));
    boton(L.S, C.cambioMant, '⇄');
    g.globalAlpha = 0.7;
    texto(g, 'ESPECIAL', L.E.x, L.E.y - L.E.r - 8, COL.amarillo, { fuente: 'mini', alin: 'centro' });
    g.globalAlpha = 1;
  }

  /* ---------------------------- menús internos ---------------------- */
  oscurecer(g, a = 0.7) { g.fillStyle = `rgba(6,4,18,${a})`; g.fillRect(0, 0, App.W, App.H); }

  dibujarPausa(g) {
    const W = App.W, H = App.H;
    this.oscurecer(g);
    const pw = Math.min(220, W - 30), ph = 186, px0 = (W - pw) / 2, py0 = Math.max(10, (H - ph) / 2 - 20);
    UI.marco(g, px0, py0, pw, ph, COL.cian);
    textoNeon(g, 'PAUSA', W / 2, py0 + 14, { esc: 3, alin: 'centro' });
    texto(g, this.def.nombre, W / 2, py0 + 42, COL.gris, { alin: 'centro', fuente: 'mini' });
    const bw = pw - 40, bx = px0 + 20;
    let y = py0 + 54;
    const b = (et, color) => { const r = { x: bx, y, w: bw, h: 24 }; y += 30; return UI.boton(g, r, et, { color }); };
    if (b('CONTINUAR', COL.verde) || Entrada.pulso('Escape', 'KeyP')) { this.estado = 'jugando'; this.prev = {}; Sonido.efecto('aceptar'); }
    if (b('REINICIAR MISIÓN')) { Sonido.efecto('aceptar'); App.ir('juego', { nivel: this.nivelIdx }); }
    if (b('OPCIONES')) { Sonido.efecto('aceptar'); App.ir('opciones', { volver: this }); }
    if (b('SALIR AL MAPA', COL.magenta)) { Sonido.efecto('atras'); App.ir('mapa'); }
  }

  dibujarGameOver(g) {
    const W = App.W, H = App.H;
    this.oscurecer(g, 0.8);
    const cy = H * 0.3;
    textoNeon(g, '¡OH NO!', W / 2, cy, { esc: 4, alin: 'centro', c1: '#ffb0c0', c2: '#ff3f6b' });
    envolver('LA FAMILIA NECESITA RECUPERAR FUERZAS... ¡PERO NUNCA SE RINDE!', W - 40).forEach((l, i) => texto(g, l, W / 2, cy + 44 + i * 11, COL.crema, { alin: 'centro' }));
    const bw = Math.min(200, W - 40), bx = (W - bw) / 2;
    if (UI.boton(g, { x: bx, y: cy + 90, w: bw, h: 26 }, 'REINTENTAR', { color: COL.verde }) || Entrada.pulso('Enter', 'Space')) {
      Sonido.efecto('aceptar'); App.ir('juego', { nivel: this.nivelIdx });
    }
    if (UI.boton(g, { x: bx, y: cy + 124, w: bw, h: 26 }, 'MAPA DE MISIONES', { color: COL.magenta })) { Sonido.efecto('atras'); App.ir('mapa'); }
  }

  dibujarResultado(g) {
    const W = App.W, H = App.H, R = this.resultado;
    this.oscurecer(g, 0.75);
    const pw = Math.min(240, W - 20), ph = 230, x0 = (W - pw) / 2, y0 = Math.max(8, (H - ph) / 2 - 10);
    UI.marco(g, x0, y0, pw, ph, COL.amarillo);
    textoNeon(g, '¡MISIÓN', W / 2, y0 + 12, { esc: 2, alin: 'centro', c1: '#fff1b8', c2: '#ffa94d' });
    textoNeon(g, 'CUMPLIDA!', W / 2, y0 + 34, { esc: 2, alin: 'centro', c1: '#fff1b8', c2: '#ffa94d' });
    // fotos encontradas
    for (let i = 0; i < 3; i++) {
      const on = (this.fotos >> i) & 1;
      const fx = W / 2 - 30 + i * 22, fy = y0 + 58;
      const aparece = R.t > 0.5 + i * 0.3;
      if (on && aparece) g.drawImage(SPR.foto, fx, fy);
      else { g.globalAlpha = 0.3; g.drawImage(SPR.foto, fx, fy); g.globalAlpha = 1; }
    }
    const filas = [
      ['CHIPS', '◆ ' + R.chips + (R.bono ? ' +' + R.bono : '')],
      ['FOTOS', R.fotos + ' / 3'],
      ['ENEMIGOS', '' + R.enemigos],
      ['TIEMPO', formatoTiempo(R.tiempo) + (R.record ? ' ¡RÉCORD!' : '')],
    ];
    filas.forEach(([a, b], i) => {
      if (R.t < 0.3 + i * 0.15) return;
      texto(g, a, x0 + 16, y0 + 82 + i * 14, COL.gris);
      texto(g, b, x0 + pw - 16, y0 + 82 + i * 14, COL.crema, { alin: 'der' });
    });
    const bw = pw - 40, bx = x0 + 20;
    const ultimo = this.nivelIdx >= NIVELES.length - 1;
    if (R.t > 0.8) {
      if (!ultimo && (UI.boton(g, { x: bx, y: y0 + 146, w: bw, h: 24 }, 'SIGUIENTE MISIÓN ▶', { color: COL.verde, sel: true }) || Entrada.pulso('Enter', 'Space'))) {
        Sonido.efecto('aceptar'); App.ir('juego', { nivel: this.nivelIdx + 1 });
      }
      if (UI.boton(g, { x: bx, y: y0 + 174, w: bw, h: 22 }, 'REPETIR')) { Sonido.efecto('aceptar'); App.ir('juego', { nivel: this.nivelIdx }); }
      if (UI.boton(g, { x: bx, y: y0 + 200, w: bw, h: 22 }, 'MAPA', { color: COL.magenta })) { Sonido.efecto('atras'); App.ir('mapa'); }
    }
  }
}
