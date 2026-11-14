// Interfaz de Campaña 29-N. Pinta las pantallas a partir del estado del motor (motor.js).
(function () {
  'use strict';

  const M = window.Motor;
  const D = window.DATOS;
  const P = D.PARTIDOS;
  const R = D.REGIONES;
  const MAPA = window.MAPA_PATHS;
  const RIDS = Object.keys(R);
  const JUG = D.JUGABLES;
  const CLAVE = 'mini-games:elecciones:partida';
  const CLAVE_VISTAS = 'mini-games:elecciones:vistas';
  const VERSION = 2;

  const $ = (s, el) => (el || document).querySelector(s);
  const app = $('.app');
  const pantalla = $('#pantalla');
  const modal = $('#modal');

  let S = null;
  let vista = 'inicio';
  const ui = { partido: null, escenario: null, sel: null, modoMapa: 'potencial', debateSel: null, debateObj: null, verDebate: false,
    oro: null, oroObj: null, noche: null, rec: null, timer: null };

  // ---------- Utilidades ----------

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (x, d) => (Math.round(x * Math.pow(10, d == null ? 1 : d)) / Math.pow(10, d == null ? 1 : d)).toFixed(d == null ? 1 : d).replace('.', ',');
  const signo = (x, d) => (x >= 0 ? '+' : '−') + num(Math.abs(x), d);
  const nombre = (p) => M.nombre(p);
  const color = (p) => P[p].color;
  const yo = () => S.jugador;
  const corto = (c) => R[c].corto || R[c].nombre;

  const almacen = {
    leer() { try { const t = localStorage.getItem(CLAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; } },
    guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { /* sin persistencia */ } },
    borrar() { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } },
    vistas() { try { return JSON.parse(localStorage.getItem(CLAVE_VISTAS)) || []; } catch (e) { return []; } },
    marcarVista(id) {
      try {
        const v = almacen.vistas().filter((x) => x !== id);
        v.push(id);
        localStorage.setItem(CLAVE_VISTAS, JSON.stringify(v.slice(-110)));
      } catch (e) { /* nada */ }
    },
  };

  function toast(txt) {
    const t = $('#toast');
    t.textContent = txt;
    t.classList.add('visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('visible'), 2200);
  }

  function vibrar(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* nada */ } }

  function abrirModal(html) {
    $('#modal-cuerpo').innerHTML = html;
    if (typeof modal.showModal === 'function') { if (!modal.open) modal.showModal(); } else modal.setAttribute('open', '');
  }

  function cerrarModal() {
    if (typeof modal.close === 'function') modal.close();
    else modal.removeAttribute('open');
  }

  function arriba() { window.scrollTo(0, 0); }

  // Durante el veto de encuestas, los datos se ven como fruta (Andorra) o no se ven (niebla).
  function modoDatos() {
    if (!S || S.fase === 'final') return 'normal';
    if (S.dia < M.CONFIG.DIA_VETO) return 'normal';
    return S.flags.andorra ? 'andorra' : 'niebla';
  }

  function etiqueta(p, modo) {
    if ((modo || modoDatos()) === 'andorra') return P[p].frutaIcono + ' ' + P[p].fruta;
    return nombre(p);
  }

  function puntoColor(p) { return '<i class="punto" style="background:' + color(p) + '"></i>'; }

  function chipsHTML(chips, vacio) {
    if (!chips || !chips.length) return vacio === false ? '' : '<p class="nota">Sin efectos visibles. De momento.</p>';
    return '<ul class="chips">' + chips.map((c) => '<li class="chip ' + (c.signo > 0 ? 'bien' : c.signo < 0 ? 'mal' : '') + '">' +
      (c.p ? puntoColor(c.p) : '') + esc(c.txt) + '</li>').join('') + '</ul>';
  }

  // ---------- Retratos de los personajes fijos (SVG) ----------

  const RETRATOS = [
    [/gur[úu]|exjefe/i, { fondo: '#6d1f3a', piel: '#e8b48c', pelo: '#2b2118', estilo: 'engominado', barba: true, ropa: '#7a1034', solapa: true }],
    [/vane/i, { fondo: '#f2b632', piel: '#f0c2a2', pelo: '#5a2d82', estilo: 'mono', cascos: true, ropa: '#222' }],
    [/tesorero|tribunal de cuentas/i, { fondo: '#8fa3ad', piel: '#f1c9a5', pelo: '#777', estilo: 'calvo', gafas: true, sudor: true, ropa: '#4a5560', corbata: '#9b2c2c' }],
    [/fontanero/i, { fondo: '#2f3b45', piel: '#d9a37a', pelo: '#1b1b1b', estilo: 'gorra', bigote: true, gafasSol: true, ropa: '#1f4e79' }],
    [/paco/i, { fondo: '#b5651d', piel: '#eab98f', pelo: '#f2f2f2', estilo: 'boina', bigote: true, canas: true, ropa: '#5b4636', bufanda: true }],
    [/periodista|reporter|corresponsal|tertuliano/i, { fondo: '#1f6f8b', piel: '#f3cfb3', pelo: '#a0522d', estilo: 'melena', micro: true, ropa: '#f5f5f5' }],
    [/n[ºo]2/i, { fondo: '#455a64', piel: '#e9b891', pelo: '#3b2a1a', estilo: 'raya', sonrisa: true, ropa: '#263238', corbata: 'partido' }],
    [/youtuber/i, { fondo: '#111', piel: '#e3ab82', pelo: '#3a2a1c', estilo: 'gorra', barba: true, cascos: true, ropa: '#e53935' }],
    [/bar[óo]n|alcalde|empresari|constructor|club/i, { fondo: '#37474f', piel: '#e2a77d', pelo: '#9e9e9e', estilo: 'raya', gafas: true, ropa: '#1b2530', corbata: '#c9a227', puro: true }],
  ];

  function retrato(quien, icono) {
    const r = RETRATOS.find((x) => x[0].test(quien || ''));
    if (!r) return '<div class="retrato emoji" aria-hidden="true">' + (icono || '🗞️') + '</div>';
    const c = r[1];
    const partido = S ? color(yo()) : '#c8102e';
    const corbata = c.corbata === 'partido' ? partido : c.corbata;
    let s = '<svg class="retrato" viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="rc"><circle cx="32" cy="32" r="31"/></clipPath></defs>' +
      '<circle cx="32" cy="32" r="31" fill="' + c.fondo + '"/><g clip-path="url(#rc)">';
    s += '<path d="M8 66c0-14 10-20 24-20s24 6 24 20z" fill="' + c.ropa + '"/>';
    if (c.solapa) s += '<path d="M24 47l8 9 8-9-3 14H27z" fill="#f4efe6"/>';
    if (corbata) s += '<path d="M30 47h4l2 4-4 13-4-13z" fill="' + corbata + '"/>';
    if (c.bufanda) s += '<path d="M19 46c8 6 18 6 26 0v6c-8 5-18 5-26 0z" fill="' + partido + '"/>';
    s += '<rect x="27" y="38" width="10" height="10" rx="4" fill="' + c.piel + '"/>';
    if (c.estilo === 'melena') s += '<path d="M15 30c0-13 7-19 17-19s17 6 17 19v14H42V28H22v16H15z" fill="' + c.pelo + '"/>';
    s += '<circle cx="32" cy="28" r="13" fill="' + c.piel + '"/>';
    if (c.estilo === 'engominado') s += '<path d="M19 26c0-9 6-14 13-14s13 5 13 14c-3-6-8-8-13-8s-10 2-13 8z" fill="' + c.pelo + '"/>';
    if (c.estilo === 'raya') s += '<path d="M19 27c-1-10 6-15 13-15s14 4 13 15c-2-5-5-8-9-8-6 0-12 2-17 8z" fill="' + c.pelo + '"/>';
    if (c.estilo === 'mono') s += '<circle cx="32" cy="10" r="6" fill="' + c.pelo + '"/><path d="M19 27c0-9 6-14 13-14s13 5 13 14c-4-5-8-7-13-7s-9 2-13 7z" fill="' + c.pelo + '"/>';
    if (c.estilo === 'melena') s += '<path d="M19 27c0-9 6-14 13-14s13 5 13 14c-5-4-9-6-13-6s-8 2-13 6z" fill="' + c.pelo + '"/>';
    if (c.estilo === 'calvo') s += '<path d="M19 30c0-3 1-5 2-6v6zM45 30c0-3-1-5-2-6v6z" fill="' + c.pelo + '"/><ellipse cx="27" cy="19" rx="4" ry="2" fill="#fff" opacity=".35"/>';
    if (c.estilo === 'gorra') s += '<path d="M18 24c0-9 6-13 14-13s14 4 14 13z" fill="' + c.ropa + '"/><path d="M40 21h14c1 0 1 4-1 4H40z" fill="' + c.ropa + '" opacity=".85"/>';
    if (c.estilo === 'boina') s += '<ellipse cx="31" cy="17" rx="15" ry="6" fill="#1c1c1c"/><rect x="30" y="9" width="2" height="4" fill="#1c1c1c"/>';
    if (c.canas) s += '<path d="M19 29c0-3 1-6 3-8v9zM45 29c0-3-1-6-3-8v9z" fill="' + c.pelo + '"/>';
    s += '<circle cx="27" cy="28" r="1.6" fill="#1d1b17"/><circle cx="37" cy="28" r="1.6" fill="#1d1b17"/>';
    if (c.gafas) s += '<g fill="none" stroke="#1d1b17" stroke-width="1.6"><circle cx="27" cy="28" r="4.2"/><circle cx="37" cy="28" r="4.2"/><path d="M31.2 28h1.6"/></g>';
    if (c.gafasSol) s += '<path d="M21 25h22v4c0 3-3 4-5 4s-4-1-5-4h-2c-1 3-3 4-5 4s-5-1-5-4z" fill="#111"/>';
    if (c.barba) s += '<path d="M20 31c1 9 6 12 12 12s11-3 12-12c-3 3-7 4-12 4s-9-1-12-4z" fill="' + c.pelo + '"/>';
    if (c.bigote) s += '<path d="M25 35c3-3 5-2 7-1 2-1 4-2 7 1-3 1-5 1-7 0-2 1-4 1-7 0z" fill="' + (c.canas ? '#f2f2f2' : c.pelo) + '"/>';
    s += c.sonrisa ? '<path d="M26 34c3 5 9 5 12 0z" fill="#fff" stroke="#1d1b17" stroke-width="1"/>'
      : '<path d="M28 37c2 1.5 6 1.5 8 0" fill="none" stroke="#1d1b17" stroke-width="1.4" stroke-linecap="round"/>';
    if (c.cascos) s += '<path d="M17 30c0-11 6-17 15-17s15 6 15 17" fill="none" stroke="#111" stroke-width="3"/><rect x="14" y="26" width="6" height="10" rx="3" fill="#111"/><rect x="44" y="26" width="6" height="10" rx="3" fill="#111"/>';
    if (c.sudor) s += '<path d="M47 16c2 3 3 4 3 6a3 3 0 01-6 0c0-2 1-3 3-6zM15 22c1.5 2 2 3 2 4.500a2 2 0 01-4 0c0-1.500.5-2.500 2-4.500z" fill="#7fd3ff"/>';
    if (c.micro) s += '<rect x="46" y="40" width="5" height="12" rx="2.500" fill="#222"/><rect x="47.500" y="50" width="2" height="12" fill="#555"/>';
    if (c.puro) s += '<rect x="36" y="36" width="12" height="3" rx="1.500" fill="#6b3f1d"/><circle cx="48.500" cy="37.500" r="1.800" fill="#ff7043"/>';
    return s + '</g></svg>';
  }

  // ---------- Barra superior ----------

  function pintarBarra() {
    const barra = $('#barra');
    if (vista !== 'juego' || !S) { barra.hidden = true; app.style.removeProperty('--partido'); app.classList.remove('en-juego'); return; }
    barra.hidden = false;
    app.style.setProperty('--partido', color(yo()));
    app.classList.add('en-juego');
    const f = M.fecha(Math.min(S.dia, 21));
    const etapa = S.fase === 'final' ? 'Noche electoral' : S.dia === 21 ? 'Jornada de reflexión'
      : S.dia < M.CONFIG.DIA_CAMPANA ? 'Precampaña' : 'Campaña';
    $('#barra-dia').innerHTML = '<b>' + (S.fase === 'final' ? 'Domingo 29' : 'Día ' + S.dia + ' de 21') + '</b>' +
      esc(S.fase === 'final' ? etapa : f.semana + ' ' + f.dia + ' · ' + etapa);
    const m = S.met;
    const prom = S.promesas >= M.CONFIG.PROMESAS_DEBATE ? 2 : S.promesas >= M.CONFIG.PROMESAS_UMBRAL ? 1 : 0;
    $('#metros').innerHTML = [
      ['caja', '💶', 'Caja', m.caja < 12],
      ['animo', '🔥', 'Ánimo', m.animo < 20 || m.animo > 90],
      ['sospecha', '🕵️', 'Sospecha', m.sospecha > 75],
    ].map(([k, ic, t, al]) => '<button class="metro' + (al ? ' alerta' : '') + '" data-metro="' + k + '" title="' + t + '"><div><span>' + ic + '</span>' + m[k] + '</div><i style="width:' + m[k] + '%"></i></button>').join('') +
      '<button class="metro promesas' + (prom === 2 ? ' alerta' : '') + '" data-metro="promesas" title="Promesas"><div><span>📜</span>' +
      (S.promesas >= 1000 ? Math.round(S.promesas / 1000) + 'k' : S.promesas) + '</div><i style="width:' + Math.min(100, S.promesas / 1500) + '%"></i></button>';
    $('#btn-mano').textContent = '🃏 ' + S.mano.length;
  }

  function marcarPistas(pistas) {
    document.querySelectorAll('.metro').forEach((el) => {
      el.classList.toggle('pista', !!(pistas && pistas[el.dataset.metro]));
    });
  }

  const AYUDA_METRO = {
    caja: '<h2>💶 Caja</h2><p>Paga las opciones caras de las cartas y los <b>aviones</b> (12 por vuelo). Entra sola cada noche (+4), con cenas de recaudación y si tu nº2 pasa la gorra.</p>',
    animo: '<h2>🔥 Ánimo de las bases</h2><p>Multiplica todo lo que hace tu candidato (de ×0,6 a ×1,4). Sube cuando ganas escaños y con baños de masas. A 100, euforia peligrosa; a 0, desbandada.</p>',
    sospecha: '<h2>🕵️ Sospecha</h2><p>Sube con el juego sucio, los sobres y los amigos generosos. Baja sola un punto al día. Si llega a 100, <b>estalla el escándalo</b>: −2 puntos y el ánimo por los suelos.</p>',
    promesas: '<h2>📜 Promesas</h2><p>Todo lo que prometes se apunta. Con más de 80.000 M€ te sacan la calculadora en el debate (−1,5). Con menos de 15.000 M€ presumes de cuentas claras (+1). Y el domingo, lo que pase de 50.000 M€ te cuesta votos: los escépticos se quedan en casa.</p>',
  };

  // ---------- Mapa ----------

  function colorRegion(c, modo) {
    const v = S.reg[c].v;
    if (modo === 'yo') {
      const sh = v[yo()] / (100 - v.ind) * 100;
      return { fill: color(yo()), op: 0.12 + 0.88 * Math.min(1, sh / 40) };
    }
    const orden = D.TODOS.slice().sort((a, b) => v[b] - v[a]);
    const margen = (v[orden[0]] - v[orden[1]]) / (100 - v.ind) * 100;
    return { fill: color(orden[0]), op: 0.45 + 0.55 * Math.min(1, margen / 12) };
  }

  function posEtiqueta(c) {
    if (c === 'can') return [780, 765];
    if (c === 'cnt') return [MAPA[c].cx, MAPA[c].cy + 6];
    if (c === 'ceu') return [MAPA[c].cx - 30, MAPA[c].cy + 4];
    if (c === 'mel') return [MAPA[c].cx + 34, MAPA[c].cy + 4];
    return [MAPA[c].cx, MAPA[c].cy];
  }

  // opts: fill(c) → {fill, op} · clase(c) · sel · capa(c, [x, y]) → SVG extra por comunidad
  function mapaSVG(opts) {
    let s = '<svg viewBox="0 0 1000 860" role="img" aria-label="Mapa de España por comunidades">';
    s += '<rect class="marco" x="580" y="688" width="402" height="168" rx="10"/>';
    RIDS.forEach((c) => {
      const col = opts.fill(c);
      const cl = 'ca' + (opts.sel === c ? ' sel' : '') + (opts.clase ? ' ' + opts.clase(c) : '');
      const attrs = 'class="' + cl + '" data-ca="' + c + '" fill="' + col.fill + '" fill-opacity="' + col.op.toFixed(2) + '"';
      s += '<path ' + attrs + ' d="' + MAPA[c].d + '"><title>' + esc(R[c].nombre) + '</title></path>';
      if (c === 'ceu' || c === 'mel') s += '<circle ' + attrs + ' cx="' + MAPA[c].cx + '" cy="' + MAPA[c].cy + '" r="20"><title>' + esc(R[c].nombre) + '</title></circle>';
    });
    if (opts.capa) RIDS.forEach((c) => { s += opts.capa(c, posEtiqueta(c)); });
    return s + '</svg>';
  }

  const fillLider = (c) => colorRegion(c, 'lider');

  // ---------- Hemiciclo y tendencia ----------

  let asientos = null;
  function posicionesHemiciclo() {
    if (asientos) return asientos;
    const filas = 9, r0 = 92, r1 = 188, total = 350;
    const radios = [];
    for (let i = 0; i < filas; i++) radios.push(r0 + i * (r1 - r0) / (filas - 1));
    const suma = radios.reduce((a, b) => a + b, 0);
    const cuenta = radios.map((r) => Math.floor(total * r / suma));
    let resto = total - cuenta.reduce((a, b) => a + b, 0);
    for (let i = filas - 1; resto > 0; i--, resto--) cuenta[i]++;
    const pts = [];
    radios.forEach((r, i) => {
      for (let j = 0; j < cuenta[i]; j++) {
        const a = Math.PI - j * Math.PI / (cuenta[i] - 1);
        pts.push({ a, x: 200 + r * Math.cos(a), y: 200 - r * Math.sin(a) });
      }
    });
    pts.sort((p, q) => q.a - p.a);
    asientos = pts;
    return pts;
  }

  function hemicicloSVG(total) {
    const pts = posicionesHemiciclo();
    const asignados = D.TODOS.reduce((s, p) => s + total[p], 0);
    const orden = ['fa', 'psoe', 'otros', '_', 'pp', 'vox'];
    let s = '<svg viewBox="0 0 400 210" role="img" aria-label="Hemiciclo">';
    let i = 0;
    orden.forEach((p) => {
      const n = p === '_' ? 350 - asignados : total[p];
      for (let k = 0; k < n; k++, i++) {
        const q = pts[i];
        s += '<circle cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="4.6" ' + (p === '_' ? 'class="vacio"' : 'fill="' + color(p) + '"') + '/>';
      }
    });
    s += '<text class="mayoria" x="200" y="196">Mayoría: 176</text>';
    return s + '</svg>';
  }

  function filaEscanos(total, modo, ayer) {
    return '<div class="escanos-fila">' + D.ORDEN_HEMICICLO.map((p) => {
      const d = ayer ? total[p] - ayer[p] : 0;
      return '<span style="background:' + color(p) + '">' + esc(etiqueta(p, modo)) + ' ' + total[p] +
        (d ? '<small>' + (d > 0 ? '▲' : '▼') + Math.abs(d) + '</small>' : '') + '</span>';
    }).join('') + '</div>';
  }

  // Evolución de escaños de los cuatro partidos desde el día 0.
  function tendenciaSVG() {
    const h = S.historia;
    if (h.length < 2) return '';
    const W = 320, H = 92, x0 = 6, x1 = W - 40;
    let min = Infinity, max = -Infinity;
    h.forEach((d) => JUG.forEach((p) => { min = Math.min(min, d.esc[p]); max = Math.max(max, d.esc[p]); }));
    const X = (i) => x0 + (x1 - x0) * i / Math.max(1, h.length - 1);
    const Y = (v) => 8 + (H - 16) * (1 - (v - min) / Math.max(1, max - min));
    let s = '<svg class="tendencia" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolución de escaños">';
    JUG.forEach((p) => {
      const pts = h.map((d, i) => X(i).toFixed(1) + ',' + Y(d.esc[p]).toFixed(1)).join(' ');
      const fin = h[h.length - 1].esc[p];
      s += '<polyline points="' + pts + '" fill="none" stroke="' + color(p) + '" stroke-width="' + (p === yo() ? 3.2 : 1.8) + '" stroke-linejoin="round" stroke-linecap="round"' + (p === yo() ? '' : ' opacity=".85"') + '/>' +
        '<circle cx="' + X(h.length - 1) + '" cy="' + Y(fin) + '" r="' + (p === yo() ? 4 : 3) + '" fill="' + color(p) + '"/>' +
        '<text x="' + (x1 + 7) + '" y="' + (Y(fin) + 4) + '" fill="' + color(p) + '"' + (p === yo() ? ' font-weight="800"' : '') + '>' + fin + '</text>';
    });
    return s + '</svg>';
  }

  // ---------- Pantallas: inicio y elección ----------

  function pintarInicio() {
    const guardada = almacen.leer();
    const sirve = guardada && guardada.version === VERSION && guardada.fase !== 'final';
    pantalla.innerHTML =
      '<section class="cartel">' +
      '<div class="cartel-franjas" aria-hidden="true">' + ['fa', 'psoe', 'otros', 'pp', 'vox'].map((p) => '<span style="background:' + color(p) + '"></span>').join('') + '</div>' +
      '<div class="cartel-cuerpo">' +
      '<p class="cartel-ante">Elecciones generales · 29 de noviembre de 2026</p>' +
      '<h1 class="cartel-titulo">Campaña<br><em>29-N</em></h1>' +
      '<div class="cartel-urna" aria-hidden="true"><svg viewBox="0 0 120 96"><path d="M14 40h92l-8 50H22z" fill="var(--text)"/><rect x="8" y="30" width="104" height="14" rx="3" fill="var(--text)"/>' +
      '<rect x="42" y="34" width="36" height="5" rx="2.500" fill="var(--bg)"/><g class="papeleta"><rect x="46" y="2" width="28" height="36" rx="2" fill="#fff" stroke="var(--text)" stroke-width="2.500"/><path d="M52 12h16M52 19h16M52 26h9" stroke="var(--acento)" stroke-width="2.500" stroke-linecap="round"/></g>' +
      '<path d="M48 62l9 9 17-19" fill="none" stroke="var(--bg)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p class="cartel-lema">21 días, 350 escaños<br>y ni una pizca de vergüenza.</p>' +
      '<div class="menu-inicio">' +
      (sirve ? '<button class="boton primario" data-accion="continuar">Continuar · día ' + guardada.dia + ' · ' + esc(nombre(guardada.jugador)) + '</button>' : '') +
      '<button class="boton' + (sirve ? '' : ' primario') + '" data-accion="nueva">Nueva campaña</button>' +
      '<button class="boton" data-accion="ayuda">Cómo se juega</button>' +
      '</div>' +
      '<p class="nota">Sátira. Los partidos y candidatos son reales; los hechos, casi nunca. Todos reciben por igual.</p>' +
      '<a class="volver" href="../">&larr; Volver a Mini Juegos</a>' +
      '</div></section>';
  }

  function pintarEleccion() {
    const partidos = JUG.map((p) => '<button class="opcion-partido" style="--c:' + color(p) + '" data-partido="' + p + '" aria-pressed="' + (ui.partido === p) + '">' +
      '<b>' + esc(P[p].nombre) + '</b><small>' + esc(P[p].cand) + '</small><span class="pers">«' + esc(P[p].personalidad) + '»</span></button>').join('');
    const escenarios = Object.keys(D.ESCENARIOS).map((e) => {
      const E = D.ESCENARIOS[e];
      const barra = ['psoe', 'pp', 'vox', 'fa', 'otros'].map((p) => '<span style="background:' + color(p) + ';width:' + E.voto[p] + '%">' + (E.voto[p] >= 6 ? num(E.voto[p], 0) : '') + '</span>').join('');
      return '<button class="opcion-escenario" data-escenario="' + e + '" aria-pressed="' + (ui.escenario === e) + '"><b>' + esc(E.nombre) + '</b>' +
        '<p>' + esc(E.texto) + '</p><div class="barra-voto">' + barra + '</div><p class="nota" style="margin:6px 0 0">' + esc(E.fuente) + '</p></button>';
    }).join('');
    pantalla.innerHTML =
      '<div class="estrecha"><h1 class="titulo-pantalla">Nueva campaña</h1>' +
      '<p class="paso">1 · Elige partido</p><div class="rejilla">' + partidos + '</div>' +
      '<p class="paso" style="margin-top:16px">2 · Elige con qué encuesta empiezas</p>' + escenarios +
      '<div class="fila-botones"><button class="boton" data-accion="inicio">Volver</button>' +
      '<button class="boton primario" data-accion="empezar"' + (ui.partido && ui.escenario ? '' : ' disabled') + '>Empezar la campaña</button></div></div>';
  }

  // ---------- Portada del periódico ----------

  function pintarPortada() {
    const po = S.portada;
    const modo = po.modo;
    const t = po.esc.total;
    const deltas = (p) => {
      const d = t[p] - po.escAyer[p];
      return d > 0 ? ' <span class="sube">▲' + d + '</span>' : d < 0 ? ' <span class="baja">▼' + (-d) + '</span>' : '';
    };
    const ayer = {};
    po.mitinesAyer.filter((m) => m.rol === 'principal').forEach((m) => { (ayer[m.ca] = ayer[m.ca] || []).push(m.p); });
    const capa = (c, pos) => (ayer[c] || []).map((p, i) =>
      '<circle cx="' + (pos[0] - (ayer[c].length - 1) * 11 + i * 22) + '" cy="' + pos[1] + '" r="12" fill="' + color(p) + '" stroke="#fff" stroke-width="3"/>').join('');
    let datos;
    if (modo === 'niebla') {
      const primero = M.lider(t, JUG);
      datos = '<div class="niebla">🌫️ Prohibido publicar encuestas.<br>Tu instinto dice que va primero ' + esc(M.el(primero)) + '. O no.</div>';
    } else {
      const orden = D.TODOS.slice().sort((a, b) => t[b] - t[a]);
      const cab = modo === 'andorra' ? '<tr><th>Mercado de frutas</th><th>€/kg</th><th>Cajas</th></tr>' : '<tr><th>Partido</th><th>Voto</th><th>Escaños</th></tr>';
      datos = '<div class="hemiciclo">' + hemicicloSVG(t) + filaEscanos(t, modo, po.escAyer) + '</div>' +
        '<p class="bloques">' + (modo === 'andorra' ? 'Cajas de arándano + melón' : 'PP + Vox') + ': <b>' + (t.pp + t.vox) + '</b> · ' +
        (modo === 'andorra' ? 'tomate + uva + macedonia' : 'PSOE + FA + otros') + ': <b>' + (t.psoe + t.fa + t.otros) + '</b> · Mayoría: 176</p>' +
        (S.historia.length > 2 ? '<div class="seccion">' + (modo === 'andorra' ? 'Cotización de la fruta' : 'Tendencia en escaños') + '</div>' + tendenciaSVG() : '') +
        '<details class="plegable"><summary>' + (modo === 'andorra' ? 'Precios en origen (Andorra)' : 'Encuesta completa') + '</summary>' +
        '<table class="tabla">' + cab + orden.map((p) => '<tr><td>' + puntoColor(p) + esc(etiqueta(p, modo)) + '</td><td>' + num(po.est[p]) + (modo === 'andorra' ? '' : ' %') + '</td><td>' + t[p] + deltas(p) + '</td></tr>').join('') +
        '<tr><td>Indecisos</td><td>' + num(po.est.ind) + ' %</td><td></td></tr></table></details>';
    }
    const breves = po.breves.slice(0, 5).map((n) => '<li>' + (n.p ? puntoColor(n.p) : '') + '<b>' + esc(n.titular) + '</b>' + (n.cuerpo ? ' ' + esc(n.cuerpo) : '') + '</li>').join('');
    pantalla.innerHTML =
      '<article class="periodico portada">' +
      '<header class="cabecera"><div class="nombre">' + esc(po.periodico) + '</div>' +
      '<div class="meta"><span>' + esc(po.fecha) + '</span><span>Día ' + po.dia + ' de 21</span><span>1,50 €</span></div></header>' +
      '<div class="col-a"><h1 class="titular">' + esc(po.titular.titular) + '</h1>' +
      (po.titular.cuerpo ? '<p class="entradilla">' + esc(po.titular.cuerpo) + '</p>' : '') +
      (breves ? '<div class="seccion">Breves</div><ul class="breves">' + breves + '</ul>' : '') + '</div>' +
      '<div class="col-b">' + datos +
      '<details class="plegable"' + (window.matchMedia('(min-width: 900px)').matches ? ' open' : '') + '><summary>Mapa: quién va primero</summary>' +
      '<div class="mapa" id="mapa-portada">' + mapaSVG({ fill: fillLider, capa }) + '</div>' +
      '<div class="leyenda"><span>Más intenso, más ventaja.</span>' + (po.mitinesAyer.length ? '<span>Puntos: dónde estuvo ayer cada candidato.</span>' : '') + '</div></details>' +
      '</div></article>' +
      '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="empezar-dia">' +
      (S.dia === 21 ? 'Pasar página: jornada de reflexión →' : 'Pasar página: las noticias del día →') + '</button></div>';
  }

  // ---------- Cartas ----------

  function pistasOpcion(op) {
    const r = M.resumenOpcion(S, op);
    let h = chipsHTML(r.fijo, false);
    if (r.prob != null) {
      h += '<div class="azar"><span class="dado">🎲 ' + r.prob + ' % de salir bien</span>' +
        '<div><small>Bien</small>' + (chipsHTML(r.bien, false) || '<span class="nota">—</span>') + '</div>' +
        '<div><small>Mal</small>' + (chipsHTML(r.mal, false) || '<span class="nota">—</span>') + '</div></div>';
    }
    return h || '<span class="nota">Sin efecto inmediato</span>';
  }

  function situacionHTML() {
    if (modoDatos() === 'niebla') return '<aside class="lado"><div class="niebla">🌫️ Sin encuestas hasta el domingo.</div></aside>';
    const t = M.escanos(S).total;
    return '<aside class="lado"><div class="seccion" style="border:0;margin:0">Así vas</div><div class="hemiciclo">' + hemicicloSVG(t) + filaEscanos(t, modoDatos()) + '</div>' +
      (S.historia.length > 2 ? tendenciaSVG() : '') +
      '<p class="nota">Tu candidato está en <b>' + esc(R[S.pos].nombre) + '</b>. En la mano: ' + S.mano.length + ' carta' + (S.mano.length === 1 ? '' : 's') + '.</p></aside>';
  }

  function pintarCartas() {
    const cur = M.cartaActual(S);
    if (!cur) { M.siguienteCarta(S); return render(); }
    const { inst, def } = cur;
    const ctx = inst.ctx;
    const T = (s) => esc(M.texto(S, s, ctx));
    const total = S.hoy.cartas.length;
    almacen.marcarVista(def.id);
    const saga = /\((I|II|III|IV|y III|y IV)\)$/.test(def.titulo);
    let cuerpo = '<header class="carta-quien">' + retrato(def.quien, def.icono) + '<div><small>' + (saga ? 'Continuará…' : def.req ? 'Por cómo va tu campaña' : def.dia ? 'Cita del calendario' : 'Te lo trae') + '</small><b>' + T(def.quien || '') + '</b></div>' +
      '<span class="carta-icono" aria-hidden="true">' + def.icono + '</span></header>' +
      '<h2>' + T(def.titulo) + '</h2><p>' + T(def.texto) + '</p>';
    let pie;
    if (inst.hecha) {
      const r = inst.resultado;
      const op = def[r.lado];
      const sello = r.exito === true ? '<span class="sello bien">Salió bien</span>' : r.exito === false ? '<span class="sello mal">Salió mal</span>' : '<span class="sello">Hecho</span>';
      cuerpo += '<div class="resultado">' + sello + '<div class="eleccion">Elegiste: ' + T(op.txt) + '</div>' +
        '<p>' + esc(r.texto) + '</p>' + chipsHTML(r.chips) + '</div>';
      pie = '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="siguiente-carta">' +
        (S.hoy.idx + 1 < total ? 'Siguiente carta →' : S.dia === 21 ? 'A la reflexión →' : 'Preparar la gira →') + '</button></div>';
    } else {
      cuerpo += '<div class="pista-lado a">← ' + T(def.a.txt) + '</div><div class="pista-lado b">' + T(def.b.txt) + ' →</div>';
      pie = '<div class="opciones">' + ['a', 'b'].map((l) => {
        const op = def[l];
        const puede = M.puedeElegir(S, op);
        return '<button class="opcion ' + l + '" data-lado="' + l + '"' + (puede ? '' : ' disabled') + '>' +
          '<span class="flecha">' + (l === 'a' ? '← desliza' : 'desliza →') + '</span>' +
          '<b>' + T(op.txt) + '</b>' + pistasOpcion(op) +
          (puede ? '' : '<span class="riesgo">Sin fondos</span>') + '</button>';
      }).join('') + '</div>';
    }
    pantalla.innerHTML = '<div class="dos-col"><div class="principal">' +
      '<p class="contador">Noticias del día · ' + (S.hoy.idx + 1) + ' de ' + total + '</p>' +
      '<div class="mesa"><div class="carta' + (inst.hecha ? ' resuelta' : '') + '" id="carta">' + cuerpo + '</div></div>' + pie +
      '</div>' + situacionHTML() + '</div>';
    if (!inst.hecha) activarArrastre(def);
  }

  function elegir(lado) {
    const r = M.elegirOpcion(S, lado);
    if (!r) { toast('No tienes caja para eso'); return; }
    vibrar(r.exito === false ? [30, 60, 30] : 18);
    marcarPistas(null);
    almacen.guardar();
    render();
  }

  function activarArrastre(def) {
    const carta = $('#carta');
    if (!carta) return;
    let x0 = null, dx = 0, id = null;
    const pistaA = $('.pista-lado.a', carta), pistaB = $('.pista-lado.b', carta);
    const mostrar = () => {
      carta.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 18) + 'deg)';
      const lado = dx < -20 ? 'a' : dx > 20 ? 'b' : null;
      pistaA.style.opacity = lado === 'a' ? Math.min(1, -dx / 90) : 0;
      pistaB.style.opacity = lado === 'b' ? Math.min(1, dx / 90) : 0;
      document.querySelectorAll('.opcion').forEach((b) => b.classList.toggle('activa', b.dataset.lado === lado));
      marcarPistas(lado ? M.pistas(def[lado]) : null);
    };
    carta.addEventListener('pointerdown', (e) => {
      x0 = e.clientX; dx = 0; id = e.pointerId;
      carta.classList.add('arrastrando');
      carta.setPointerCapture(id);
    });
    carta.addEventListener('pointermove', (e) => {
      if (x0 === null || e.pointerId !== id) return;
      dx = e.clientX - x0;
      mostrar();
    });
    const soltar = (e) => {
      if (x0 === null || e.pointerId !== id) return;
      carta.classList.remove('arrastrando');
      const lado = dx < -90 ? 'a' : dx > 90 ? 'b' : null;
      x0 = null;
      if (lado && M.puedeElegir(S, def[lado])) {
        carta.style.transform = 'translateX(' + (lado === 'a' ? -600 : 600) + 'px) rotate(' + (lado === 'a' ? -25 : 25) + 'deg)';
        setTimeout(() => elegir(lado), 180);
      } else {
        if (lado) toast('No tienes caja para eso');
        dx = 0; mostrar();
        carta.style.transform = '';
      }
    };
    carta.addEventListener('pointerup', soltar);
    carta.addEventListener('pointercancel', soltar);
    document.querySelectorAll('.opcion').forEach((b) => {
      const l = b.dataset.lado;
      b.addEventListener('pointerenter', () => marcarPistas(M.pistas(def[l])));
      b.addEventListener('pointerleave', () => marcarPistas(null));
    });
  }

  // ---------- La gira (agenda) ----------

  const ALCANCE = { aqui: 'Estás aquí', vecina: 'Vecina · viaje gratis', avion: 'Lejos · avión' };

  function mejorPrevision(c) {
    let mejor = 0;
    ['mitin', 'puerta'].forEach((a) => { mejor = Math.max(mejor, M.prever(S, c, a, S.agenda.tactica).g); });
    return mejor;
  }

  function datosAgenda() {
    const niebla = modoDatos() === 'niebla';
    const d = {};
    let max = 0;
    RIDS.forEach((c) => {
      const v = S.reg[c].v;
      const pv = M.prever(S, c, 'mitin', null);
      const valor = R[c].escanos * pv.g / (100 - v.ind);
      const u = niebla ? { sube: null, baja: null } : M.umbral(S, c);
      const mejor = mejorPrevision(c);
      d[c] = { valor, u, tiro: u.sube != null && mejor >= u.sube, peligro: u.baja != null && u.baja <= 0.4, alcance: M.alcance(S, c), foco: M.focoEn(S, c), cita: M.citaEn(S, c),
        frio: S.dia - S.reg[c].ultimo[yo()] >= M.CONFIG.OLVIDO_DIAS - 1 && S.dia > 3,
        helado: false };
      d[c].helado = d[c].frio && (niebla ? R[c].escanos >= 15 : u.baja != null && u.baja <= 1);
      max = Math.max(max, valor);
    });
    RIDS.forEach((c) => { d[c].rel = max ? d[c].valor / max : 0; });
    return d;
  }

  function mapaAgenda(d) {
    const n2 = M.destinoN2(S);
    const hoy = {};
    S.plan.filtradas.forEach((p) => { const c = S.plan.agendas[p].principal; (hoy[c] = hoy[c] || []).push(p); });
    const modo = modoDatos() === 'niebla' && ui.modoMapa === 'yo' ? 'lider' : ui.modoMapa;
    return mapaSVG({
      sel: ui.sel,
      fill: (c) => modo === 'potencial' ? { fill: color(yo()), op: 0.1 + 0.9 * Math.pow(d[c].rel, 0.8) } : colorRegion(c, modo),
      clase: (c) => d[c].alcance + (d[c].tiro ? ' tiro' : ''),
      capa: (c, pos) => {
        let s = '';
        const x = pos[0], y = pos[1];
        s += '<text class="etq' + (d[c].tiro ? ' tiro' : d[c].peligro ? ' peligro' : '') + '" x="' + x + '" y="' + y + '">' + (d[c].tiro ? '▲' : d[c].peligro ? '▼' : '') + R[c].escanos + '</text>';
        const arriba = [];
        if (d[c].foco) arriba.push(d[c].foco.icono);
        if (d[c].cita) arriba.push('📌');
        if (d[c].helado) arriba.push('🧊');
        arriba.forEach((e, i) => { s += '<text class="emo" x="' + (x + (i - (arriba.length - 1) / 2) * 36) + '" y="' + (y - 36) + '">' + e + '</text>'; });
        const abajo = [];
        if (S.pos === c) abajo.push({ emo: '🚌', mio: true });
        if (S.agenda.ca === c && S.pos !== c) abajo.push({ emo: D.ACTOS[S.agenda.acto].icono, mio: true });
        if (n2 === c) abajo.push({ emo: '📢' });
        (hoy[c] || []).forEach((p) => abajo.push({ p }));
        abajo.forEach((m, i) => {
          const mx = x + (i - (abajo.length - 1) / 2) * 40, my = y + 38;
          if (m.p) s += '<g class="peon"><circle cx="' + mx + '" cy="' + my + '" r="16" fill="' + color(m.p) + '" stroke="#fff" stroke-width="3"/><text class="ini" x="' + mx + '" y="' + (my + 1) + '">' + nombre(m.p).charAt(0) + '</text></g>';
          else s += (m.mio ? '<circle cx="' + mx + '" cy="' + my + '" r="20" fill="#fff" stroke="' + color(yo()) + '" stroke-width="4"/>' : '') + '<text class="emo' + (m.mio ? ' peq' : '') + '" x="' + mx + '" y="' + (my + 1) + '">' + m.emo + '</text>';
        });
        return s;
      },
    });
  }

  function botonActo(c, acto, puede) {
    const A = D.ACTOS[acto];
    const pv = M.prever(S, c, acto, S.agenda.tactica);
    const niebla = modoDatos() === 'niebla';
    let efecto;
    if (acto === 'cena') efecto = '<b class="ef">+' + pv.caja + ' 💶</b>';
    else if (acto === 'masas') efecto = '<b class="ef">+' + pv.animo + ' 🔥</b>';
    else efecto = '<b class="ef">' + signo(pv.g) + ' pt</b>';
    const extra = [];
    if (!niebla && pv.escanos > 0) extra.push('<span class="gana">▲ +' + pv.escanos + ' escaño' + (pv.escanos > 1 ? 's' : '') + '</span>');
    if (!niebla && pv.escanos < 0) extra.push('<span class="pierde">▼ ' + pv.escanos + '</span>');
    if (pv.riesgo) extra.push('<span>🎲 ' + Math.round(pv.riesgo.p * 100) + ' %</span>');
    if (acto === 'cena' || acto === 'masas') extra.push('<span>' + signo(pv.g) + ' pt</span>');
    if (acto === 'mitin' && pv.duelo.length) extra.push('<span>🥊 duelo</span>');
    const sel = S.agenda.ca === c && S.agenda.acto === acto;
    return '<button class="acto' + (sel ? ' elegido' : '') + '" data-acto="' + acto + '" data-ca="' + c + '"' + (puede ? '' : ' disabled') + ' aria-pressed="' + sel + '">' +
      '<span class="ic">' + A.icono + '</span><span class="nom">' + esc(A.corto) + '</span><span class="extra">' + efecto + extra.join(' ') + '</span></button>';
  }

  function detalleRegion(c) {
    const v = S.reg[c].v;
    const dec = 100 - v.ind;
    const modo = modoDatos();
    const escR = M.escanos(S).porRegion[c];
    const orden = D.TODOS.slice().sort((a, b) => v[b] - v[a]);
    const barras = modo === 'niebla' ? '<p class="nota">🌫️ Encuestas prohibidas. Solo sabes que va primero ' + esc(M.el(orden[0])) + '.</p>'
      : '<div class="barras-voto">' + orden.map((p) => '<div><span>' + puntoColor(p) + esc(etiqueta(p, modo)) + '</span><i class="barra" style="width:' + (v[p] / dec * 100) + '%;background:' + color(p) + '"></i><span>' + num(v[p] / dec * 100) + '% · ' + escR[p] + '</span></div>').join('') + '</div>';
    const der = M.DER[c];
    const ayer = S.mitines.filter((m) => m.dia === S.dia - 1 && m.ca === c && m.p !== yo());
    return barras + '<ul class="datos">' + [
      'Indecisos: <b>' + (modo === 'niebla' ? '?' : num(v.ind) + ' %') + '</b> · Gobierno autonómico: ' + esc(R[c].gob === 'otros' ? R[c].otrosAqui : nombre(R[c].gob)),
      'Ideología: <div class="termometro"><b style="left:calc(' + (der * 100).toFixed(0) + '% - 2px)"></b></div>',
      'Aquí un acto llega a ' + (M.CERCANIA[c] >= 1.4 ? '<b>mucha</b> gente (comunidad pequeña)' : M.CERCANIA[c] <= 0.7 ? 'poca parte de la gente (comunidad muy grande)' : 'una parte normal de la gente') + '.',
      ayer.length ? 'Ayer estuvieron: ' + ayer.map((m) => puntoColor(m.p) + esc(nombre(m.p))).join(', ') : '',
      c === 'cat' || c === 'pvs' || c === 'nav' ? 'Aquí «otros» son ' + esc(R[c].otrosAqui) + '.' : '',
    ].filter(Boolean).map((t) => '<li>' + t + '</li>').join('') + '</ul>';
  }

  function panelRegion(c, d) {
    const x = d[c];
    const coste = M.costeViaje(S, c, S.agenda.tactica);
    const puede = M.puedeIr(S, c, S.agenda.tactica);
    const niebla = modoDatos() === 'niebla';
    const lineas = [];
    if (x.cita) lineas.push('<li class="imp">📌 <b>Lo prometiste:</b> ' + esc(x.cita.nombre) + '. Si no vas, se paga.</li>');
    if (x.foco) lineas.push('<li class="imp">' + x.foco.icono + ' <b>' + esc(x.foco.nombre) + '.</b> ' + esc(x.foco.txt) + '</li>');
    S.plan.filtradas.forEach((p) => {
      if (S.plan.agendas[p].principal === c) lineas.push('<li>' + puntoColor(p) + '<b>' + esc(P[p].candCorto) + ' viene hoy</b> (filtración). Si das un mitin, hay duelo por la tele.</li>');
    });
    if (!niebla) {
      const u = x.u;
      lineas.push('<li>' + (u.sube != null ? 'Siguiente escaño: te faltan <b>' + num(u.sube) + ' pt</b>' : 'Siguiente escaño: lejos (más de 3 pt)') +
        (u.baja != null ? ' · pierdes uno si bajas <b>' + num(u.baja) + ' pt</b>' : '') + '</li>');
    }
    const h = M.hastio(S, yo(), c);
    if (h < 1) lineas.push('<li>' + (h <= 0 ? '😩 <b>Hastío total</b>: un mitin aquí restaría.' : '😒 Hastío: tus actos aquí rinden un ' + Math.round(h * 100) + ' %.') + '</li>');
    if (x.frio) lineas.push('<li>🧊 Llevas ' + (S.dia - S.reg[c].ultimo[yo()]) + ' días sin venir: tus votantes se enfrían.</li>');
    return '<div class="panel-cab"><h3>' + esc(R[c].nombre) + ' <small>' + R[c].escanos + ' escaños</small></h3>' +
      '<span class="alcance ' + x.alcance + (coste ? ' caro' : '') + '">' + (coste ? '✈️ −' + coste + ' 💶' : esc(ALCANCE[x.alcance].replace('Lejos · avión', '✈️ gratis hoy'))) + '</span></div>' +
      '<ul class="lineas">' + lineas.join('') + '</ul>' +
      (puede ? '' : '<p class="nota mal">No tienes caja para el avión (' + coste + '). Elige una comunidad vecina o recauda.</p>') +
      '<div class="actos">' + D.ORDEN_ACTOS.map((a) => botonActo(c, a, puede)).join('') + '</div>' +
      '<details class="plegable"><summary>Datos de ' + esc(corto(c)) + '</summary>' + detalleRegion(c) + '</details>';
  }

  function tacticasHTML() {
    const mano = S.mano.map(M.cartaMano).filter((c) => c.clase === 'tactica');
    if (!mano.length) return '';
    return '<div class="tacticas"><small>Cartas tácticas (una por día)</small>' + mano.map((c) =>
      '<button class="tactica' + (S.agenda.tactica === c.id ? ' elegida' : '') + '" data-tactica="' + c.id + '" aria-pressed="' + (S.agenda.tactica === c.id) + '" title="' + esc(c.txt) + '">' +
      c.icono + ' ' + esc(c.nombre) + '</button>').join('') +
      (S.agenda.tactica ? '<p class="nota">' + esc(D.TACTICAS[S.agenda.tactica].txt) + '</p>' : '') + '</div>';
  }

  function pintarAgenda() {
    if (!ui.sel) ui.sel = S.agenda.ca || S.pos;
    const d = datosAgenda();
    const n2 = M.destinoN2(S);
    const avisos = [];
    if (S.dia === 1) avisos.push('Tu candidato (🚌) viaja gratis a las comunidades <b>vecinas</b> (borde marcado); más lejos, avión. Toca una comunidad y elige qué hace allí. ▲ = escaño a tiro hoy.');
    if (S.dia === M.CONFIG.DIA_CIERRE) avisos.push('🎆 <b>Cierre de campaña</b>: hoy todo vale ×1,8.');
    if (S.dia === M.CONFIG.DIA_DEBATE) avisos.push('🎙️ Esta noche, <b>debate a cuatro</b>.');
    S.citas.filter((x) => x.dia === S.dia).forEach((x) => avisos.push('📌 Hoy prometiste ir a <b>' + esc(R[x.ca].nombre) + '</b>: ' + esc(x.nombre) + '.'));
    const filtr = S.plan.filtradas.map((p) => puntoColor(p) + esc(P[p].candCorto) + ' → ' + esc(corto(S.plan.agendas[p].principal))).join(' · ');
    const ordenes = Object.keys(D.ORDENES).map((k) => {
      const O = D.ORDENES[k];
      return '<button data-orden="' + k + '" aria-pressed="' + (S.orden === k) + '" title="' + esc(O.txt) + '">' + O.icono + ' ' + esc(O.nombre) + '</button>';
    }).join('');
    const listo = !!S.agenda.ca;
    const coste = listo ? M.costeViaje(S, S.agenda.ca, S.agenda.tactica) : 0;
    const lista = RIDS.slice().sort((a, b) => d[b].valor - d[a].valor).map((c) =>
      '<button data-ca="' + c + '"><span>' + (d[c].foco ? d[c].foco.icono + ' ' : '') + esc(R[c].nombre) + '</span><span>' + R[c].escanos + ' esc.</span><span>' +
      (d[c].tiro ? '<b class="gana">▲</b> ' : '') + (d[c].alcance === 'avion' ? '✈️' : d[c].alcance === 'aqui' ? '🚌' : '🚗') + '</span></button>').join('');
    pantalla.innerHTML = '<div class="gira"><div class="gira-mapa">' +
      '<div class="gira-cab"><h1 class="titulo-pantalla">La gira</h1><div class="modos">' +
      [['potencial', 'Potencial'], ['lider', 'Quién gana'], ['yo', 'Tu voto']].map(([k, t]) => '<button data-modo-mapa="' + k + '" aria-pressed="' + (ui.modoMapa === k) + '">' + t + '</button>').join('') + '</div></div>' +
      avisos.map((a) => '<div class="aviso">' + a + '</div>').join('') +
      '<div class="mapa tablero" id="mapa-agenda">' + mapaAgenda(d) + '</div>' +
      '<p class="leyenda"><span>🚌 tú</span><span><i class="borde"></i> viaje gratis</span><span><b class="gana">▲</b> escaño a tiro</span><span><b class="pierde">▼</b> escaño en peligro</span>' +
      '<span>Hoy (filtrado): ' + (filtr || '—') + '</span></p>' +
      '</div><div class="gira-panel"><div class="panel">' +
      panelRegion(ui.sel, d) + tacticasHTML() +
      '<div class="n2"><small>📢 Tu nº2 hoy: <b>' + (n2 ? esc(R[n2].nombre) : 'pasando la gorra (+' + M.CONFIG.N2_CAJA + ' 💶)') + '</b></small><div class="segmento">' + ordenes + '</div></div>' +
      '</div>' +
      '<details class="lista-ca"><summary>Lista de comunidades (por potencial)</summary>' + lista + '</details>' +
      '<div class="pie-fijo"><button class="boton primario ancho cerrar-dia" data-accion="cerrar-dia"' + (listo ? '' : ' disabled') + '>' +
      (listo ? 'Cerrar el día: ' + D.ACTOS[S.agenda.acto].icono + ' ' + esc(D.ACTOS[S.agenda.acto].corto) + ' en ' + esc(corto(S.agenda.ca)) + (coste ? ' (✈️ −' + coste + ')' : '') + ' ▶' : 'Elige un acto para tu candidato') + '</button></div>' +
      '</div></div>';
  }

  function cerrarDia() {
    if (!S.agenda.ca || !M.puedeIr(S, S.agenda.ca, S.agenda.tactica)) { toast('No puedes pagar ese viaje'); return; }
    const antes = M.escanos(S);
    const dia = S.dia;
    const metAntes = Object.assign({}, S.met);
    M.cerrarDia(S);
    ui.noche = { dia, antes, despues: M.escanos(S), ult: S.ultimo, metAntes, met: Object.assign({}, S.met) };
    ui.sel = null;
    almacen.guardar();
    render();
    arriba();
  }

  // ---------- Resolución animada del día ----------

  function pintarNoche() {
    const n = ui.noche, u = n.ult, p = yo();
    const f = M.fecha(n.dia);
    const mio = u.actos.find((m) => m.p === p && m.rol === 'principal');
    const mi2 = u.actos.find((m) => m.p === p && m.rol === 'secundario');
    const cambios = [];
    RIDS.forEach((c) => {
      const dd = n.despues.porRegion[c][p] - n.antes.porRegion[c][p];
      if (dd) cambios.push({ c, d: dd });
    });
    const pins = u.actos.filter((m) => m.rol === 'principal');
    const porCa = {};
    pins.forEach((m) => { (porCa[m.ca] = porCa[m.ca] || []).push(m); });
    const capa = (c, pos) => {
      let s = '';
      (porCa[c] || []).forEach((m, i) => {
        const x = pos[0] + (i - (porCa[c].length - 1) / 2) * 44, y = pos[1];
        const k = pins.indexOf(m);
        const esMio = m.p === p;
        s += '<g class="pin" style="animation-delay:' + (0.25 + k * 0.45) + 's;transform-origin:' + x + 'px ' + y + 'px">' +
          '<circle cx="' + x + '" cy="' + y + '" r="' + (esMio ? 26 : 19) + '" fill="' + color(m.p) + '" stroke="#fff" stroke-width="4"/>' +
          (esMio ? '<text class="emo peq" x="' + x + '" y="' + (y + 1) + '">' + D.ACTOS[m.acto].icono + '</text>' : '<text class="ini" x="' + x + '" y="' + (y + 1) + '">' + nombre(m.p).charAt(0) + '</text>') +
          '<text class="flota' + (m.g < 0 ? ' neg' : '') + '" x="' + x + '" y="' + (y - 36) + '">' + signo(m.g) + '</text></g>';
      });
      const ch = cambios.find((q) => q.c === c);
      if (ch) s += '<text class="salto ' + (ch.d > 0 ? 'sube' : 'baja') + '" x="' + pos[0] + '" y="' + (pos[1] + 50) + '">' + (ch.d > 0 ? '▲ +' : '▼ ') + ch.d + '</text>';
      return s;
    };
    const lineas = [];
    if (mio) {
      const A = D.ACTOS[mio.acto];
      let t = A.icono + ' <b>' + esc(A.nombre) + ' en ' + esc(R[mio.ca].nombre) + ':</b> ' + signo(mio.g) + ' pt';
      if (u.caja) t += ' · +' + u.caja + ' 💶';
      if (u.animo) t += ' · +' + u.animo + ' 🔥';
      if (u.tactica) t += ' · ' + D.TACTICAS[u.tactica].icono + ' ' + esc(D.TACTICAS[u.tactica].nombre);
      if (u.foco) t += '<br><small>' + D.FOCOS[u.foco].icono + ' ' + esc(D.FOCOS[u.foco].nombre) + (u.riesgoOk === false ? ': sale mal.' : u.riesgoOk === true ? ': sale bien.' : '.') + '</small>';
      lineas.push({ t, cl: mio.g < 0 ? 'mal' : '' });
    }
    Object.keys(u.duelos || {}).forEach((q) => lineas.push({ t: '🥊 <b>Duelo con ' + esc(P[q].candCorto) + ':</b> ' + (u.duelos[q] ? 'las cámaras se van contigo.' : 'las cámaras se van con él.'), cl: u.duelos[q] ? 'bien' : 'mal' }));
    u.citas.forEach((x) => lineas.push({ t: '📌 <b>' + (x.fui ? 'Cumples' : 'Plantón') + ':</b> ' + esc(x.txt), cl: x.fui ? 'bien' : 'mal' }));
    lineas.push({ t: mi2 ? '📢 <b>Tu nº2 en ' + esc(R[mi2.ca].nombre) + ':</b> ' + signo(mi2.g) + ' pt' : '📢 <b>Tu nº2</b> pasa la gorra: +' + M.CONFIG.N2_CAJA + ' 💶' });
    lineas.push({ t: '<span class="rivales">' + pins.filter((m) => m.p !== p).map((m) => puntoColor(m.p) + esc(P[m.p].candCorto) + ' en ' + esc(corto(m.ca)) + ' ' + signo(m.g)).join(' · ') + '</span>' });
    const tAntes = n.antes.total[p], tDesp = n.despues.total[p];
    const niebla = n.dia >= M.CONFIG.DIA_VETO && !S.flags.andorra;
    const saldo = niebla ? '<div class="saldo"><b>🌫️</b><span>Sin encuestas no sabes cuántos escaños ha movido el día.</span></div>'
      : '<div class="saldo ' + (tDesp > tAntes ? 'bien' : tDesp < tAntes ? 'mal' : '') + '"><b>' + tAntes + ' → ' + tDesp + '</b><span>escaños ' + (tDesp > tAntes ? '▲ +' + (tDesp - tAntes) : tDesp < tAntes ? '▼ ' + (tDesp - tAntes) : '=') + '</span>' +
        (cambios.length ? '<small>' + cambios.map((x) => (x.d > 0 ? '+' : '') + x.d + ' en ' + esc(corto(x.c))).join(', ') + '</small>' : '<small>Ningún escaño cambia de manos hoy.</small>') + '</div>';
    const base = 0.25 + pins.length * 0.45;
    pantalla.innerHTML = '<div class="noche gira"><div class="gira-mapa">' +
      '<p class="paso">Cierre del día ' + n.dia + ' · ' + esc(f.semana + ' ' + f.dia) + '</p><h1 class="titulo-pantalla">Así ha ido el día</h1>' +
      '<div class="mapa tablero noche-mapa">' + mapaSVG({ fill: (c) => ({ fill: color(M.liderRegion(S, c)), op: 0.28 }), capa: niebla ? (c, pos) => capa(c, pos).replace(/<text class="salto[^>]*>.*?<\/text>/, '') : capa }) + '</div></div>' +
      '<div class="gira-panel"><ul class="parte">' + lineas.map((l, i) => '<li class="' + (l.cl || '') + '" style="animation-delay:' + (base + i * 0.25) + 's">' + l.t + '</li>').join('') + '</ul>' +
      '<div class="entra" style="animation-delay:' + (base + lineas.length * 0.25) + 's">' + saldo + '</div>' +
      '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="fin-noche">' +
      (S.fase === 'debate' ? 'Al plató: debate a cuatro →' : 'Ver la portada de mañana →') + '</button></div></div></div>';
    if (!niebla && tDesp !== tAntes) setTimeout(() => vibrar(tDesp > tAntes ? 25 : [20, 50, 20]), (base + lineas.length * 0.25) * 1000);
  }

  // ---------- Debate ----------

  const ICONO_TIPO = { ataque: '⚔️', replica: '🛡️', propuesta: '💡' };
  const NOMBRE_TIPO = { ataque: 'Ataque', replica: 'Réplica', propuesta: 'Propuesta' };
  const TEMA = { eco: 'Economía', cor: 'Corrupción', esp: 'España', null: '' };

  function atrilesHTML(d, ultima) {
    return '<div class="atriles">' + JUG.map((p) => {
      let jugada = '';
      if (ultima && ultima.jug) jugada = ICONO_TIPO[ultima.jug[p].carta.tipo] + (ultima.jug[p].objetivo ? '→' + esc(nombre(ultima.jug[p].objetivo)) : '');
      if (ultima && ultima.oro) jugada = { emocion: '🥹', propuesta: '📋', ataque: '🎯' }[ultima.oro[p].op];
      const delta = ultima ? ultima.pts[p] : 0;
      return '<div class="atril' + (p === yo() ? ' yo' : '') + '" style="--c:' + color(p) + '"><b>' + esc(P[p].candCorto) + '</b>' +
        '<div class="pts">' + num(d.puntos[p], 1).replace(',0', '') + '</div><div class="jugada">' + jugada + '</div>' +
        (ultima ? '<small>' + (delta > 0 ? '+' : '') + num(delta, 1).replace(',0', '') + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function pintarDebate() {
    const d = S.debate;
    const ultima = d.jugadas[d.jugadas.length - 1];
    const log = ultima ? '<ul class="log">' + ultima.log.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>' : '';
    const nota = d.nota ? '<div class="aviso ' + (d.nota.signo > 0 ? 'bien' : 'mal') + '">' + esc(d.nota.txt) + '</div>' : '';
    if (ui.verDebate) {
      const orden = JUG.slice().sort((a, b) => d.flash[b] - d.flash[a]);
      pantalla.innerHTML = '<div class="estrecha"><h1 class="titulo-pantalla">Encuesta flash: ¿quién ha ganado?</h1>' + atrilesHTML(d, ultima) + log +
        '<div class="flash">' + orden.map((p) => '<div><span>' + esc(P[p].candCorto) + '</span><i style="width:' + d.flash[p] + '%;background:' + color(p) + '"></i><b>' + d.flash[p] + ' %</b></div>').join('') + '</div>' +
        '<p>' + (d.ganador === yo() ? '🏆 ¡Has ganado el debate! Tus bases están eufóricas.' : 'El debate lo gana ' + esc(P[d.ganador].candCorto) + '.') + '</p>' +
        chipsHTML(d.chips) +
        '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="fin-debate">Ver la portada de mañana →</button></div></div>';
      return;
    }
    const ronda = M.RONDAS[d.ronda];
    const cab = '<h1 class="titulo-pantalla">Debate a cuatro · ' + (d.ronda + 1) + '/4</h1>' +
      '<p class="paso">' + esc(ronda.nombre) + '</p>' + (d.ronda === 0 ? nota : '');
    if (d.ronda < 3) {
      const mano = M.manoDebate(S);
      const sel = mano.find((c) => c.id === ui.debateSel);
      const cartas = mano.map((c) => '<button class="carta-mano' + (c.improvisada ? ' improvisada' : '') + '" data-debate="' + c.id + '" aria-pressed="' + (ui.debateSel === c.id) + '">' +
        '<span class="tipo">' + ICONO_TIPO[c.tipo] + '</span> <b>' + esc(c.improvisada ? 'Improvisar: ' + NOMBRE_TIPO[c.tipo].toLowerCase() : c.nombre) + '</b>' +
        'Fuerza ' + '●●●'.slice(0, c.fuerza) + '○○○'.slice(0, 3 - c.fuerza) + (c.tema ? ' · ' + esc(TEMA[c.tema]) + (c.tema === ronda.tema ? ' (+1)' : '') : '') +
        (c.texto ? '<br><small>' + esc(c.texto) + '</small>' : '') + '</button>').join('');
      const objetivos = sel && sel.tipo === 'ataque' ? '<p class="paso">¿A quién atacas?</p><div class="objetivos">' + JUG.filter((p) => p !== yo()).map((p) =>
        '<button class="boton" style="--c:' + color(p) + '" data-objetivo="' + p + '" aria-pressed="' + (ui.debateObj === p) + '">' + esc(P[p].candCorto) + '</button>').join('') + '</div>' : '';
      const listo = sel && (sel.tipo !== 'ataque' || ui.debateObj);
      pantalla.innerHTML = '<div class="estrecha">' + cab + atrilesHTML(d, ultima) + log +
        '<p class="reglas-debate">⚔️ Ataque gana a 💡 Propuesta · 💡 Propuesta gana a 🛡️ Réplica · 🛡️ Réplica gana a ⚔️ Ataque.<br>' +
        'Quien va primero (' + esc(P[d.lider].candCorto) + ') suele recibir los ataques.</p>' +
        '<p class="paso">Tu mano</p><div class="mano">' + cartas + '</div>' + objetivos +
        '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="jugar-ronda"' + (listo ? '' : ' disabled') + '>Jugar carta</button></div></div>';
    } else {
      const ops = Object.keys(M.ORO).map((k) => '<button class="carta-mano" data-oro="' + k + '" aria-pressed="' + (ui.oro === k) + '"><b>' + esc(M.ORO[k].nombre) + '</b>' + esc(M.ORO[k].texto) + '</button>').join('');
      const objetivos = ui.oro === 'ataque' ? '<p class="paso">¿A quién rematas?</p><div class="objetivos">' + JUG.filter((p) => p !== yo()).map((p) =>
        '<button class="boton" style="--c:' + color(p) + '" data-oro-obj="' + p + '" aria-pressed="' + (ui.oroObj === p) + '">' + esc(P[p].candCorto) + '</button>').join('') + '</div>' : '';
      const listo = ui.oro && (ui.oro !== 'ataque' || ui.oroObj);
      pantalla.innerHTML = '<div class="estrecha">' + cab + atrilesHTML(d, ultima) + log +
        '<p>Último minuto, mirando a cámara. ¿Cómo cierras?</p><div class="mano">' + ops + '</div>' + objetivos +
        '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="jugar-oro"' + (listo ? '' : ' disabled') + '>Cerrar el debate</button></div></div>';
    }
  }

  // ---------- Reflexión ----------

  function pintarReflexion() {
    const r = S.reflexion;
    const ctx = { obj: P[yo()].antagonista };
    if (r && r.hecha) {
      pantalla.innerHTML = '<div class="estrecha"><h1 class="titulo-pantalla">Jornada de reflexión</h1>' +
        '<div class="ficha"><h3>' + esc(r.carta.nombre) + ' <small>' + (r.sale ? '🎲 Salió bien' : '🎲 Salió mal') + '</small></h3><p>' + esc(r.texto) + '</p>' + chipsHTML(r.chips) + '</div>' +
        '<p class="paso" style="margin-top:14px">Mientras tanto, los rivales…</p>' +
        (r.ia.length ? '<ul class="log">' + r.ia.map((x) => '<li>' + puntoColor(x.p) + esc(x.txt) + '</li>').join('') + '</ul>' : '<p class="nota">Los rivales cumplen la ley. Sospechoso.</p>') +
        '<div class="fila-botones pie"><button class="boton primario ancho" data-accion="urnas">🗳️ Abrir las urnas</button></div></div>';
      return;
    }
    const castigo = Math.max(0, Math.min(M.CONFIG.PROMESAS_MAX, (S.promesas - M.CONFIG.PROMESAS_UMBRAL) / M.CONFIG.PROMESAS_DIV));
    const ops = M.opcionesReflexion(S).map((c) => '<button class="opcion-reflexion" data-reflexion="' + c.id + '"><b>' + esc(c.nombre) + '</b>' +
      '<span>' + esc(M.texto(S, c.texto, ctx)) + '</span><br><small>Riesgo de que salga mal: ' + Math.round((c.riesgo || 0) * 100) + ' %' + (c.basica ? '' : ' · carta de tu mano') + '</small></button>').join('');
    pantalla.innerHTML = '<div class="estrecha"><h1 class="titulo-pantalla">Jornada de reflexión</h1>' +
      '<p>Sábado 28. No hay mítines ni propaganda. En teoría. Puedes jugar <b>una</b> carta: las de tu mano son muy potentes, pero si salen mal, el efecto se da la vuelta.</p>' +
      '<div class="aviso' + (castigo > 0 ? ' mal' : ' bien') + '">📜 Has prometido ' + esc(M.formatoMillones(S.promesas)) + '. ' +
      (castigo > 0 ? 'Mañana los escépticos te lo cobran: unos −' + num(castigo) + ' puntos.' : 'Nadie podrá decir que vendiste humo. Mañana no hay castigo.') + '</div>' +
      ops + '</div>';
  }

  // ---------- Noche electoral ----------

  const MEDALLAS = { triunfo: '🏆', victoria: '🥇', digna: '🥈', debacle: '💀' };

  function veredicto(f) {
    const p = yo();
    const textos = {
      triunfo: { psoe: 'Mayoría absoluta. Ni el CIS se lo esperaba.', pp: 'Mayoría absoluta. Ya no hay que contestar sobre Vox.', vox: 'Sorpasso y presidencia. Covadonga, la yegua, ya tiene despacho.', fa: 'Presidenta. Quince partidos celebran en quince fiestas distintas.' },
      victoria: { psoe: 'Gobiernas otra vez. Los socios ya están afilando la lista de peticiones.', pp: 'Presides el Gobierno. Con Vox, pero presides.', vox: 'Entras en el Gobierno (o pasas al PP). Ministerios con nombres muy largos.', fa: 'Entras en el Gobierno (o adelantas al PSOE). Habrá ministerios para casi todos los socios.' },
      digna: { psoe: 'No gobiernas, pero el partido resiste. «Hemos ganado en dignidad».', pp: 'Ganar perdiendo: primera fuerza o más escaños, pero sin gobierno propio.', vox: 'Más escaños que al empezar. Fuera del Gobierno, pero haciendo mucho ruido.', fa: 'Más escaños que al empezar. La asamblea lo celebra hasta las tantas.' },
      debacle: { psoe: 'Debacle. Se habla de «refundación» y de «escuchar a la calle».', pp: 'Debacle. En la sede se rompen pisapapeles en cadena.', vox: 'Debacle. Culpáis al voto por correo, a los bots y al clima.', fa: 'Debacle. La coalición se disuelve en tres comunicados y medio.' },
    };
    return textos[f.medalla][p];
  }

  function titularFinal(f) {
    const t = f.esc.total;
    if (f.gobierno === 'der') return f.presidente === 'pp' ? P.pp.candCorto + ' será presidente: PP y Vox suman ' + f.der : 'Sorpasso histórico: ' + P.vox.candCorto + ' será presidente con ' + f.der + ' escaños de la derecha';
    if (f.gobierno === 'izq') return f.presidente === 'psoe' ? P.psoe.candCorto + ' resiste: la izquierda y sus socios suman ' + f.izq : P.fa.candCorto + ' será presidenta: el sorpasso que nadie vio venir';
    return 'Bloqueo total: ' + (t.pp + t.vox) + ' a ' + f.izq + '. Habrá repetición electoral (en Navidad)';
  }

  function textoCompartir(f) {
    const t = f.esc.total;
    const em = { fa: '🟪', psoe: '🟥', otros: '⬜', pp: '🟦', vox: '🟩' };
    let cuadros = '';
    let acum = 0, puestos = 0;
    D.ORDEN_HEMICICLO.forEach((p) => {
      acum += t[p];
      const hasta = Math.round(acum / 350 * 20);
      cuadros += em[p].repeat(Math.max(0, hasta - puestos));
      puestos = hasta;
    });
    const d = t[yo()] - S.escInicio[yo()];
    return 'Campaña 29-N 🗳️ ' + nombre(yo()) + ' (' + D.ESCENARIOS[S.escenario].corto + ')\n' +
      MEDALLAS[f.medalla] + ' ' + t[yo()] + ' escaños (' + (d >= 0 ? '+' : '') + d + ')\n' + cuadros + '\n' +
      '🚌 ' + Object.keys(S.stats.visitadas).length + ' comunidades · ✈️ ' + S.stats.aviones + ' vuelos · 📜 ' + M.formatoMillones(S.promesas) + '\n' + location.href.split('#')[0];
  }

  function pintarRecuento() {
    const f = S.final;
    const paso = f.recuento[ui.rec];
    const t = paso.total;
    const der = t.pp + t.vox, izq = t.psoe + t.fa + t.otros;
    const lider = paso.escrutados ? M.lider(t, JUG) : null;
    let comentario;
    if (paso.pct >= 100) comentario = 'Escrutinio terminado.';
    else if (paso.pct < 15) comentario = 'Llegan las primeras mesas: pueblos pequeños y un colegio de Ceuta. Nadie se fía. Todos opinan.';
    else if (der >= 176) comentario = 'PP y Vox sumarían mayoría absoluta… con lo escrutado.';
    else if (izq >= 176) comentario = 'La izquierda y sus socios sumarían mayoría… con lo escrutado.';
    else comentario = 'Faltan por llegar ' + (350 - paso.escrutados) + ' escaños. En las sedes se muerden las uñas con educación.';
    pantalla.innerHTML = '<div class="estrecha recuento">' +
      '<p class="paso" style="text-align:center">Noche electoral · domingo 29 de noviembre</p>' +
      '<h1 class="titulo-pantalla" style="text-align:center">Escrutado: <span class="pct">' + paso.pct + ' %</span></h1>' +
      '<div class="progreso"><i style="width:' + paso.pct + '%"></i></div>' +
      '<div class="hemiciclo">' + hemicicloSVG(t) + filaEscanos(t, 'normal') + '</div>' +
      '<div class="pulso"><div><span>PP + Vox</span><b>' + der + '</b></div><div class="barra-pulso"><i style="width:' + (der / 3.5) + '%;background:' + color('pp') + '"></i><i class="izq" style="width:' + (izq / 3.5) + '%;background:' + color('psoe') + '"></i><em></em></div><div><span>PSOE + FA + otros</span><b>' + izq + '</b></div></div>' +
      '<p class="comentario">' + esc(comentario) + (lider ? ' Va primero <b>' + esc(M.el(lider)) + '</b>; tú llevas <b>' + t[yo()] + '</b>.' : '') + '</p>' +
      '<div class="mapa">' + mapaSVG({ fill: (c) => paso.lid[c] ? { fill: color(paso.lid[c]), op: 0.9 } : { fill: '#9a9a9a', op: 0.18 } }) + '</div>' +
      '<div class="fila-botones pie"><button class="boton ancho" data-accion="saltar-recuento">Saltar al resultado ⏭</button></div></div>';
    clearTimeout(ui.timer);
    ui.timer = setTimeout(() => {
      if (!S || S.fase !== 'final' || ui.rec == null) return;
      ui.rec++;
      if (ui.rec >= S.final.recuento.length) { ui.rec = null; vibrar([40, 60, 120]); }
      render();
    }, paso.pct >= 100 ? 1500 : 1900);
  }

  function pintarFinal() {
    if (ui.rec != null && S.final.recuento && ui.rec < S.final.recuento.length) return pintarRecuento();
    const f = S.final;
    const t = f.esc.total;
    const orden = D.TODOS.slice().sort((a, b) => t[b] - t[a]);
    const tabla = '<table class="tabla">' + '<tr><th>Partido</th><th>Voto</th><th>Escaños</th><th>vs. inicio</th></tr>' + orden.map((p) => {
      const d = t[p] - S.escInicio[p];
      return '<tr><td>' + puntoColor(p) + esc(nombre(p)) + (p === yo() ? ' (tú)' : '') + '</td><td>' + num(f.est[p]) + ' %</td><td><b>' + t[p] + '</b></td><td>' +
        (d > 0 ? '<span class="sube">+' + d + '</span>' : d < 0 ? '<span class="baja">' + d + '</span>' : '=') + '</td></tr>';
    }).join('') + '</table>';
    const gob = f.gobierno === 'der' ? 'Gobierno de derechas (PP + Vox: ' + f.der + ')' : f.gobierno === 'izq' ? 'Gobierno de izquierdas con apoyos variados (y caros): ' + f.izq : 'Bloqueo: repetición electoral';
    const st = S.stats;
    pantalla.innerHTML =
      '<div class="final"><div class="estrecha"><p class="paso" style="text-align:center">Noche electoral · domingo 29 de noviembre</p>' +
      '<div class="medalla">' + MEDALLAS[f.medalla] + '</div>' +
      '<h1 class="veredicto">' + { triunfo: '¡Triunfo histórico!', victoria: 'Victoria', digna: 'Derrota digna', debacle: 'Debacle' }[f.medalla] + '</h1>' +
      '<p class="gobierno">' + esc(veredicto(f)) + '</p></div>' +
      '<article class="periodico portada">' +
      '<header class="cabecera"><div class="nombre">' + esc(M.PERIODICOS[0]) + '</div><div class="meta"><span>lunes 30 de noviembre</span><span>Edición especial</span><span>2 €</span></div></header>' +
      '<div class="col-a"><h2 class="titular">' + esc(titularFinal(f)) + '</h2>' +
      '<p class="entradilla">' + esc(gob) + '. Tu partido, ' + esc(M.el(yo())) + ', saca ' + t[yo()] + ' escaños. Has prometido ' + esc(M.formatoMillones(S.promesas)) +
      (f.castigo > 0 ? '; los escépticos te lo han cobrado (−' + num(f.castigo) + ' puntos).' : '; el déficit te manda saludos.') + '</p>' +
      '<div class="seccion">Tu campaña en cifras</div><ul class="breves">' +
      '<li><b>🚌 ' + Object.keys(st.visitadas).length + ' comunidades pisadas</b> y ' + st.aviones + ' vuelos.</li>' +
      '<li><b>🎤 ' + st.actos.mitin + ' mítines</b>, ' + st.actos.puerta + ' días de puerta a puerta, ' + st.actos.cena + ' cenas y ' + st.actos.masas + ' baños de masas.</li>' +
      '<li><b>🥊 Duelos por la tele:</b> ' + st.duelosG + ' ganados, ' + st.duelosP + ' perdidos.</li></ul>' +
      '<div class="seccion">Resultados</div>' + tabla +
      '<p class="nota">El escrutinio se desvía de la última encuesta por el margen de error: nunca acierta del todo.</p></div>' +
      '<div class="col-b"><div class="hemiciclo">' + hemicicloSVG(t) + filaEscanos(t, 'normal') + '</div>' + tendenciaSVG() +
      '<div class="mapa">' + mapaSVG({ fill: fillLider }) + '</div></div>' +
      '</article>' +
      '<div class="fila-botones estrecha"><button class="boton" data-accion="compartir">Compartir</button><button class="boton primario" data-accion="nueva">Otra campaña</button></div>' +
      '<a class="volver" href="../">&larr; Volver a Mini Juegos</a></div>';
  }

  // ---------- Modales ----------

  function ayudaHTML() {
    return '<h2>Cómo se juega</h2><ul>' +
      '<li><b>21 días</b> hasta el 29-N. Cada día: lees la <b>portada</b>, decides en las <b>cartas</b> (desliza o pulsa) y mueves la <b>gira</b>.</li>' +
      '<li><b>La caravana</b> 🚌: tu candidato está en una comunidad. Ir a una vecina es gratis; más lejos, avión (12 💶).</li>' +
      '<li><b>Qué hace allí</b>: 🎤 mitin (indecisos), 🚪 puerta a puerta (roba a tus vecinos ideológicos), 🍽️ cena (caja) o 🫂 baño de masas (ánimo).</li>' +
      '<li><b>Escaños en juego</b>: ▲ marca dónde tienes un escaño a tiro hoy; ▼, dónde estás a punto de perder uno. En las comunidades pequeñas un acto mueve más puntos.</li>' +
      '<li><b>Sucesos del mapa</b>: cada día hay dos (fiestas, derbi, trenes parados…). Cambian lo que rinde cada acto allí.</li>' +
      '<li><b>Rivales</b>: cada mañana se filtra adónde van uno o dos. Si coincidís en mitin hay <b>duelo</b>: quien gana se lleva la tele.</li>' +
      '<li><b>No repitas</b> (hastío: −35 % por visita reciente) y <b>no abandones</b> (a los 4 días sin ir, tus votantes se enfrían 🧊).</li>' +
      '<li><b>Tu nº2</b> 📢 cumple solo una orden fija: atacar, cuidar feudos o pasar la gorra.</li>' +
      '<li><b>🃏 Mano</b>: cartas <b>tácticas</b> (se juegan en la gira, una al día), de <b>debate</b> (día 16) y de <b>reflexión</b> (día 21).</li>' +
      '<li><b>📌 Citas</b>: si en una carta prometes ir hoy a un sitio, ve. El plantón se paga.</li>' +
      '<li><b>💶 Caja</b>, <b>🔥 Ánimo</b>, <b>🕵️ Sospecha</b> y <b>📜 Promesas</b>: toca cada medidor para ver qué hace.</li>' +
      '<li><b>Debate</b>: ⚔️ Ataque gana a 💡 Propuesta, 💡 a 🛡️ Réplica, 🛡️ a ⚔️.</li>' +
      '<li><b>Objetivo</b>: gobernar. PP+Vox o PSOE+FA+otros necesitan 176. Si no, al menos mejorar tus escaños.</li>' +
      '</ul>';
  }

  function manoHTML() {
    if (!S.mano.length) return '<h2>Tu mano</h2><p>Vacía. Algunas cartas te dan tácticas para la gira o te dejan guardar cosas para el debate y la jornada de reflexión.</p>';
    return '<h2>Tu mano (' + S.mano.length + '/' + M.CONFIG.MANO_MAX + ')</h2><ul>' + S.mano.map((id) => {
      const c = M.cartaMano(id);
      if (c.clase === 'tactica') return '<li>' + c.icono + ' <b>' + esc(c.nombre) + '</b> · táctica de gira<br><small>' + esc(c.txt) + '</small></li>';
      if (c.clase === 'debate') return '<li>' + ICONO_TIPO[c.tipo] + ' <b>' + esc(c.nombre) + '</b> · debate · fuerza ' + c.fuerza + (c.tema ? ' · ' + TEMA[c.tema] : '') + '<br><small>' + esc(c.texto) + '</small></li>';
      return '<li>🌙 <b>' + esc(c.nombre) + '</b> · jornada de reflexión · riesgo ' + Math.round(c.riesgo * 100) + ' %<br><small>' + esc(M.texto(S, c.texto, {})) + '</small></li>';
    }).join('') + '</ul><p class="nota">Si guardas una séptima carta, se pierde la más antigua.</p>';
  }

  function menuHTML() {
    return '<h2>Menú</h2><div class="menu-inicio" style="margin-top:8px">' +
      '<button class="boton" data-accion="ayuda">Cómo se juega</button>' +
      '<button class="boton" data-accion="salir">Guardar y salir al inicio</button>' +
      '<button class="boton" data-accion="abandonar">Abandonar esta campaña</button></div>';
  }

  // ---------- Router ----------

  function render() {
    pintarBarra();
    if (vista === 'inicio') return pintarInicio();
    if (vista === 'eleccion') return pintarEleccion();
    if (ui.noche) return pintarNoche();
    switch (S.fase) {
      case 'portada': return pintarPortada();
      case 'cartas': return pintarCartas();
      case 'agenda': return pintarAgenda();
      case 'debate': return pintarDebate();
      case 'reflexion': return pintarReflexion();
      case 'final': return pintarFinal();
      default: return pintarPortada();
    }
  }

  function irJuego() {
    vista = 'juego';
    ui.noche = null; ui.rec = null; ui.sel = null; ui.verDebate = false;
    render();
    arriba();
  }

  // ---------- Eventos ----------

  pantalla.addEventListener('click', (e) => {
    const b = e.target.closest('button, path, circle');
    if (!b) return;
    const ds = b.dataset;
    if (ds.accion) return accion(ds.accion);
    if (ds.partido) { ui.partido = ds.partido; return pintarEleccion(); }
    if (ds.escenario) { ui.escenario = ds.escenario; return pintarEleccion(); }
    if (ds.lado) return elegir(ds.lado);
    if (ds.modoMapa) { ui.modoMapa = ds.modoMapa; return pintarAgenda(); }
    if (ds.orden) { S.orden = ds.orden; almacen.guardar(); return pintarAgenda(); }
    if (ds.acto) {
      S.agenda.ca = ds.ca; S.agenda.acto = ds.acto;
      vibrar(12);
      almacen.guardar();
      return pintarAgenda();
    }
    if (ds.tactica) {
      const T = D.TACTICAS[ds.tactica];
      if (T.espia) {
        M.usarTacticaYa(S, ds.tactica);
        toast('El topo canta: ya ves adónde van todos');
      } else {
        S.agenda.tactica = S.agenda.tactica === ds.tactica ? null : ds.tactica;
        if (S.agenda.ca && !M.puedeIr(S, S.agenda.ca, S.agenda.tactica)) S.agenda.ca = null;
      }
      almacen.guardar();
      pintarBarra();
      return pintarAgenda();
    }
    if (ds.debate) { ui.debateSel = ds.debate; ui.debateObj = null; return pintarDebate(); }
    if (ds.objetivo) { ui.debateObj = ds.objetivo; return pintarDebate(); }
    if (ds.oro) { ui.oro = ds.oro; ui.oroObj = ds.oro === 'ataque' ? P[yo()].antagonista : null; return pintarDebate(); }
    if (ds.oroObj) { ui.oroObj = ds.oroObj; return pintarDebate(); }
    if (ds.reflexion) {
      M.jugarReflexion(S, ds.reflexion);
      almacen.guardar();
      render();
      return arriba();
    }
    if (ds.ca) {
      if (vista === 'juego' && S.fase === 'agenda' && !ui.noche) {
        ui.sel = ds.ca;
        pintarAgenda();
        if (e.target.closest('.lista-ca')) { const f = $('.panel'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }
    }
  });

  $('#metros').addEventListener('click', (e) => {
    const b = e.target.closest('[data-metro]');
    if (b) abrirModal(AYUDA_METRO[b.dataset.metro]);
  });

  function accion(a) {
    switch (a) {
      case 'nueva': ui.partido = null; ui.escenario = null; vista = 'eleccion'; cerrarModal(); render(); return arriba();
      case 'inicio': vista = 'inicio'; return render();
      case 'continuar':
        S = almacen.leer();
        if (!S || S.version !== VERSION) { S = null; almacen.borrar(); toast('Esa partida era de una versión anterior'); return render(); }
        return irJuego();
      case 'ayuda': return abrirModal(ayudaHTML());
      case 'empezar':
        S = M.nuevaPartida({ partido: ui.partido, escenario: ui.escenario, vistas: almacen.vistas() });
        almacen.guardar();
        return irJuego();
      case 'empezar-dia': M.empezarDia(S); almacen.guardar(); render(); return arriba();
      case 'siguiente-carta': M.siguienteCarta(S); almacen.guardar(); render(); return arriba();
      case 'cerrar-dia': return cerrarDia();
      case 'fin-noche': ui.noche = null; render(); return arriba();
      case 'jugar-ronda':
        M.jugarRonda(S, { cartaId: ui.debateSel, objetivo: ui.debateObj });
        ui.debateSel = null; ui.debateObj = null;
        almacen.guardar();
        return pintarDebate();
      case 'jugar-oro':
        M.jugarOro(S, ui.oro, ui.oroObj);
        ui.oro = null; ui.oroObj = null;
        M.terminarDebate(S);
        ui.verDebate = true;
        almacen.guardar();
        pintarBarra();
        return pintarDebate();
      case 'fin-debate': ui.verDebate = false; render(); return arriba();
      case 'urnas': M.calcularFinal(S); ui.rec = 0; almacen.guardar(); render(); return arriba();
      case 'saltar-recuento': clearTimeout(ui.timer); ui.rec = null; render(); return arriba();
      case 'compartir': return compartir();
      case 'salir': cerrarModal(); vista = 'inicio'; return render();
      case 'abandonar':
        if (!window.confirm('¿Abandonar esta campaña? Se borrará la partida guardada.')) return;
        almacen.borrar(); S = null; cerrarModal(); vista = 'inicio'; return render();
      default: return undefined;
    }
  }

  function compartir() {
    const t = textoCompartir(S.final);
    if (navigator.share) {
      navigator.share({ text: t }).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(t).then(() => toast('Resultado copiado'), () => abrirModal('<h2>Compartir</h2><pre style="white-space:pre-wrap">' + esc(t) + '</pre>'));
    } else {
      abrirModal('<h2>Compartir</h2><pre style="white-space:pre-wrap">' + esc(t) + '</pre>');
    }
  }

  $('#modal-cuerpo').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && b.dataset.accion) accion(b.dataset.accion);
  });
  $('#btn-mano').addEventListener('click', () => abrirModal(manoHTML()));
  $('#btn-menu').addEventListener('click', () => abrirModal(menuHTML()));
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });
  document.addEventListener('keydown', (e) => {
    if (vista !== 'juego' || !S || modal.open) return;
    if (ui.noche && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return accion('fin-noche'); }
    if (S.fase !== 'cartas') return;
    const cur = M.cartaActual(S);
    if (!cur) return;
    if (cur.inst.hecha && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); accion('siguiente-carta'); }
    else if (!cur.inst.hecha && e.key === 'ArrowLeft') elegir('a');
    else if (!cur.inst.hecha && e.key === 'ArrowRight') elegir('b');
  });

  // ---------- Arranque ----------

  render();
})();
