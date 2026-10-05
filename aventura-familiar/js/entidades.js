'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — entidades.js
   Jugador (la familia), enemigos de Chrono-Corp, el Dr. Cronos,
   proyectiles, objetos y partículas.
   ===================================================================== */

const GRAV = 1000;
const CAIDA_MAX = 430;

/* --------------------------- Partículas ------------------------------ */
class Particulas {
  constructor() { this.lista = []; }

  agregar(p) {
    if (this.lista.length > 500) this.lista.shift();
    p.max = p.vida;
    this.lista.push(p);
  }

  chispa(x, y, color, n = 6, vel = 80, vida = 0.4, grav = 200, tam = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = vel * (0.4 + Math.random() * 0.8);
      this.agregar({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - vel * 0.3, vida: vida * (0.6 + Math.random() * 0.6), color, grav, tam });
    }
  }

  polvo(x, y) {
    for (let i = 0; i < 4; i++) this.agregar({ x: x + rnd(-4, 4), y, vx: rnd(-30, 30), vy: rnd(-25, -5), vida: 0.35, color: '#8a8fb0', grav: 0, tam: 2 });
  }

  texto(x, y, s, color) { this.agregar({ x, y, vx: 0, vy: -28, vida: 1, color, grav: 0, texto: s }); }

  anillo(x, y, color, radio, vida = 0.45) { this.agregar({ x, y, vx: 0, vy: 0, vida, color, grav: 0, anillo: radio }); }

  imagen(x, y, img, vida = 0.25) { this.agregar({ x, y, vx: 0, vy: 0, vida, grav: 0, img }); }

  actualizar(dt) {
    const l = this.lista;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.vida -= dt;
      if (p.vida <= 0) { l[i] = l[l.length - 1]; l.pop(); continue; }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  dibujar(g, cx, cy) {
    for (const p of this.lista) {
      const a = clamp(p.vida / p.max, 0, 1);
      if (p.texto) { g.globalAlpha = Math.min(1, a * 2); texto(g, p.texto, p.x - cx, p.y - cy, p.color, { fuente: 'mini', alin: 'centro', borde: '#140f20' }); continue; }
      if (p.img) { g.globalAlpha = a * 0.5; g.drawImage(p.img, Math.round(p.x - cx), Math.round(p.y - cy)); continue; }
      if (p.anillo) {
        g.globalAlpha = a;
        g.strokeStyle = p.color;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(p.x - cx, p.y - cy, p.anillo * (1 - a * 0.85), 0, Math.PI * 2);
        g.stroke();
        g.lineWidth = 1;
        continue;
      }
      g.globalAlpha = a;
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.tam, p.tam);
    }
    g.globalAlpha = 1;
  }
}

/* --------------------------- Jugador --------------------------------- */
class Jugador {
  constructor(J, x, y) {
    this.J = J;
    this.w = 12; this.h = 28;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0; this.dir = 1;
    this.suelo = false; this.coyote = 0; this.bufSalto = 0; this.saltos = 0;
    this.cortable = true; this.planeando = false;
    this.tAtaque = 0; this.cdAtaque = 0; this.animAtaque = 0; this.animEspecial = 0;
    this.golpeados = new Set();
    this.inv = 0; this.tHerido = 0; this.tDash = 0; this.slam = false;
    this.tAnim = 0; this.plataforma = null; this.control = true; this.oculto = false;
    this.esJugador = true;
  }

  get def() { return PERSONAJES[this.J.activo]; }
  get pj() { return this.J.equipo[this.J.activo]; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  actualizar(dt, C) {
    const J = this.J, def = this.def;
    this.inv = Math.max(0, this.inv - dt);
    this.cdAtaque -= dt; this.tAtaque -= dt; this.tHerido -= dt;
    this.animAtaque -= dt; this.animEspecial -= dt;
    this.tAnim += dt;

    if (this.plataforma) {
      const pl = this.plataforma;
      this.x += pl.dx;
      if (this.x + this.w < pl.x || this.x > pl.x + pl.w) this.plataforma = null;
      else { this.y = pl.y - this.h; this.vy = 0; this.suelo = true; }
    }

    const ctrl = this.tHerido <= 0 && this.control;
    let mx = 0;
    if (ctrl) { if (C.izq) mx -= 1; if (C.der) mx += 1; }

    if (this.tDash > 0) {
      this.tDash -= dt;
      this.vx = this.dir * 340;
      this.vy = 0;
      J.golpearArea({ x: this.x - 4, y: this.y, w: this.w + 8, h: this.h }, 5, this.dir, this.golpeados);
      if (Math.random() < 0.6) {
        const s = SPR.pj[def.id].correr[Math.floor(this.tAnim * 14) % 4];
        J.particulas.imagen(this.x + this.w / 2 - 16, this.y + this.h - 40, this.dir > 0 ? s.d : s.i, 0.22);
      }
      if (this.tDash <= 0) this.vx = this.dir * def.vel;
    } else {
      const vel = def.vel;
      if (mx) this.dir = mx;
      const obj = mx * vel;
      const acel = this.suelo ? 1200 : 800;
      if (this.tHerido <= 0) {
        if (this.vx < obj) this.vx = Math.min(obj, this.vx + acel * dt);
        else if (this.vx > obj) this.vx = Math.max(obj, this.vx - acel * dt);
      }
      this.vy += GRAV * dt;
      this.planeando = false;
      if (def.planear && C.saltoMant && this.vy > 0 && !this.suelo && ctrl) {
        this.vy = Math.min(this.vy, 46);
        this.planeando = true;
        if (Math.random() < 0.3) J.particulas.agregar({ x: this.cx + rnd(-6, 6), y: this.y + this.h - 6, vx: 0, vy: 20, vida: 0.4, color: elegir(['#ffe066', '#ff8ad8', '#ffffff']), grav: 0, tam: 1 });
      }
      if (this.slam) this.vy = 560;
      this.vy = Math.min(this.vy, this.slam ? 560 : CAIDA_MAX);
    }

    // salto con margen (coyote) y memoria del botón
    if (C.saltoPulso && ctrl) this.bufSalto = 0.13; else this.bufSalto -= dt;
    if (this.suelo) { this.coyote = 0.1; this.saltos = 0; this.cortable = true; } else this.coyote -= dt;
    if (this.bufSalto > 0 && ctrl && this.tDash <= 0 && !this.slam) {
      if (this.coyote > 0) {
        this.vy = -def.salto; this.coyote = 0; this.bufSalto = 0; this.saltos = 1;
        this.suelo = false; this.plataforma = null; this.cortable = true;
        Sonido.efecto('salto');
        J.particulas.polvo(this.cx, this.y + this.h);
      } else if (def.dobleSalto && this.saltos < 2) {
        this.vy = -305; this.saltos = 2; this.bufSalto = 0; this.cortable = true;
        Sonido.efecto('doble');
        J.particulas.anillo(this.cx, this.y + this.h, '#3fd0ff', 12, 0.3);
      }
    }
    if (!C.saltoMant && this.cortable && this.vy < -150) this.vy = -150;

    J.mover(this, dt);
    if (this.suelo && !this.plataforma) J.revisarResorte(this);

    if (C.ataquePulso && ctrl && this.cdAtaque <= 0 && this.tDash <= 0) this.atacar();
    if (this.tAtaque > 0 && (def.id === 'joshua' || def.id === 'jacob')) this.golpeMelee();
    if (C.especialPulso && ctrl && this.tDash <= 0) this.especial();
    if (this.slam && this.suelo) { this.slam = false; J.explosionPozole(this); }
  }

  atacar() {
    const J = this.J, id = this.def.id;
    this.animAtaque = 0.22;
    this.golpeados.clear();
    if (id === 'joshua') { this.tAtaque = 0.16; this.cdAtaque = 0.36; Sonido.efecto('golpe'); }
    else if (id === 'jacob') { this.tAtaque = 0.12; this.cdAtaque = 0.22; Sonido.efecto('patada'); }
    else if (id === 'jazzlyn') {
      this.cdAtaque = 0.3;
      J.disparar({ x: this.dir > 0 ? this.x + this.w : this.x - 7, y: this.y + 8, vx: this.dir * 215, vy: 0, w: 7, h: 7, dano: 2, tipo: 'estrella', duenio: 'jugador', vida: 0.95, buscar: true });
      Sonido.efecto('estrella');
    } else {
      this.cdAtaque = 0.24;
      J.disparar({ x: this.dir > 0 ? this.x + this.w + 2 : this.x - 10, y: this.y + 13, vx: this.dir * 330, vy: 0, w: 8, h: 3, dano: 2, tipo: 'bala', duenio: 'jugador', vida: 0.75 });
      Sonido.efecto('disparo');
    }
  }

  golpeMelee() {
    const joshua = this.def.id === 'joshua';
    const alc = joshua ? 20 : 19;
    const r = { x: this.dir > 0 ? this.x + this.w - 3 : this.x - alc + 3, y: this.y + 2, w: alc, h: 24 };
    const n = this.J.golpearArea(r, joshua ? 3 : 2, this.dir, this.golpeados, joshua);
    if (n && joshua) this.J.sacudir(0.08, 2);
  }

  especial() {
    const J = this.J, def = this.def, pj = this.pj;
    const costo = Math.round(def.costo * J.factorCosto);
    if (pj.energia < costo) {
      if (!this.avisoEnergia || this.avisoEnergia < J.t) { J.aviso('¡SIN ENERGÍA!', COL.morado); Sonido.efecto('error'); this.avisoEnergia = J.t + 0.8; }
      return;
    }
    if (def.id === 'randy' && J.tiempoDetenido > 0) return;
    pj.energia -= costo;
    this.animEspecial = 0.35;
    if (def.id === 'joshua') {
      if (this.suelo) J.explosionPozole(this);
      else { this.slam = true; this.vx = 0; }
    } else if (def.id === 'jacob') {
      this.tDash = 0.3; this.inv = Math.max(this.inv, 0.4); this.golpeados.clear();
      Sonido.efecto('sigilo');
    } else if (def.id === 'jazzlyn') J.luzDeDeseo(this);
    else J.cronoAtaque(this);
  }

  herir(dano, desdeX) {
    const J = this.J;
    if (this.inv > 0 || this.tDash > 0 || J.estado !== 'jugando') return false;
    const pj = this.pj;
    pj.vida -= dano;
    this.inv = 1.1; this.tHerido = 0.3; this.slam = false;
    this.vx = (this.cx < desdeX ? -1 : 1) * 150; this.vy = -220;
    this.suelo = false; this.plataforma = null;
    Sonido.efecto('dano'); vibrar(70);
    J.sacudir(0.2, 3);
    J.particulas.chispa(this.cx, this.cy, '#ff4d6d', 8, 90);
    J.flashDano = 0.25;
    if (pj.vida <= 0) { pj.vida = 0; J.jugadorCae(); }
    return true;
  }

  animacion() {
    if (this.tHerido > 0) return ['herido', 0];
    if (this.animEspecial > 0 || this.slam) return ['especial', 0];
    if (this.animAtaque > 0) return ['atacar', this.animAtaque > 0.17 ? 0 : 1];
    if (this.tDash > 0) return ['correr', Math.floor(this.tAnim * 16) % 4];
    if (!this.suelo) return this.planeando ? ['planear', 0] : this.vy < 0 ? ['saltar', 0] : ['caer', 0];
    if (Math.abs(this.vx) > 12) return ['correr', Math.floor(this.tAnim * (6 + Math.abs(this.vx) / 18)) % 4];
    return ['quieto', Math.floor(this.tAnim * 2) % 2];
  }

  dibujar(g, cx, cy) {
    if (this.oculto) return;
    if (this.inv > 0 && this.tHerido <= 0 && this.tDash <= 0 && Math.floor(this.inv * 18) % 2 === 0) return;
    const [an, fr] = this.J.victoria ? ['victoria', 0] : this.animacion();
    const s = SPR.pj[this.def.id][an][fr];
    const img = this.dir > 0 ? s.d : s.i;
    const dx = Math.round(this.x + this.w / 2 - 16 - cx), dy = Math.round(this.y + this.h - 40 - cy);
    if (this.tDash > 0) g.globalAlpha = 0.55;
    g.drawImage(this.tHerido > 0.2 ? sprBlanco(img) : img, dx, dy);
    g.globalAlpha = 1;
    // destello del golpe
    if (this.animAtaque > 0.05 && this.animAtaque < 0.18) {
      const id = this.def.id;
      const fx = this.dir > 0 ? dx + 28 : dx + 4, fy = dy + 22;
      if (id === 'joshua') {
        g.globalAlpha = 0.8;
        circulo(g, fx, fy, 4, '#ffa94d'); circulo(g, fx, fy, 2, '#fff1b8');
        g.globalAlpha = 1;
      } else if (id === 'jacob') {
        rect(g, fx - 4, fy + 4, 8, 1, '#9ff4ff'); rect(g, fx - 2, fy + 6, 6, 1, '#9ff4ff');
      }
    }
  }
}

/* --------------------------- Enemigos -------------------------------- */
class Enemigo {
  constructor(J, x, y, w, h, vida) {
    this.J = J;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.vida = vida; this.vidaMax = vida;
    this.vivo = true; this.flash = 0; this.dir = -1;
    this.t = Math.random() * 10; this.contacto = 15;
    this.x0 = x; this.y0 = y;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  herir(dano, dir) {
    if (!this.vivo) return;
    this.vida -= dano;
    this.flash = 0.12;
    this.vx += dir * 50;
    this.J.particulas.chispa(this.cx, this.cy, '#ffe066', 5, 70);
    this.J.particulas.texto(this.cx, this.y - 2, '' + dano, '#fff1b8');
    Sonido.efecto('impacto');
    if (this.vida <= 0) this.morir();
  }

  morir() {
    this.vivo = false;
    this.J.explosion(this.cx, this.cy, false);
    this.J.soltarBotin(this);
    this.J.stats.enemigos++;
  }

  pasoBase(dt) { this.flash = Math.max(0, this.flash - dt); }

  dibujarSpr(g, img, cx, cy, ox = 0, oy = 0) {
    const x = Math.round(this.x + ox - cx), y = Math.round(this.y + oy - cy);
    let im = img;
    if (this.flash > 0) im = sprBlanco(img);
    g.drawImage(im, x, y);
    if (this.J.tiempoDetenido > 0) {
      g.globalAlpha = 0.45;
      g.drawImage(congelado(img), x, y);
      g.globalAlpha = 1;
    }
  }
}

const cacheHielo = new Map();
function congelado(img) {
  let c = cacheHielo.get(img);
  if (!c) { c = tenir(img, '#7fc8ff', 1); cacheHielo.set(img, c); }
  return c;
}

class Dron extends Enemigo {
  constructor(J, x, y) {
    super(J, x + 1, y + 2, 16, 12, 3);
    this.estado = 'patrulla';
    this.espera = 0;
    this.contacto = 15;
  }

  actualizar(dt) {
    this.pasoBase(dt);
    const p = this.J.jugador;
    this.t += dt;
    this.espera -= dt;
    if (this.estado === 'patrulla') {
      const nx = this.x0 + Math.sin(this.t * 0.8) * 28;
      this.dir = nx > this.x ? 1 : -1;
      this.x = nx;
      this.y = this.y0 + Math.sin(this.t * 2.3) * 5;
      if (this.espera <= 0 && Math.abs(p.cx - this.cx) < 92 && p.cy > this.cy - 16 && Math.abs(p.cy - this.cy) < 110) {
        this.estado = 'ataque'; this.tEst = 1.3;
      }
    } else if (this.estado === 'ataque') {
      this.tEst -= dt;
      const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1;
      this.x += (dx / d) * 78 * dt; this.y += (dy / d) * 78 * dt;
      this.dir = dx > 0 ? 1 : -1;
      if (this.tEst <= 0) this.estado = 'regreso';
    } else {
      const dx = this.x0 - this.x, dy = this.y0 - this.y, d = Math.hypot(dx, dy);
      if (d < 3) { this.estado = 'patrulla'; this.espera = 1.6; this.t = 0; }
      else { this.x += (dx / d) * 60 * dt; this.y += (dy / d) * 60 * dt; this.dir = dx > 0 ? 1 : -1; }
    }
  }

  dibujar(g, cx, cy) {
    const s = SPR.dron[Math.floor(this.J.t * 14) % 2];
    this.dibujarSpr(g, this.dir > 0 ? s.i : s.d, cx, cy, -5, -3);
  }
}

class Robot extends Enemigo {
  constructor(J, x, y) {
    super(J, x + 1, y - 10, 16, 26, 5);
    this.contacto = 20;
  }

  actualizar(dt) {
    this.pasoBase(dt);
    const J = this.J, p = J.jugador;
    this.t += dt;
    const cerca = Math.abs(p.cx - this.cx) < 90 && Math.abs(p.cy - this.cy) < 30;
    if (cerca) this.dir = p.cx > this.cx ? 1 : -1;
    const vel = cerca ? 58 : 30;
    this.vx = lerp(this.vx, this.dir * vel, Math.min(1, dt * 6));
    this.vy = Math.min(this.vy + GRAV * dt, CAIDA_MAX);
    J.mover(this, dt);
    if (this.chocoPared) this.dir = -this.chocoPared;
    if (this.suelo && !cerca) {
      const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!J.apoyoEn(fx, this.y + this.h + 2)) this.dir *= -1;
    }
    if (this.y > J.altoPx + 60) this.vivo = false;
  }

  dibujar(g, cx, cy) {
    const s = SPR.robot[Math.floor(this.t * 5) % 2];
    this.dibujarSpr(g, this.dir > 0 ? s.d : s.i, cx, cy, -5, -2);
  }
}

class Torreta extends Enemigo {
  constructor(J, x, y) {
    super(J, x - 2, y + 4, 20, 12, 4);
    this.contacto = 10;
    this.cd = 1.5 + Math.random();
    this.ang = Math.PI;
  }

  actualizar(dt) {
    this.pasoBase(dt);
    const p = this.J.jugador;
    const dx = p.cx - this.cx, dy = p.cy - (this.y + 4);
    const d = Math.hypot(dx, dy);
    this.ang = Math.atan2(dy, dx);
    if (dy > 10) this.ang = dx > 0 ? 0 : Math.PI;
    this.cd -= dt;
    if (d < 175 && this.cd <= 0) {
      this.cd = 2.2;
      const v = 115;
      this.J.disparar({ x: this.cx + Math.cos(this.ang) * 9 - 3, y: this.y + 4 + Math.sin(this.ang) * 9 - 3, vx: Math.cos(this.ang) * v, vy: Math.sin(this.ang) * v, w: 6, h: 6, dano: 15, tipo: 'orbe', duenio: 'enemigo', vida: 3 });
      Sonido.efecto('disparoEnemigo');
    }
  }

  dibujar(g, cx, cy) {
    const bx = Math.round(this.cx - cx), by = Math.round(this.y + 4 - cy);
    brocha(g, bx, by, bx + Math.round(Math.cos(this.ang) * 10), by + Math.round(Math.sin(this.ang) * 10), 3, '#140f20');
    brocha(g, bx, by, bx + Math.round(Math.cos(this.ang) * 9), by + Math.round(Math.sin(this.ang) * 9), 1, '#9aa8d8');
    this.dibujarSpr(g, SPR.torreta, cx, cy, 0, -4);
    if (this.cd < 0.4 && Math.floor(this.J.t * 20) % 2) circulo(g, bx, by + 1, 2, '#ff3f6b');
  }
}

class Agente extends Enemigo {
  constructor(J, x, y) {
    super(J, x + 2, y - 12, 12, 28, 6);
    this.contacto = 18;
    this.cd = 1;
    this.tDisparo = 0;
  }

  actualizar(dt) {
    this.pasoBase(dt);
    const J = this.J, p = J.jugador;
    this.t += dt; this.cd -= dt; this.tDisparo -= dt;
    const ve = Math.abs(p.cx - this.cx) < 150 && Math.abs(p.cy - this.cy) < 36;
    if (ve) {
      this.dir = p.cx > this.cx ? 1 : -1;
      this.vx = lerp(this.vx, 0, Math.min(1, dt * 8));
      if (this.cd <= 0) {
        this.cd = 1.6; this.tDisparo = 0.25;
        J.disparar({ x: this.dir > 0 ? this.x + this.w + 2 : this.x - 8, y: this.y + 12, vx: this.dir * 150, vy: 0, w: 7, h: 3, dano: 15, tipo: 'rayo', duenio: 'enemigo', vida: 2 });
        Sonido.efecto('disparoEnemigo');
      }
    } else {
      this.vx = lerp(this.vx, this.dir * 28, Math.min(1, dt * 6));
    }
    this.vy = Math.min(this.vy + GRAV * dt, CAIDA_MAX);
    J.mover(this, dt);
    if (this.chocoPared) this.dir = -this.chocoPared;
    if (this.suelo && !ve) {
      const fx = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!J.apoyoEn(fx, this.y + this.h + 2)) this.dir *= -1;
    }
    if (this.y > J.altoPx + 60) this.vivo = false;
  }

  dibujar(g, cx, cy) {
    const A = SPR.pj.agente;
    let s;
    if (this.tDisparo > 0) s = A.atacar[1];
    else if (Math.abs(this.vx) > 8) s = A.correr[Math.floor(this.t * 8) % 4];
    else s = A.quieto[Math.floor(this.t * 2) % 2];
    this.dibujarSpr(g, this.dir > 0 ? s.d : s.i, cx, cy, -10, -12);
  }
}

/* --------------------------- Jefe: Dr. Cronos ------------------------ */
class Jefe {
  constructor(J, x0, x1, suelo) {
    this.J = J;
    this.x0 = x0; this.x1 = x1; this.suelo = suelo;
    this.w = 52; this.h = 60;
    this.x = (x0 + x1) / 2 - this.w / 2;
    this.y = -90;
    this.vidaMax = 100; this.vida = 100;
    this.estado = 'espera'; this.tEst = 0; this.t = 0;
    this.flash = 0; this.vivo = true; this.activo = false;
    this.fase = 1; this.cdDisparo = 1.5; this.ciclo = 0;
    this.objX = this.x; this.contacto = 25; this.esJefe = true;
    this.vx = 0; this.vy = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2 + 6; }
  get yFlotar() { return this.suelo - 122 + Math.sin(this.t * 1.7) * 10; }

  iniciar() { this.estado = 'entrada'; this.tEst = 0; this.activo = true; }

  herir(dano, dir) {
    if (!this.vivo || this.estado === 'espera' || this.estado === 'entrada' || this.estado === 'muerte') return;
    const d = this.estado === 'aturdido' ? Math.round(dano * 1.5) : dano;
    this.vida -= d;
    this.flash = 0.1;
    this.J.particulas.chispa(this.cx + rnd(-10, 10), this.cy + rnd(-10, 10), '#ffe066', 5, 80);
    this.J.particulas.texto(this.cx + rnd(-8, 8), this.y, '' + d, '#fff1b8');
    Sonido.efecto('impacto');
    const f = this.vida / this.vidaMax;
    const nueva = f < 0.3 ? 3 : f < 0.62 ? 2 : 1;
    if (nueva !== this.fase) {
      this.fase = nueva;
      this.J.aviso(nueva === 2 ? '¡EL DR. CRONOS SE ENFURECE!' : '¡DISTORSIÓN TEMPORAL!', COL.magenta);
      Sonido.efecto('jefe');
      this.J.sacudir(0.4, 4);
    }
    if (this.vida <= 0) {
      this.vida = 0;
      this.estado = 'muerte'; this.tEst = 0;
      this.J.jefeVencido();
    }
  }

  cambiar(e) { this.estado = e; this.tEst = 0; }

  siguiente() {
    const patrones = {
      1: ['abanico', 'drones', 'abanico', 'golpe'],
      2: ['abanico', 'embestida', 'golpe', 'anillo', 'drones'],
      3: ['anillo', 'embestida', 'golpe', 'abanico', 'anillo', 'golpe'],
    }[this.fase];
    const p = patrones[this.ciclo % patrones.length];
    this.ciclo++;
    if (p === 'abanico') this.cambiar('flotar');
    else this.cambiar(p);
  }

  disparo(ang, v = 120) {
    this.J.disparar({ x: this.cx - 3, y: this.cy - 3, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, w: 6, h: 6, dano: 15, tipo: 'orbe', duenio: 'enemigo', vida: 4.5 });
  }

  actualizar(dt) {
    const J = this.J, p = J.jugador;
    this.flash = Math.max(0, this.flash - dt);
    if (J.tiempoDetenido > 0 && this.estado !== 'muerte') return;
    this.t += dt; this.tEst += dt;
    const izq = this.x0 + 8, der = this.x1 - this.w - 8;
    switch (this.estado) {
      case 'espera': break;
      case 'entrada':
        this.y = lerp(-90, this.yFlotar, Math.min(1, this.tEst / 2));
        if (this.tEst > 2.2) { this.cambiar('dialogo'); J.dialogoJefe(); }
        break;
      case 'dialogo': this.y = this.yFlotar; break;
      case 'flotar': {
        if (this.tEst < 0.05) this.objX = clamp(p.cx - this.w / 2 + rnd(-60, 60), izq, der);
        this.x = lerp(this.x, this.objX, Math.min(1, dt * 1.6));
        if (Math.abs(this.x - this.objX) < 6) this.objX = clamp(p.cx - this.w / 2 + rnd(-80, 80), izq, der);
        this.y = lerp(this.y, this.yFlotar, Math.min(1, dt * 3));
        this.cdDisparo -= dt;
        if (this.cdDisparo <= 0) {
          this.cdDisparo = [0, 1.4, 1.1, 0.85][this.fase];
          const a = Math.atan2(p.cy - this.cy, p.cx - this.cx);
          const n = [0, 3, 5, 5][this.fase];
          for (let i = 0; i < n; i++) this.disparo(a + (i - (n - 1) / 2) * 0.24);
          Sonido.efecto('disparoEnemigo');
        }
        if (this.tEst > [0, 4.2, 3.6, 3][this.fase]) this.siguiente();
        break;
      }
      case 'drones':
        this.y = lerp(this.y, this.yFlotar, Math.min(1, dt * 3));
        if (this.tEst > 0.6 && !this.lanzo) {
          this.lanzo = true;
          for (const s of [-1, 1]) {
            const d = new Dron(J, this.cx + s * 30, this.cy - 10);
            d.estado = 'ataque'; d.tEst = 2;
            J.enemigos.push(d);
          }
          Sonido.efecto('jefe');
        }
        if (this.tEst > 1.4) { this.lanzo = false; this.siguiente(); }
        break;
      case 'golpe':
        if (this.tEst < 1) {
          this.x = lerp(this.x, clamp(p.cx - this.w / 2, izq, der), Math.min(1, dt * 4));
          this.y = lerp(this.y, this.suelo - 150, Math.min(1, dt * 4));
        } else {
          this.vy = (this.vy || 0) + 1600 * dt;
          this.y += this.vy * dt;
          if (this.y + this.h >= this.suelo) {
            this.y = this.suelo - this.h; this.vy = 0;
            J.sacudir(0.45, 5);
            Sonido.efecto('onda');
            vibrar(90);
            const n = this.fase >= 2 ? 2 : 1;
            for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
              J.disparar({ x: this.cx + s * 20 - 7, y: this.suelo - 12, vx: s * (165 + i * 60), vy: 0, w: 14, h: 12, dano: 20, tipo: 'onda', duenio: 'enemigo', vida: 3 });
            }
            J.particulas.chispa(this.cx, this.suelo - 2, '#c86bff', 16, 140);
            this.cambiar('aturdido');
          }
        }
        break;
      case 'aturdido':
        if (Math.random() < 0.2) J.particulas.agregar({ x: this.cx + rnd(-20, 20), y: this.y + 4, vx: 0, vy: -20, vida: 0.5, color: '#ffe066', grav: 0, tam: 1 });
        if (this.tEst > 1.8) { this.cambiar('subir'); if (Math.random() < 0.6) J.soltar(Math.random() < 0.5 ? 'pozole' : 'energia', this.cx, this.y); }
        break;
      case 'subir':
        this.y = lerp(this.y, this.yFlotar, Math.min(1, dt * 3));
        if (this.tEst > 0.9) this.siguiente();
        break;
      case 'embestida': {
        if (this.tEst < 0.05) this.lado = p.cx > (this.x0 + this.x1) / 2 ? -1 : 1;
        const destX = this.lado < 0 ? izq : der;
        if (this.tEst < 1.1) {
          this.x = lerp(this.x, destX, Math.min(1, dt * 4));
          this.y = lerp(this.y, this.suelo - this.h - 4, Math.min(1, dt * 4));
        } else if (this.tEst < 1.6) {
          if (Math.floor(this.t * 20) % 2) this.flash = 0.03;
        } else {
          this.x += -this.lado * 270 * dt;
          if (Math.random() < 0.5) J.particulas.agregar({ x: this.cx - this.lado * 26, y: this.cy + rnd(-12, 12), vx: this.lado * 40, vy: 0, vida: 0.4, color: '#ff3fbf', grav: 0, tam: 2 });
          if (this.x < izq || this.x > der) { this.x = clamp(this.x, izq, der); this.cambiar('subir'); J.sacudir(0.2, 3); }
        }
        break;
      }
      case 'anillo':
        this.y = lerp(this.y, this.yFlotar, Math.min(1, dt * 3));
        if (this.tEst > 0.7 && !this.lanzo) {
          this.lanzo = true;
          const n = [0, 8, 10, 12][this.fase];
          const off = Math.random();
          for (let i = 0; i < n; i++) this.disparo(((i + off) / n) * Math.PI * 2, 100);
          Sonido.efecto('jefe');
          J.particulas.anillo(this.cx, this.cy, '#c86bff', 40, 0.5);
        }
        if (this.tEst > 1.6) { this.lanzo = false; this.siguiente(); }
        break;
      case 'muerte':
        this.y += 10 * dt;
        if (Math.random() < 0.35) J.explosion(this.cx + rnd(-26, 26), this.cy + rnd(-26, 26), false);
        if (this.tEst > 2.6) {
          this.vivo = false;
          J.explosion(this.cx, this.cy, true);
          J.soltar('microchip', this.cx, this.cy);
        }
        break;
    }
  }

  dibujar(g, cx, cy) {
    if (!this.vivo || this.estado === 'espera') return;
    const x = Math.round(this.x - 16 - cx), y = Math.round(this.y - 4 - cy);
    // llamas de propulsión
    const fl = 4 + Math.floor(Math.random() * 4);
    rect(g, x + 30, y + 68, 5, fl, '#ffa94d'); rect(g, x + 49, y + 68, 5, fl, '#ffa94d');
    rect(g, x + 31, y + 68, 3, fl - 2, '#fff1b8'); rect(g, x + 50, y + 68, 3, fl - 2, '#fff1b8');
    // brazos mecánicos
    const ab = Math.sin(this.t * 3) * 3;
    for (const s of [-1, 1]) {
      const bx = x + 42 + s * 30, by = y + 38 + ab * s;
      brocha(g, x + 42 + s * 22, y + 36, bx, by, 4, '#140f20');
      brocha(g, x + 42 + s * 22, y + 36, bx, by, 2, '#6a70a0');
      rect(g, bx - 3, by - 2, 6, 6, '#140f20');
      rect(g, bx - 2, by - 1, 4, 4, this.estado === 'anillo' ? '#ff3fbf' : '#c86bff');
    }
    let img = SPR.jefe;
    if (this.flash > 0) img = SPR.jefeBlanco;
    g.drawImage(img, x, y);
    // manecillas del reloj
    const ccx = x + 42, ccy = y + 40;
    const am = this.t * (this.fase * 1.5), ah = this.t * 0.25 * this.fase;
    brocha(g, ccx, ccy, ccx + Math.round(Math.cos(am) * 13), ccy + Math.round(Math.sin(am) * 13), 1, '#2a1a30');
    brocha(g, ccx, ccy, ccx + Math.round(Math.cos(ah) * 8), ccy + Math.round(Math.sin(ah) * 8), 2, '#c0392b');
    circulo(g, ccx, ccy, 2, '#e8b84a');
    if (this.estado === 'aturdido') {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 4 + (i * Math.PI * 2) / 3;
        texto(g, '★', ccx + Math.cos(a) * 18 - 3, y - 2 + Math.sin(a) * 4, COL.amarillo);
      }
    }
    if (this.J.tiempoDetenido > 0) { g.globalAlpha = 0.4; g.drawImage(congelado(SPR.jefe), x, y); g.globalAlpha = 1; }
  }
}

/* --------------------------- Proyectiles ----------------------------- */
class Proyectil {
  constructor(o) {
    Object.assign(this, { w: 6, h: 6, dano: 10, vida: 2, tipo: 'orbe', duenio: 'enemigo', vx: 0, vy: 0 }, o);
    this.vivo = true; this.t = 0;
  }

  actualizar(dt, J) {
    if (this.duenio === 'enemigo' && J.tiempoDetenido > 0) return;
    this.t += dt;
    this.vida -= dt;
    if (this.vida <= 0) { this.vivo = false; return; }
    if (this.buscar) {
      let mejor = null, md = 130;
      for (const e of J.objetivos()) {
        const d = Math.hypot(e.cx - this.x, e.cy - this.y);
        if (d < md && Math.sign(e.cx - this.x) === Math.sign(this.vx)) { md = d; mejor = e; }
      }
      if (mejor) this.vy = lerp(this.vy, clamp((mejor.cy - this.y) * 3, -160, 160), Math.min(1, dt * 5));
      if (Math.random() < 0.5) J.particulas.agregar({ x: this.x + 3, y: this.y + 3, vx: 0, vy: 0, vida: 0.25, color: elegir(['#ffe066', '#ff8ad8', '#ffffff']), grav: 0, tam: 1 });
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.tipo === 'onda') {
      if (Math.random() < 0.6) J.particulas.agregar({ x: this.x + 7, y: this.y + 10, vx: rnd(-20, 20), vy: rnd(-60, -20), vida: 0.3, color: '#c86bff', grav: 100, tam: 1 });
      if (J.solidoEn(this.x + (this.vx > 0 ? this.w : 0), this.y + 4)) this.vivo = false;
    } else if (J.solidoEn(this.x + this.w / 2, this.y + this.h / 2)) {
      this.vivo = false;
      J.particulas.chispa(this.x + this.w / 2, this.y + this.h / 2, this.duenio === 'jugador' ? '#9ff4ff' : '#ff6a9a', 4, 50, 0.25);
      return;
    }
    if (this.duenio === 'jugador') {
      for (const e of J.objetivos()) {
        if (choca(this, e)) {
          e.herir(Math.round(this.dano * J.multDano()), Math.sign(this.vx) || 1);
          this.vivo = false;
          return;
        }
      }
    } else if (choca(this, J.jugador)) {
      if (J.jugador.herir(this.dano, this.x + this.w / 2) && this.tipo !== 'onda') this.vivo = false;
    }
  }

  dibujar(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    switch (this.tipo) {
      case 'bala':
        rect(g, x - Math.sign(this.vx) * 6, y + 1, 6, 1, 'rgba(63,243,255,0.5)');
        rect(g, x, y, 8, 3, '#3ff3ff');
        rect(g, x + 1, y + 1, 6, 1, '#ffffff');
        break;
      case 'estrella': {
        const f = Math.floor(this.t * 12) % 2;
        if (f) { rect(g, x + 3, y, 1, 7, '#ffe066'); rect(g, x, y + 3, 7, 1, '#ffe066'); rect(g, x + 2, y + 2, 3, 3, '#ffffff'); }
        else { rect(g, x + 1, y + 1, 5, 5, '#ffe066'); rect(g, x + 2, y + 2, 3, 3, '#ffffff'); px(g, x + 3, y - 1, '#ffe066'); px(g, x + 3, y + 7, '#ffe066'); }
        break;
      }
      case 'orbe':
        circulo(g, x + 3, y + 3, 3, '#ff3fbf');
        circulo(g, x + 3, y + 3, 1, '#ffffff');
        break;
      case 'rayo':
        rect(g, x, y, 7, 3, '#ff4d6d');
        rect(g, x + 1, y + 1, 5, 1, '#ffd0de');
        break;
      case 'onda':
        g.globalAlpha = 0.85;
        rect(g, x, y + 4, 14, 8, '#7a3fe0');
        rect(g, x + 2, y + 1, 10, 4, '#c86bff');
        rect(g, x + 4, y + 2, 6, 8, '#f0d8ff');
        g.globalAlpha = 1;
        break;
    }
  }
}

/* --------------------------- Objetos --------------------------------- */
class Objeto {
  constructor(J, tipo, x, y, extra = {}) {
    this.J = J; this.tipo = tipo;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.t = Math.random() * 5; this.vivo = true;
    Object.assign(this, extra);
    const tam = { chip: [8, 8], energia: [10, 12], pozole: [16, 11], foto: [14, 14], microchip: [18, 18], antena: [12, 32], letrero: [16, 22], elevador: [32, 48] }[tipo] || [10, 10];
    this.w = tam[0]; this.h = tam[1];
  }

  actualizar(dt) {
    const J = this.J, p = J.jugador;
    this.t += dt;
    if (this.fisica) {
      this.vy = Math.min(this.vy + GRAV * 0.8 * dt, 300);
      J.mover(this, dt);
      if (this.suelo) this.vx *= 0.9;
      if (this.vidaRest !== undefined) { this.vidaRest -= dt; if (this.vidaRest <= 0) this.vivo = false; }
      if (this.y > J.altoPx + 40) this.vivo = false;
    }
    if (this.tipo === 'chip' && this.suelto) {
      const d = Math.hypot(p.cx - (this.x + 4), p.cy - (this.y + 4));
      if (d < 30) { this.x += ((p.cx - this.x - 4) / d) * 140 * dt; this.y += ((p.cy - this.y - 4) / d) * 140 * dt; }
    }
    if (this.tipo === 'letrero') {
      const cerca = Math.abs(p.cx - (this.x + 8)) < 26 && Math.abs(p.cy - (this.y + 8)) < 32;
      if (cerca) J.letreroActivo = this;
      else if (J.letreroActivo === this) J.letreroActivo = null;
      return;
    }
    if (!choca(p, this)) return;
    switch (this.tipo) {
      case 'chip':
        this.vivo = false; J.chips++; J.stats.chips++;
        Sonido.efecto('chip');
        J.particulas.chispa(this.x + 4, this.y + 4, '#ffd23f', 4, 40, 0.3, 0);
        break;
      case 'energia':
        this.vivo = false;
        for (const m of J.equipo) m.energia = Math.min(m.energiaMax, m.energia + 35);
        Sonido.efecto('energia');
        J.particulas.texto(this.x + 5, this.y, '+ENERGÍA', '#c8a8ff');
        break;
      case 'pozole': {
        this.vivo = false;
        const pj = p.pj;
        pj.vida = Math.min(pj.vidaMax, pj.vida + Math.round(pj.vidaMax * 0.5));
        for (const m of J.equipo) if (m !== pj) m.vida = Math.min(m.vidaMax, m.vida + Math.round(m.vidaMax * 0.15));
        Sonido.efecto('salud');
        J.particulas.texto(this.x + 8, this.y, '¡POZOLE!', '#ff8a6a');
        J.particulas.chispa(this.x + 8, this.y + 4, '#5fd35f', 6, 50);
        break;
      }
      case 'foto':
        this.vivo = false;
        J.fotos |= 1 << this.indice;
        Sonido.efecto('foto'); vibrar(40);
        J.aviso('¡FOTO FAMILIAR ' + J.cuentaFotos() + '/3!', COL.amarillo);
        J.particulas.chispa(this.x + 7, this.y + 7, '#ffffff', 12, 90);
        break;
      case 'microchip':
        if (!this.suelo) break;
        this.vivo = false;
        J.recogerMicrochip();
        break;
      case 'antena':
        if (!this.activa) {
          this.activa = true;
          J.punto = { x: this.x - 2, y: this.y + this.h - p.h };
          for (const m of J.equipo) m.vida = Math.max(m.vida, Math.round(m.vidaMax * 0.5));
          Sonido.efecto('checkpoint');
          J.aviso('¡PUNTO DE CONTROL!', COL.verde);
          J.particulas.anillo(this.x + 6, this.y + 6, '#4dff9a', 26, 0.6);
        }
        break;
      case 'elevador':
        if (p.suelo && J.estado === 'jugando') J.llegarElevador(this);
        break;
    }
  }

  dibujar(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const flota = this.fisica ? 0 : Math.round(Math.sin(this.t * 3) * 1.5);
    switch (this.tipo) {
      case 'chip':
        if (this.vidaRest !== undefined && this.vidaRest < 2.5 && Math.floor(this.t * 10) % 2) break;
        g.drawImage(SPR.chip[Math.floor(this.t * 8) % 4], x - 1, y - 1 + flota);
        break;
      case 'energia': g.drawImage(SPR.energia, x, y + flota); break;
      case 'pozole':
        g.drawImage(SPR.pozole, x - 1, y - 2 + flota);
        if (Math.floor(this.t * 3) % 2) { px(g, x + 5, y - 5 + flota, 'rgba(255,255,255,0.6)'); px(g, x + 10, y - 7 + flota, 'rgba(255,255,255,0.5)'); }
        break;
      case 'foto': {
        g.save();
        g.globalAlpha = 0.35 + 0.2 * Math.sin(this.t * 5);
        circulo(g, x + 7, y + 7 + flota, 10, '#fff1b8');
        g.restore();
        g.drawImage(SPR.foto, x, y + flota);
        if (Math.floor(this.t * 6) % 3 === 0) px(g, x + 13, y + 1 + flota, '#ffffff');
        break;
      }
      case 'microchip': {
        g.save();
        g.globalAlpha = 0.4 + 0.25 * Math.sin(this.t * 6);
        circulo(g, x + 9, y + 9, 14, '#3ff3ff');
        g.restore();
        g.drawImage(SPR.microchip, x - 1, y - 1);
        break;
      }
      case 'antena':
        g.drawImage(SPR.antena[this.activa ? 1 : 0], x - 1, y - 1);
        if (this.activa && Math.floor(this.t * 2) % 2) { g.globalAlpha = 0.5; g.strokeStyle = '#4dff9a'; g.strokeRect(x - 4.5, y - 3.5, 20, 18); g.globalAlpha = 1; }
        break;
      case 'letrero':
        g.drawImage(SPR.letrero, x - 1, y - 1);
        if (this.J.letreroActivo !== this && Math.floor(this.t * 2) % 2) texto(g, '!', x + 6, y - 9, COL.cian);
        break;
      case 'elevador': this.dibujarElevador(g, x, y); break;
    }
  }

  dibujarElevador(g, x, y) {
    const a = this.apertura || 0;
    rect(g, x - 4, y - 10, 40, 58, '#2b3156');
    rect(g, x - 4, y - 10, 40, 2, '#7a86c0');
    rect(g, x - 4, y - 10, 2, 58, '#4a5488');
    rect(g, x + 34, y - 10, 2, 58, '#1b2140');
    // logotipo de Chrono-Corp
    circulo(g, x + 16, y - 3, 5, '#3ff3ff');
    circulo(g, x + 16, y - 3, 3, '#2b3156');
    rect(g, x + 16, y - 4, 6, 3, '#2b3156');
    rect(g, x + 16, y - 3, 4, 1, '#3ff3ff');
    // interior iluminado
    rect(g, x, y + 4, 32, 44, '#fff1b8');
    g.globalAlpha = 0.5; rect(g, x, y + 4, 32, 44, '#ffd23f'); g.globalAlpha = 1;
    const off = Math.round(a * 15);
    rect(g, x - off, y + 4, 16, 44, '#5b6696'); rect(g, x + 16 + off, y + 4, 16, 44, '#5b6696');
    rect(g, x - off, y + 4, 16, 1, '#8a96c8'); rect(g, x + 16 + off, y + 4, 16, 1, '#8a96c8');
    rect(g, x + 15 - off, y + 4, 1, 44, '#3a4470'); rect(g, x + 16 + off, y + 4, 1, 44, '#3a4470');
    rect(g, x - off + 3, y + 20, 10, 1, '#4a5488'); rect(g, x + 19 + off, y + 20, 10, 1, '#4a5488');
    // flecha que parpadea
    if (Math.floor(this.t * 3) % 2) { texto(g, '▶', x + 34 + 4, y + 26, COL.verde); }
    texto(g, 'META', x + 16, y - 20, COL.verde, { fuente: 'mini', alin: 'centro', borde: '#140f20' });
  }
}

/* --------------------------- Plataforma móvil ------------------------ */
class PlataformaMovil {
  constructor(J, x, y, tipo) {
    this.J = J;
    this.x0 = x; this.y0 = y; this.x = x; this.y = y;
    this.w = 48; this.h = 8; this.tipo = tipo;
    this.t = 0; this.dx = 0; this.dy = 0;
  }

  actualizar(dt) {
    const px0 = this.x, py0 = this.y;
    if (this.J.tiempoDetenido <= 0) this.t += dt;
    if (this.tipo === 'm') this.x = this.x0 + Math.sin(this.t * 0.9) * 64;
    else this.y = this.y0 - ((1 - Math.cos(this.t * 0.9)) / 2) * 66;
    this.dx = this.x - px0; this.dy = this.y - py0;
  }

  dibujar(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    for (let i = 0; i < 3; i++) g.drawImage(SPR.cas.plataforma, x + i * 16, y);
    rect(g, x, y, 1, 7, '#2a3260'); rect(g, x + 47, y, 1, 7, '#2a3260');
    const f = Math.floor(this.J.t * 12) % 2;
    rect(g, x + 8, y + 7, 4, 2 + f, '#3ff3ff'); rect(g, x + 36, y + 7, 4, 2 + f, '#3ff3ff');
  }
}
