'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — escenas.js
   Pantallas: carga, título, introducción, mapa de misiones, taller,
   opciones, créditos y final.
   ===================================================================== */

const MEJORAS = [
  { k: 'salud', nombre: 'SALUD +15%', desc: 'MÁS VIDA PARA TODA LA FAMILIA.', costos: [30, 60, 100], icono: 'corazon', color: '#ff4d6d' },
  { k: 'energia', nombre: 'ENERGÍA', desc: 'RECARGA MÁS RÁPIDO Y LOS PODERES CUESTAN MENOS.', costos: [30, 60, 100], icono: 'gota', color: '#b07aff' },
  { k: 'fuerza', nombre: 'FUERZA +20%', desc: 'TODOS LOS ATAQUES HACEN MÁS DAÑO.', costos: [40, 80, 130], icono: 'estrella', color: '#ffe066' },
  { k: 'vidas', nombre: 'VIDA EXTRA', desc: 'UN INTENTO MÁS EN CADA MISIÓN.', costos: [50, 110], icono: 'corazon', color: '#4dff9a' },
];

function fondoMenu(g) {
  const W = App.W, H = App.H;
  rect(g, 0, 0, W, H, COL.fondo);
  g.globalAlpha = 0.18;
  for (let x = 0; x < W; x += 12) rect(g, x, 0, 1, H, '#2a2458');
  for (let y = 0; y < H; y += 12) rect(g, 0, y, W, 1, '#2a2458');
  g.globalAlpha = 1;
}

// Ciudad con paralaje para menús (sin mapa de juego)
function ciudadMenu(g, tema, despl, hz, t) {
  const F = fondoTema(tema), tm = F.tema, W = App.W, H = App.H;
  const gr = g.createLinearGradient(0, 0, 0, hz);
  tm.cielo.forEach((c, i) => gr.addColorStop(i / (tm.cielo.length - 1), c));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  if (tm.luna) { circulo(g, Math.round(W * 0.8), Math.max(18, hz - 400), 14, '#cfeff0'); }
  const capa = (img, d, base) => {
    const y = Math.round(base - img.height);
    let x = -Math.floor(d % img.width);
    if (x > 0) x -= img.width;
    for (; x < W; x += img.width) g.drawImage(img, x, y);
  };
  if (F.lejos) {
    capa(F.lejos, despl * 0.1, hz + 20);
    capa(F.medio, despl * 0.25, hz + 40);
    capa(F.cerca, despl * 0.5, hz + 60);
  }
  const ga = g.createLinearGradient(0, hz - 60, 0, H);
  ga.addColorStop(0, hexA(tm.abismo, 0));
  ga.addColorStop(0.5, hexA(tm.abismo, 0.85));
  ga.addColorStop(1, hexA(tm.abismo, 1));
  g.fillStyle = ga;
  g.fillRect(0, hz - 60, W, H - hz + 60);
}

/* ======================= CARGA ====================================== */
class EscenaCarga {
  entrar() {
    this.progreso = 0; this.listo = false; this.t = 0;
    cargarImagenes((p) => { this.progreso = p; }).then(() => {
      generarSprites();
      fondoTema('neon');
      this.listo = true;
    });
  }
  actualizar(dt) { this.t += dt; }
  dibujar(g) {
    const W = App.W, H = App.H;
    fondoMenu(g);
    textoNeon(g, 'AVENTURA', W / 2, H * 0.34, { esc: 3, alin: 'centro' });
    textoNeon(g, 'FAMILIAR', W / 2, H * 0.34 + 30, { esc: 3, alin: 'centro' });
    const bw = Math.min(180, W - 60), bx = (W - bw) / 2, by = H * 0.6;
    if (!this.listo) {
      UI.barra(g, bx, by, bw, 8, this.progreso, COL.cian);
      texto(g, 'CARGANDO...', W / 2, by + 16, COL.gris, { alin: 'centro', fuente: 'mini' });
      return;
    }
    if (Math.floor(this.t * 2) % 2) texto(g, 'TOCA PARA EMPEZAR', W / 2, by, COL.crema, { alin: 'centro', sombra: '#3a2a10' });
    texto(g, 'MEJOR CON SONIDO', W / 2, by + 20, COL.gris, { alin: 'centro', fuente: 'mini' });
    if (Entrada.algunToque() || Entrada.pulso('Enter', 'Space')) {
      Sonido.iniciar();
      if (Opciones.completa) pantallaCompleta(true);
      Sonido.efecto('aceptar');
      App.ir('titulo');
    }
  }
}

/* ======================= TÍTULO ===================================== */
class EscenaTitulo {
  entrar() {
    this.t = 0; this.sel = Guardado.hay() ? 1 : 0;
    this.confirmar = false; this.perfil = -1;
    this.chispas = [];
    this.auto = -100;
    Musica.tocar('titulo');
  }

  actualizar(dt) {
    this.t += dt;
    if (this.perfil >= 0 || this.confirmar) return;
    const n = 4;
    if (Entrada.pulso('ArrowDown', 'KeyS')) { this.sel = (this.sel + 1) % n; if (this.sel === 1 && !Guardado.hay()) this.sel = 2; Sonido.efecto('menu'); }
    if (Entrada.pulso('ArrowUp', 'KeyW')) { this.sel = (this.sel + n - 1) % n; if (this.sel === 1 && !Guardado.hay()) this.sel = 0; Sonido.efecto('menu'); }
    if (Entrada.pulso('Enter', 'Space')) this.activar(this.sel);
    if (Math.random() < dt * 4) this.chispas.push({ x: rnd(0, App.W), y: rnd(0, App.H * 0.4), vida: 1 });
    for (const c of this.chispas) c.vida -= dt;
    this.chispas = this.chispas.filter((c) => c.vida > 0);
    this.auto += dt * 40;
    if (this.auto > App.W + 60) this.auto = -100 - rnd(0, 200);
  }

  activar(i) {
    if (i === 1 && !Guardado.hay()) { Sonido.efecto('error'); return; }
    Sonido.efecto('aceptar');
    if (i === 0) {
      if (Guardado.hay()) this.confirmar = true;
      else this.nuevo();
    } else if (i === 1) App.ir('mapa');
    else if (i === 2) App.ir('opciones', { volver: 'titulo' });
    else App.ir('creditos');
  }

  nuevo() {
    Guardado.datos = Guardado.nuevo();
    Guardado.guardar();
    App.ir('intro');
  }

  dibujar(g) {
    const W = App.W, H = App.H;
    const vertical = H >= W * 1.25;
    fondoMenu(g);
    let artW, artH, panelX, panelW, cartasY;
    if (vertical) {
      artW = W; artH = Math.round(Math.min(W * 655 / 608, H * 0.44));
      panelX = 0; panelW = W; cartasY = artH - 16;
    } else {
      artW = Math.round(W * 0.47); artH = H;
      panelX = artW; panelW = W - artW; cartasY = 8;
    }
    // portada original (el logo y la ciudad de la imagen)
    dibujarCubrir(g, IMG.portada, 0, 0, artW, artH, vertical ? 0.1 : 0.2);
    // auto volador que cruza la portada
    const ay = Math.round(artH * 0.62);
    if (this.auto > -40) {
      const ax = Math.round(this.auto * (artW / W));
      rect(g, ax, ay, 16, 4, '#2a2f50'); rect(g, ax + 4, ay - 3, 8, 3, '#3a4070'); px(g, ax + 16, ay + 1, '#fff1b8');
      g.globalAlpha = 0.6; rect(g, ax - 10, ay + 2, 10, 1, COL.magenta); g.globalAlpha = 1;
    }
    for (const c of this.chispas) {
      if (c.x > artW || c.y > artH) continue;
      g.globalAlpha = c.vida; px(g, c.x, c.y, '#ffffff'); g.globalAlpha = 1;
    }
    // degradado hacia el fondo
    if (vertical) {
      const gr = g.createLinearGradient(0, artH - 50, 0, artH);
      gr.addColorStop(0, 'rgba(15,13,36,0)'); gr.addColorStop(1, COL.fondo);
      g.fillStyle = gr; g.fillRect(0, artH - 50, W, 50);
    } else {
      const gr = g.createLinearGradient(artW - 30, 0, artW, 0);
      gr.addColorStop(0, 'rgba(15,13,36,0)'); gr.addColorStop(1, COL.fondo);
      g.fillStyle = gr; g.fillRect(artW - 30, 0, 30, H);
    }
    // decoraciones de la portada (máquina con vapor y terminal)
    if (vertical && IMG.maquina && IMG.terminal) {
      const mh = Math.round(H * 0.2), mw = Math.round(mh * IMG.maquina.width / IMG.maquina.height);
      const th = Math.round(H * 0.26), tw = Math.round(th * IMG.terminal.width / IMG.terminal.height);
      g.globalAlpha = 0.9;
      dibujarSuave(g, IMG.maquina, 0, 0, IMG.maquina.width, IMG.maquina.height, 0, H - mh, mw, mh);
      dibujarSuave(g, IMG.terminal, 0, 0, IMG.terminal.width, IMG.terminal.height, W - tw, H - th, tw, th);
      g.globalAlpha = 1;
    }

    // cartas de la familia
    const gap = 3, mx = vertical ? 4 : 6;
    const cw = Math.floor((panelW - mx * 2 - gap * 3) / 4);
    const ch = Math.round(cw * (vertical ? 1.42 : 1.2));
    const brillo = Math.floor(this.t / 1.6) % 4;
    for (let i = 0; i < 4; i++) {
      const d = PERSONAJES[i];
      const x = panelX + mx + i * (cw + gap), y = cartasY;
      const r = { x, y, w: cw, h: ch };
      const act = i === brillo;
      rect(g, x + cw / 2 - 10, y - 4, 20, 4, '#3a4470');
      rect(g, x + cw / 2 - 6, y - 3, 12, 1, act ? COL.verde : '#2a8a6a');
      rect(g, x - 1, y - 1, cw + 2, ch + 2, act ? '#9ff9ff' : '#4fd8e0');
      rect(g, x, y, cw, ch, '#0a0814');
      const img = IMG['carta_' + d.id];
      if (img) {
        const sh = Math.min(img.height, img.width * ch / cw);
        dibujarSuave(g, img, 0, 0, img.width, sh, x + 1, y + 1, cw - 2, ch - 2);
      }
      if (act) { g.globalAlpha = 0.12; rect(g, x, y, cw, ch, '#ffffff'); g.globalAlpha = 1; }
      if (Entrada.tocado(r) && this.perfil < 0 && !this.confirmar) { this.perfil = i; Sonido.efecto('aceptar'); }
      // nombre y poder
      const tx = x + cw / 2;
      let ty = y + ch + 5;
      texto(g, d.nombre, tx, ty, COL.crema, { alin: 'centro' });
      ty += 9;
      texto(g, d.apellidos, tx, ty, '#d8d4ec', { alin: 'centro', fuente: 'mini' });
      ty += 7;
      if (d.extra) { texto(g, d.extra, tx, ty, COL.gris, { alin: 'centro', fuente: 'mini' }); ty += 7; }
      texto(g, d.poder, tx, ty + 1, COL.amarillo, { alin: 'centro', fuente: 'mini' });
      texto(g, '(' + d.tipo + ')', tx, ty + 8, '#b8b4d0', { alin: 'centro', fuente: 'mini' });
    }

    // menú principal
    const items = ['NUEVO JUEGO', 'CONTINUAR', 'OPCIONES', 'CRÉDITOS'];
    const top = cartasY + ch + (vertical ? 46 : 42);
    const disp = H - top - 6;
    const ih = clamp(Math.floor(disp / 4), 20, 36);
    const esc = ih >= 26 && panelW >= 220 ? 2 : 1;
    const y0 = top + Math.max(0, (disp - ih * 4) / 2);
    const cxm = panelX + panelW / 2;
    items.forEach((et, i) => {
      const off = i === 1 && !Guardado.hay();
      const y = Math.round(y0 + i * ih);
      const tw = anchoTexto(et, 'normal', esc);
      const r = { x: cxm - tw / 2 - 18, y: y, w: tw + 36, h: ih - 4 };
      const sel = i === this.sel;
      if (sel) {
        g.save();
        g.shadowColor = COL.cian; g.shadowBlur = 8;
        caminoCortado(g, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 6);
        g.fillStyle = 'rgba(20,40,70,0.75)'; g.fill();
        g.strokeStyle = COL.cian; g.stroke();
        g.restore();
        rect(g, r.x + 6, r.y + r.h - 2, r.w - 12, 2, COL.morado);
        const bob = Math.round(Math.sin(this.t * 5) * 2);
        g.drawImage(ESPADA, Math.round(r.x - 16 + bob), Math.round(r.y + r.h / 2 - 7));
      }
      const color = off ? '#5a5670' : COL.crema;
      if (!off) { g.globalAlpha = 0.4; texto(g, et, cxm, y + (ih - 4) / 2 - 3.5 * esc + 1, '#ffb84d', { alin: 'centro', esc }); g.globalAlpha = 1; }
      texto(g, et, cxm, y + (ih - 4) / 2 - 3.5 * esc, color, { alin: 'centro', esc, sombra: off ? null : '#4a2a10' });
      if (Entrada.tocado(r) && this.perfil < 0 && !this.confirmar) {
        if (this.sel !== i) this.sel = i;
        this.activar(i);
      }
    });
    texto(g, 'V1.0', W - 3, H - 8, '#3a3660', { alin: 'der', fuente: 'mini' });

    if (this.perfil >= 0) this.dibujarPerfil(g);
    if (this.confirmar) this.dibujarConfirmar(g);
  }

  dibujarPerfil(g) {
    const W = App.W, H = App.H, d = PERSONAJES[this.perfil];
    g.fillStyle = 'rgba(6,4,18,0.85)'; g.fillRect(0, 0, W, H);
    const pw = Math.min(W - 16, 300), ph = Math.min(H - 20, 300), x0 = (W - pw) / 2, y0 = (H - ph) / 2;
    UI.marco(g, x0, y0, pw, ph, d.color);
    const img = IMG['carta_' + d.id];
    const iw = Math.round(pw * 0.36), ih = Math.min(ph - 70, Math.round(iw * 2.2));
    rect(g, x0 + 9, y0 + 9, iw + 2, ih + 2, d.color);
    if (img) dibujarSuave(g, img, 0, 0, img.width, Math.min(img.height, img.width * ih / iw), x0 + 10, y0 + 10, iw, ih);
    // sprite animado
    const s = SPR.pj[d.id].correr[Math.floor(this.t * 8) % 4];
    g.drawImage(s.d, x0 + 10 + iw / 2 - 16, y0 + ih + 16);
    const tx = x0 + iw + 20, tw = pw - iw - 30;
    let y = y0 + 12;
    texto(g, d.nombre, tx, y, d.color, { esc: 2 }); y += 18;
    envolver(d.apellidos + (d.extra ? ' ' + d.extra : ''), tw, 'mini').forEach((l) => { texto(g, l, tx, y, '#d8d4ec', { fuente: 'mini' }); y += 7; });
    y += 3;
    texto(g, d.poder, tx, y, COL.amarillo); y += 10;
    texto(g, '(' + d.tipo + ')', tx, y, COL.gris, { fuente: 'mini' }); y += 11;
    for (const [k, et] of [['fuerza', 'FUERZA'], ['velocidad', 'VELOCIDAD'], ['salto', 'SALTO'], ['magia', 'MAGIA']]) {
      texto(g, et, tx, y, COL.crema, { fuente: 'mini' });
      for (let i = 0; i < 5; i++) rect(g, tx + tw - 40 + i * 8, y - 1, 6, 6, i < d.stats[k] ? d.color : '#2a2645');
      y += 9;
    }
    y += 3;
    texto(g, 'ATAQUE (B)', tx, y, COL.cian, { fuente: 'mini' }); y += 7;
    envolver(d.ataque, tw, 'mini').forEach((l) => { texto(g, l, tx, y, COL.blanco, { fuente: 'mini' }); y += 7; });
    y += 3;
    texto(g, 'ESPECIAL (★)', tx, y, COL.amarillo, { fuente: 'mini' }); y += 7;
    envolver(d.especial, tw, 'mini').forEach((l) => { if (y < y0 + ph - 14) texto(g, l, tx, y, COL.blanco, { fuente: 'mini' }); y += 7; });
    texto(g, 'TOCA PARA CERRAR', W / 2, y0 + ph - 10, COL.gris, { alin: 'centro', fuente: 'mini' });
    if (Entrada.algunToque() || Entrada.pulso('Escape', 'Enter', 'Space')) { this.perfil = -1; Sonido.efecto('atras'); Entrada.toques.length = 0; }
  }

  dibujarConfirmar(g) {
    const W = App.W, H = App.H;
    g.fillStyle = 'rgba(6,4,18,0.85)'; g.fillRect(0, 0, W, H);
    const pw = Math.min(230, W - 20), ph = 110, x0 = (W - pw) / 2, y0 = (H - ph) / 2;
    UI.marco(g, x0, y0, pw, ph, COL.magenta);
    texto(g, '¿EMPEZAR DE NUEVO?', W / 2, y0 + 14, COL.crema, { alin: 'centro' });
    envolver('SE BORRARÁ EL PROGRESO GUARDADO, LAS FOTOS Y LAS MEJORAS.', pw - 24, 'mini').forEach((l, i) => texto(g, l, W / 2, y0 + 32 + i * 8, COL.gris, { alin: 'centro', fuente: 'mini' }));
    const bw = (pw - 36) / 2;
    if (UI.boton(g, { x: x0 + 12, y: y0 + ph - 34, w: bw, h: 24 }, 'SÍ', { color: COL.magenta })) { this.confirmar = false; this.nuevo(); }
    if (UI.boton(g, { x: x0 + 24 + bw, y: y0 + ph - 34, w: bw, h: 24 }, 'NO', { color: COL.verde }) || Entrada.pulso('Escape')) { this.confirmar = false; Sonido.efecto('atras'); }
  }
}

/* ======================= INTRO ====================================== */
class EscenaIntro {
  entrar() {
    this.t = 0; this.mision = 0;
    this.dialogo = new Dialogo(HISTORIA.intro, () => { this.mision = 0.001; Sonido.efecto('checkpoint'); });
    Musica.tocar('mapa');
  }
  actualizar(dt) {
    this.t += dt;
    this.dialogo.actualizar(dt);
    if (this.mision > 0) {
      this.mision += dt;
      if (this.mision > 2.6 && !this.salio) { this.salio = true; App.ir('juego', { nivel: 0 }); }
    }
  }
  dibujar(g) {
    const W = App.W, H = App.H;
    rect(g, 0, 0, W, H, '#000');
    const foco = clamp(this.t / 24, 0, 1);
    dibujarCubrir(g, IMG.escena, 0, 0, W, H, foco);
    g.fillStyle = 'rgba(10,6,30,0.15)'; g.fillRect(0, 0, W, H);
    // franjas de cine
    rect(g, 0, 0, W, 10, '#000');
    if (this.mision > 0) {
      const a = clamp(this.mision * 3, 0, 1);
      g.globalAlpha = a;
      const mw = Math.min(200, W - 20), mx = (W - mw) / 2, my = H * 0.6;
      UI.marco(g, mx, my, mw, 52, COL.cian, 'rgba(8,12,28,0.94)');
      texto(g, 'MISIÓN ACTIVADA:', mx + 10, my + 9, COL.crema);
      texto(g, 'SECTOR 7 – RECUPERAR EL', mx + 10, my + 21, COL.crema, { fuente: 'mini' });
      texto(g, 'MICROCHIP DEL TIEMPO', mx + 10, my + 29, COL.crema, { fuente: 'mini' });
      texto(g, '(RECONOCER ÁREA)', mx + 10, my + 39, COL.cian, { fuente: 'mini' });
      g.globalAlpha = 1;
    } else this.dialogo.dibujar(g, W, H);
  }
}

/* ======================= MAPA ======================================= */
class EscenaMapa {
  entrar() {
    this.t = 0;
    if (!Guardado.hay()) { Guardado.datos = Guardado.nuevo(); Guardado.guardar(); }
    const d = Guardado.datos;
    this.sel = Math.min(d.desbloqueado, NIVELES.length - 1);
    Musica.tocar('mapa');
  }

  actualizar(dt) {
    this.t += dt;
    const d = Guardado.datos;
    if (Entrada.pulso('ArrowDown', 'KeyS')) { this.sel = Math.min(d.desbloqueado, this.sel + 1); Sonido.efecto('menu'); }
    if (Entrada.pulso('ArrowUp', 'KeyW')) { this.sel = Math.max(0, this.sel - 1); Sonido.efecto('menu'); }
    if (Entrada.pulso('Enter', 'Space')) this.jugar();
    if (Entrada.pulso('Escape')) { Sonido.efecto('atras'); App.ir('titulo'); }
  }

  jugar() { Sonido.efecto('aceptar'); App.ir('juego', { nivel: this.sel }); }

  dibujar(g) {
    const W = App.W, H = App.H, d = Guardado.datos;
    const tema = NIVELES[this.sel].tema === 'nucleo' ? 'torre' : NIVELES[this.sel].tema;
    ciudadMenu(g, tema, this.t * 20, H * 0.62, this.t);
    g.fillStyle = 'rgba(8,6,24,0.45)'; g.fillRect(0, 0, W, H);
    textoNeon(g, 'SECTOR 7', 10, 14, { esc: 2 });
    texto(g, 'MAPA DE MISIONES', 12, 34, COL.gris, { fuente: 'mini' });
    UI.icono(g, 'chip', W - 64, 10, COL.amarillo);
    texto(g, String(d.chips).padStart(4, '0'), W - 10, 10, COL.amarillo, { alin: 'der', borde: '#0a0814' });
    const fotos = d.fotos.reduce((a, b) => a + contarBits(b), 0);
    UI.icono(g, 'foto', W - 64, 22, COL.crema);
    texto(g, fotos + '/12', W - 10, 22, COL.crema, { alin: 'der', borde: '#0a0814' });

    const pie = 74;
    const area = H - 46 - pie;
    const rh = clamp(Math.floor(area / NIVELES.length) - 4, 24, 62);
    const top = 46 + Math.max(0, Math.floor((area - NIVELES.length * (rh + 4)) / 2));
    const lx = 10, lw = W - 20;
    // línea de conexión
    rect(g, lx + 13, top + rh / 2, 2, (NIVELES.length - 1) * (rh + 4), '#2a6a8a');
    NIVELES.forEach((n, i) => {
      const y = top + i * (rh + 4);
      const bloq = i > d.desbloqueado;
      const sel = i === this.sel;
      const r = { x: lx, y, w: lw, h: rh };
      const color = bloq ? '#3a3660' : sel ? COL.amarillo : COL.cian;
      UI.marco(g, lx + 28, y, lw - 28, rh, color, sel ? 'rgba(40,30,10,0.9)' : 'rgba(10,8,28,0.88)');
      circulo(g, lx + 14, y + rh / 2, 11, color);
      circulo(g, lx + 14, y + rh / 2, 9, '#0a0814');
      if (bloq) UI.icono(g, 'candado', lx + 12, y + rh / 2 - 2, '#6a6690');
      else texto(g, String(i + 1), lx + 15, y + rh / 2 - 3, color, { alin: 'centro' });
      const tx = lx + 36;
      texto(g, bloq ? '???' : n.nombre, tx, y + 6, bloq ? '#4a4670' : COL.crema);
      if (!bloq) {
        if (n.jefe) texto(g, 'JEFE: DR. CRONOS', tx, y + 16, COL.magenta, { fuente: 'mini' });
        else {
          for (let k = 0; k < 3; k++) {
            const on = (d.fotos[i] >> k) & 1;
            g.globalAlpha = on ? 1 : 0.25;
            g.drawImage(SPR.foto, tx + k * 16, y + 15, 10, 10);
            g.globalAlpha = 1;
          }
        }
        if (rh >= 44) texto(g, envolver(n.mision.replace('SECTOR 7 – ', ''), lw - 60, 'mini')[0], tx, y + rh - 11, COL.gris, { fuente: 'mini' });
        if (d.completado[i]) {
          texto(g, '✓', lx + lw - 10, y + 6, COL.verde, { alin: 'der' });
          if (rh >= 30 && d.tiempos[i]) texto(g, formatoTiempo(d.tiempos[i]), lx + lw - 10, y + rh - 10, COL.gris, { alin: 'der', fuente: 'mini' });
        }
      }
      if (!bloq && Entrada.tocado(r)) {
        if (this.sel === i) this.jugar();
        else { this.sel = i; Sonido.efecto('menu'); }
      } else if (bloq && Entrada.tocado(r)) Sonido.efecto('error');
    });
    // detalle y botones
    const n = NIVELES[this.sel];
    texto(g, n.mision, W / 2, H - pie + 6, COL.gris, { alin: 'centro', fuente: 'mini' });
    const bw = Math.floor((W - 30) / 3);
    if (UI.boton(g, { x: 10, y: H - pie + 18, w: W - 20, h: 26 }, '▶ JUGAR MISIÓN ' + (this.sel + 1), { color: COL.verde, sel: true })) this.jugar();
    if (UI.boton(g, { x: 10, y: H - 26, w: bw, h: 20 }, 'MENÚ', { color: COL.magenta })) { Sonido.efecto('atras'); App.ir('titulo'); }
    if (UI.boton(g, { x: 15 + bw, y: H - 26, w: bw, h: 20 }, 'TALLER', { color: COL.amarillo })) { Sonido.efecto('aceptar'); App.ir('taller'); }
    if (UI.boton(g, { x: 20 + bw * 2, y: H - 26, w: bw, h: 20 }, 'OPCIONES')) { Sonido.efecto('aceptar'); App.ir('opciones', { volver: 'mapa' }); }
  }
}

/* ======================= TALLER ===================================== */
class EscenaTaller {
  entrar() { this.t = 0; this.msg = null; }
  actualizar(dt) {
    this.t += dt;
    if (this.msg) { this.msg.vida -= dt; if (this.msg.vida <= 0) this.msg = null; }
    if (Entrada.pulso('Escape')) { Sonido.efecto('atras'); App.ir('mapa'); }
  }
  dibujar(g) {
    const W = App.W, H = App.H, d = Guardado.datos;
    fondoMenu(g);
    textoNeon(g, 'TALLER', 10, 14, { esc: 2, c1: '#fff1b8', c2: '#ffa94d' });
    texto(g, 'MEJORA A TODA LA FAMILIA', 12, 34, COL.gris, { fuente: 'mini' });
    UI.icono(g, 'chip', W - 64, 12, COL.amarillo);
    texto(g, String(d.chips).padStart(4, '0'), W - 10, 12, COL.amarillo, { alin: 'der' });
    // la familia en fila
    for (let i = 0; i < 4; i++) {
      const s = SPR.pj[PERSONAJES[i].id].quieto[Math.floor(this.t * 2 + i) % 2];
      g.drawImage(s.d, W / 2 - 68 + i * 34, 40);
    }
    const top = 86, rh = clamp(Math.floor((H - top - 40) / 4) - 6, 40, 62);
    MEJORAS.forEach((m, i) => {
      const y = top + i * (rh + 6);
      const nivel = d.mejoras[m.k], max = m.costos.length;
      UI.marco(g, 8, y, W - 16, rh, m.color);
      UI.icono(g, m.icono, 16, y + 8, m.color);
      texto(g, m.nombre, 28, y + 8, COL.crema);
      envolver(m.desc, W - 120, 'mini').forEach((l, k) => texto(g, l, 16, y + 20 + k * 7, COL.gris, { fuente: 'mini' }));
      for (let k = 0; k < max; k++) rect(g, 16 + k * 10, y + rh - 10, 8, 4, k < nivel ? m.color : '#2a2645');
      const r = { x: W - 92, y: y + rh / 2 - 12, w: 80, h: 24 };
      if (nivel >= max) texto(g, 'MÁXIMO', r.x + r.w / 2, r.y + 9, COL.verde, { alin: 'centro' });
      else {
        const costo = m.costos[nivel];
        const puede = d.chips >= costo;
        if (UI.boton(g, r, '◆ ' + costo, { color: puede ? COL.amarillo : '#5a5670', colorTexto: puede ? COL.crema : '#7a7690' })) {
          if (puede) {
            d.chips -= costo; d.mejoras[m.k]++;
            Guardado.guardar();
            Sonido.efecto('comprar'); vibrar(30);
            this.msg = { t: '¡' + m.nombre + ' MEJORADA!', vida: 1.6 };
          } else { Sonido.efecto('error'); this.msg = { t: 'TE FALTAN CHIPS. ¡JUEGA MISIONES!', vida: 1.6 }; }
        }
      }
    });
    if (this.msg) texto(g, this.msg.t, W / 2, H - 46, COL.amarillo, { alin: 'centro', borde: '#0a0814' });
    if (UI.boton(g, { x: 10, y: H - 32, w: W - 20, h: 24 }, '◀ VOLVER AL MAPA', { color: COL.cian })) { Sonido.efecto('atras'); App.ir('mapa'); }
  }
}

/* ======================= OPCIONES =================================== */
function pantallaCompleta(on) {
  try {
    const el = document.documentElement;
    if (on && !document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: 'hide' }).then(() => {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
      }).catch(() => {});
    } else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch (e) { /* no disponible */ }
}

class EscenaOpciones {
  entrar(p) { this.volver = p.volver || 'titulo'; this.t = 0; this.borrar = false; }
  actualizar(dt) { this.t += dt; if (Entrada.pulso('Escape')) this.salir(); }
  salir() {
    Opciones.guardar();
    Sonido.efecto('atras');
    if (typeof this.volver === 'string') App.ir(this.volver);
    else App.volverA(this.volver);
  }
  dibujar(g) {
    const W = App.W, H = App.H;
    fondoMenu(g);
    textoNeon(g, 'OPCIONES', W / 2, 18, { esc: 2, alin: 'centro' });
    const x0 = 12, w = W - 24;
    let y = 48;
    const fila = (et) => { UI.marco(g, x0, y, w, 30, '#3a4a8a'); texto(g, et, x0 + 10, y + 11, COL.crema); };
    const volumen = (et, k) => {
      fila(et);
      const bx = x0 + w - 128;
      if (UI.boton(g, { x: bx, y: y + 4, w: 22, h: 22 }, '-')) { Opciones[k] = clamp(Math.round((Opciones[k] - 0.1) * 10) / 10, 0, 1); Sonido.volumen(); Sonido.efecto('menu'); Opciones.guardar(); }
      UI.barra(g, bx + 26, y + 11, 52, 8, Opciones[k], COL.cian);
      texto(g, Math.round(Opciones[k] * 10), bx + 90, y + 11, COL.cian, { alin: 'centro' });
      if (UI.boton(g, { x: bx + 100, y: y + 4, w: 22, h: 22 }, '+')) { Opciones[k] = clamp(Math.round((Opciones[k] + 0.1) * 10) / 10, 0, 1); Sonido.volumen(); Sonido.efecto('menu'); Opciones.guardar(); }
      y += 36;
    };
    const alternar = (et, valor, txt, accion) => {
      fila(et);
      if (UI.boton(g, { x: x0 + w - 90, y: y + 4, w: 82, h: 22 }, txt, { color: valor ? COL.verde : '#8a8fb0' })) { accion(); Sonido.efecto('menu'); Opciones.guardar(); }
      y += 36;
    };
    volumen('MÚSICA', 'musica');
    volumen('EFECTOS', 'efectos');
    alternar('VIBRACIÓN', Opciones.vibracion, Opciones.vibracion ? 'SÍ' : 'NO', () => { Opciones.vibracion = !Opciones.vibracion; vibrar(60); });
    alternar('BOTONES', Opciones.botones > 1, Opciones.botones > 1 ? 'GRANDES' : 'NORMALES', () => { Opciones.botones = Opciones.botones > 1 ? 1 : 1.25; });
    alternar('PANTALLA COMPLETA', !!document.fullscreenElement, document.fullscreenElement ? 'SÍ' : 'NO', () => { Opciones.completa = !document.fullscreenElement; pantallaCompleta(Opciones.completa); });
    // controles
    UI.marco(g, x0, y, w, 64, '#2a3a6a', 'rgba(10,8,28,0.7)');
    texto(g, 'CONTROLES', x0 + 10, y + 7, COL.cian, { fuente: 'mini' });
    const ayuda = ['◀ ▶ MOVER   A SALTAR   B ATACAR', '★ PODER ESPECIAL   ⇄ CAMBIAR PERSONAJE', 'TECLADO: FLECHAS, ESPACIO, X, C, Q, 1-4'];
    ayuda.forEach((l, i) => texto(g, l, x0 + 10, y + 18 + i * 13, COL.blanco, { fuente: 'mini' }));
    y += 72;
    if (typeof this.volver === 'string' && Guardado.hay()) {
      if (UI.boton(g, { x: x0, y, w, h: 24 }, this.borrar ? '¿SEGURO? TOCA OTRA VEZ' : 'BORRAR PROGRESO', { color: COL.rojo })) {
        if (this.borrar) { Guardado.borrar(); this.borrar = false; Sonido.efecto('derrota'); if (this.volver === 'mapa') this.volver = 'titulo'; }
        else { this.borrar = true; Sonido.efecto('error'); }
      }
      y += 30;
    }
    if (UI.boton(g, { x: x0, y: Math.max(y, H - 34), w, h: 26 }, '◀ VOLVER', { color: COL.cian, sel: true })) this.salir();
  }
}

/* ======================= CRÉDITOS =================================== */
class EscenaCreditos {
  entrar() {
    this.t = 0;
    this.lineas = [
      ['t', 'AVENTURA'], ['t', 'FAMILIAR'], ['', ''],
      ['s', 'PROTAGONISTAS'],
      ['c', 'joshua'], ['n', 'JOSHUA ALVARADO ARAUJO'], ['m', 'FUERZA DE POZOLE'], ['', ''],
      ['c', 'jacob'], ['n', 'JACOB ALVARADO ARAUJO'], ['m', 'SIGILO VELOZ'], ['', ''],
      ['c', 'jazzlyn'], ['n', 'JAZZLYN LECHUGA LÓPEZ'], ['m', 'LUZ DE DESEO'], ['', ''],
      ['c', 'randy'], ['n', 'RANDY ALVARADO ARAUJO'], ['m', 'CRONO-ATAQUE'], ['', ''],
      ['s', 'IDEA Y DIRECCIÓN'], ['n', 'RANDY ALVARADO ARAUJO'], ['', ''],
      ['s', 'PROGRAMACIÓN, MÚSICA Y PIXEL ART'], ['n', 'HECHO CON CLAUDE CODE'], ['', ''],
      ['s', 'INSPIRACIÓN VISUAL'], ['n', 'AVENTURA DE 8 BITS'], ['', ''],
      ['s', 'VILLANO'], ['n', 'DR. CRONOS Y CHRONO-CORP'], ['', ''],
      ['s', 'RECETA SECRETA'], ['n', 'EL POZOLE DE LA FAMILIA'], ['', ''], ['', ''],
      ['t2', 'GRACIAS POR JUGAR'], ['', ''], ['m', '¡LA FAMILIA ES LO MÁS IMPORTANTE!'],
    ];
    Musica.tocar('final');
  }
  actualizar(dt) {
    this.t += dt;
    if (Entrada.algunToque() || Entrada.pulso('Escape', 'Enter', 'Space')) { Sonido.efecto('atras'); App.ir('titulo'); }
  }
  dibujar(g) {
    const W = App.W, H = App.H;
    ciudadMenu(g, 'neon', this.t * 18, H * 0.8, this.t);
    g.fillStyle = 'rgba(8,6,24,0.6)'; g.fillRect(0, 0, W, H);
    let y = H - this.t * 24;
    for (const [tipo, txt] of this.lineas) {
      if (y > -60 && y < H + 40) {
        if (tipo === 't') textoNeon(g, txt, W / 2, y, { esc: 3, alin: 'centro' });
        else if (tipo === 't2') textoNeon(g, txt, W / 2, y, { esc: 2, alin: 'centro', c1: '#fff1b8', c2: '#ffa94d' });
        else if (tipo === 's') texto(g, txt, W / 2, y, COL.cian, { alin: 'centro' });
        else if (tipo === 'n') texto(g, txt, W / 2, y, COL.crema, { alin: 'centro' });
        else if (tipo === 'm') texto(g, txt, W / 2, y, COL.amarillo, { alin: 'centro', fuente: 'mini' });
        else if (tipo === 'c') {
          rect(g, W / 2 - 17, y - 1, 34, 34, PERSONAJES[IDX_PJ[txt]].color);
          dibujarSuave(g, IMG['cara_' + txt], 0, 0, 96, 96, W / 2 - 16, y, 32, 32);
        }
      }
      y += tipo === 'c' ? 38 : tipo === 't' ? 30 : 13;
    }
    if (y < -20) this.t = 0;
    texto(g, 'TOCA PARA VOLVER', W / 2, H - 10, COL.gris, { alin: 'centro', fuente: 'mini' });
  }
}

/* ======================= FINAL ====================================== */
class EscenaFinal {
  entrar() {
    this.t = 0; this.fuegos = [];
    Musica.tocar('final');
  }
  actualizar(dt) {
    this.t += dt;
    if (Math.random() < dt * 2.5) {
      const x = rnd(20, App.W - 20), y = rnd(30, App.H * 0.45), c = elegir([COL.cian, COL.magenta, COL.amarillo, COL.verde, '#ff8ad8']);
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        this.fuegos.push({ x, y, vx: Math.cos(a) * rnd(40, 70), vy: Math.sin(a) * rnd(40, 70), vida: 1.3, c });
      }
      Sonido.efecto('explosion');
    }
    for (const f of this.fuegos) { f.vida -= dt; f.vy += 40 * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    this.fuegos = this.fuegos.filter((f) => f.vida > 0);
  }
  dibujar(g) {
    const W = App.W, H = App.H, d = Guardado.datos;
    dibujarCubrir(g, IMG.escena, 0, 0, W, H, 0.55);
    g.fillStyle = 'rgba(8,6,24,0.45)'; g.fillRect(0, 0, W, H);
    for (const f of this.fuegos) { g.globalAlpha = clamp(f.vida, 0, 1); rect(g, Math.round(f.x), Math.round(f.y), 2, 2, f.c); }
    g.globalAlpha = 1;
    const y0 = H * 0.16;
    textoNeon(g, '¡FIN!', W / 2, y0, { esc: 5, alin: 'centro', c1: '#fff1b8', c2: '#ffa94d' });
    texto(g, 'EL MICROCHIP DEL TIEMPO ESTÁ A SALVO', W / 2, y0 + 50, COL.cian, { alin: 'centro', fuente: 'mini', borde: '#0a0814' });
    // la familia celebrando
    for (let i = 0; i < 4; i++) {
      const s = SPR.pj[PERSONAJES[i].id].victoria[0];
      const salto = Math.abs(Math.sin(this.t * 4 + i)) * 8;
      g.drawImage(i % 2 ? s.i : s.d, W / 2 - 70 + i * 36, Math.round(y0 + 64 - salto));
    }
    g.drawImage(SPR.microchip, W / 2 - 9, y0 + 112);
    const fotos = d ? d.fotos.reduce((a, b) => a + contarBits(b), 0) : 0;
    UI.marco(g, W / 2 - 100, y0 + 140, 200, 46, COL.amarillo);
    texto(g, 'FOTOS FAMILIARES: ' + fotos + '/12', W / 2, y0 + 150, COL.crema, { alin: 'centro' });
    texto(g, fotos >= 12 ? '¡ÁLBUM COMPLETO! ERES UNA LEYENDA' : 'VUELVE A LAS MISIONES PARA COMPLETAR EL ÁLBUM', W / 2, y0 + 166, COL.amarillo, { alin: 'centro', fuente: 'mini' });
    if (this.t > 2) {
      const bw = Math.min(200, W - 40);
      if (UI.boton(g, { x: (W - bw) / 2, y: H - 70, w: bw, h: 26 }, 'CRÉDITOS', { color: COL.cian })) { Sonido.efecto('aceptar'); App.ir('creditos'); }
      if (UI.boton(g, { x: (W - bw) / 2, y: H - 38, w: bw, h: 26 }, 'MENÚ PRINCIPAL', { color: COL.magenta })) { Sonido.efecto('atras'); App.ir('titulo'); }
    }
  }
}
