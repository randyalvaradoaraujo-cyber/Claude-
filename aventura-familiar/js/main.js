'use strict';
/* =====================================================================
   AVENTURA FAMILIAR — main.js
   Arranque, escalado a la pantalla del teléfono, bucle principal
   y transiciones entre escenas.
   ===================================================================== */

const App = {
  W: 270, H: 480, g: null, lienzo: null,
  escena: null, escenas: {}, fundido: null,

  ir(nombre, params = {}) {
    if (this.fundido) return;
    this.fundido = { fase: 'sale', t: 0, nombre, params };
  },

  volverA(escena) {
    if (this.fundido) return;
    this.fundido = { fase: 'sale', t: 0, objeto: escena };
  },

  cambiarYa(nombre, params = {}) {
    this.escena = this.escenas[nombre];
    this.escena.entrar(params);
  },
};

// El lienzo ocupa la pantalla menos las zonas seguras (muesca, barras);
// la resolución interna mantiene unos 270 px en el lado corto.
function ajustarPantalla() {
  const cv = App.lienzo;
  const r = cv.getBoundingClientRect();
  const cw = r.width || window.innerWidth, ch = r.height || window.innerHeight;
  const corto = Math.max(1, Math.min(cw, ch));
  const esc = corto / 270;
  App.W = Math.max(200, Math.round(cw / esc));
  App.H = Math.max(200, Math.round(ch / esc));
  cv.width = App.W;
  cv.height = App.H;
  App.g.imageSmoothingEnabled = false;
  Entrada.W = App.W;
  Entrada.H = App.H;
}

function iniciarApp() {
  const cv = document.getElementById('juego');
  App.lienzo = cv;
  App.g = cv.getContext('2d', { alpha: false });
  ajustarPantalla();
  window.addEventListener('resize', ajustarPantalla);
  window.addEventListener('orientationchange', () => setTimeout(ajustarPantalla, 200));
  Entrada.iniciar(cv);
  Opciones.cargar();
  Guardado.cargar();

  App.escenas = {
    carga: new EscenaCarga(),
    titulo: new EscenaTitulo(),
    intro: new EscenaIntro(),
    mapa: new EscenaMapa(),
    taller: new EscenaTaller(),
    opciones: new EscenaOpciones(),
    creditos: new EscenaCreditos(),
    final: new EscenaFinal(),
    juego: new EscenaJuego(),
  };
  App.cambiarYa('carga');

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && App.escena === App.escenas.juego) App.escena.pausar();
  });

  let ultimo = performance.now();
  const bucle = (ahora) => {
    const dt = Math.min(0.05, Math.max(0, (ahora - ultimo) / 1000));
    ultimo = ahora;
    const f = App.fundido;
    if (f) {
      Entrada.toques.length = 0;
      Entrada.pulsadas.clear();
      f.t += dt;
      if (f.fase === 'sale' && f.t >= 0.22) {
        if (f.objeto) App.escena = f.objeto;
        else App.cambiarYa(f.nombre, f.params);
        f.fase = 'entra';
        f.t = 0;
      } else if (f.fase === 'entra' && f.t >= 0.22) App.fundido = null;
    }
    const g = App.g;
    try {
      if (App.escena) {
        if (!f || f.fase === 'entra') App.escena.actualizar(dt);
        App.escena.dibujar(g);
      }
    } catch (err) {
      console.error(err);
    }
    if (App.fundido) {
      const a = App.fundido.fase === 'sale' ? App.fundido.t / 0.22 : 1 - App.fundido.t / 0.22;
      g.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`;
      g.fillRect(0, 0, App.W, App.H);
    }
    Entrada.finFrame();
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && window.self === window.top) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

window.addEventListener('load', iniciarApp);
