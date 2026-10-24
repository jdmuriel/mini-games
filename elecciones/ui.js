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

  const $ = (s, el) => (el || document).querySelector(s);
  const pantalla = $('#pantalla');
  const modal = $('#modal');

  let S = null;
  let vista = 'inicio';
  const ui = { partido: null, escenario: null, sel: null, modoMapa: 'lider', debateSel: null, debateObj: null, verDebate: false, oro: null, oroObj: null };

  // ---------- Utilidades ----------

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (x, d) => (Math.round(x * Math.pow(10, d == null ? 1 : d)) / Math.pow(10, d == null ? 1 : d)).toFixed(d == null ? 1 : d).replace('.', ',');
  const nombre = (p) => M.nombre(p);
  const color = (p) => P[p].color;
  const yo = () => S.jugador;

  const almacen = {
    leer() { try { const t = localStorage.getItem(CLAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; } },
    guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { /* sin persistencia */ } },
    borrar() { try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ } },
  };

  function toast(txt) {
    const t = $('#toast');
    t.textContent = txt;
    t.classList.add('visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('visible'), 2200);
  }

  function abrirModal(html) {
    $('#modal-cuerpo').innerHTML = html;
    if (typeof modal.showModal === 'function') modal.showModal();
    else modal.setAttribute('open', '');
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

  // ---------- Barra superior ----------

  function pintarBarra() {
    const barra = $('#barra');
    if (vista !== 'juego' || !S) { barra.hidden = true; return; }
    barra.hidden = false;
    const f = M.fecha(Math.min(S.dia, 21));
    const etapa = S.fase === 'final' ? 'Noche electoral' : S.dia === 21 ? 'Jornada de reflexión'
      : S.dia < M.CONFIG.DIA_CAMPANA ? 'Precampaña' : 'Campaña';
    $('#barra-dia').innerHTML = '<b>' + (S.fase === 'final' ? 'Domingo 29' : 'Día ' + S.dia + ' de 21') + '</b>' +
      esc(S.fase === 'final' ? etapa : f.semana + ' ' + f.dia + ' · ' + etapa);
    const m = S.met;
    $('#metros').innerHTML = [
      ['caja', '💶', 'Caja', m.caja < 10],
      ['animo', '🔥', 'Ánimo', m.animo < 20 || m.animo > 90],
      ['sospecha', '🕵️', 'Sospecha', m.sospecha > 75],
    ].map(([k, ic, t, al]) => '<div class="metro' + (al ? ' alerta' : '') + '" data-metro="' + k + '" title="' + t + '"><div><span>' + ic + '</span>' + m[k] + '</div><i style="width:' + m[k] + '%"></i></div>').join('');
    $('#btn-mano').textContent = '🃏 ' + S.mano.length;
    $('#btn-mano').style.borderColor = color(yo());
  }

  function marcarPistas(pistas) {
    document.querySelectorAll('.metro').forEach((el) => {
      el.classList.toggle('pista', !!(pistas && pistas[el.dataset.metro]));
    });
  }

  // ---------- Mapa ----------

  function colorRegion(c, modo) {
    const v = S.reg[c].v;
    if (modo === 'yo') {
      const dec = 100 - v.ind;
      const sh = v[yo()] / dec * 100;
      return { fill: color(yo()), op: 0.12 + 0.88 * Math.min(1, sh / 40) };
    }
    const orden = D.TODOS.slice().sort((a, b) => v[b] - v[a]);
    const margen = (v[orden[0]] - v[orden[1]]) / (100 - v.ind) * 100;
    return { fill: color(orden[0]), op: 0.45 + 0.55 * Math.min(1, margen / 12) };
  }

  function mapaSVG(opts) {
    const modo = opts.modo || 'lider';
    let s = '<svg viewBox="0 0 1000 860" role="img" aria-label="Mapa de España por comunidades">';
    s += '<rect class="marco" x="580" y="688" width="402" height="168" rx="10"/>';
    RIDS.forEach((c) => {
      const col = colorRegion(c, modo);
      const sel = opts.sel === c ? ' sel' : '';
      s += '<path class="ca' + sel + '" data-ca="' + c + '" d="' + MAPA[c].d + '" fill="' + col.fill + '" fill-opacity="' + col.op.toFixed(2) + '"><title>' + esc(R[c].nombre) + '</title></path>';
      if (c === 'ceu' || c === 'mel') {
        s += '<circle class="ca' + sel + '" data-ca="' + c + '" cx="' + MAPA[c].cx + '" cy="' + MAPA[c].cy + '" r="18" fill="' + col.fill + '" fill-opacity="' + col.op.toFixed(2) + '"><title>' + esc(R[c].nombre) + '</title></circle>';
      }
    });
    RIDS.forEach((c) => {
      const pos = posEtiqueta(c);
      if (opts.etiquetas) s += '<text class="etq" x="' + pos[0] + '" y="' + pos[1] + '">' + R[c].escanos + '</text>';
      const marcas = (opts.marcas && opts.marcas[c]) || [];
      marcas.forEach((m, i) => {
        if (m.emoji) s += '<text x="' + (pos[0] + (i - (marcas.length - 1) / 2) * 34) + '" y="' + (pos[1] - 36) + '" style="font-size:34px">' + m.emoji + '</text>';
        else s += '<circle cx="' + (pos[0] - 30 + i * 16) + '" cy="' + (pos[1] + 30) + '" r="9" fill="' + m.color + '" stroke="#fff" stroke-width="2"/>';
      });
    });
    return s + '</svg>';
  }

  function posEtiqueta(c) {
    if (c === 'can') return [780, 765];
    if (c === 'cnt') return [MAPA[c].cx, MAPA[c].cy + 6];
    return [MAPA[c].cx, MAPA[c].cy];
  }

  // ---------- Hemiciclo ----------

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
    let s = '<svg viewBox="0 0 400 210" role="img" aria-label="Hemiciclo">';
    let i = 0;
    D.ORDEN_HEMICICLO.forEach((p) => {
      for (let k = 0; k < total[p]; k++, i++) {
        const q = pts[i];
        s += '<circle cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="4.6" fill="' + color(p) + '"/>';
      }
    });
    s += '<text class="mayoria" x="200" y="196">Mayoría: 176</text>';
    return s + '</svg>';
  }

  function filaEscanos(total, modo) {
    return '<div class="escanos-fila">' + D.ORDEN_HEMICICLO.map((p) =>
      '<span style="background:' + color(p) + '">' + esc(etiqueta(p, modo)) + ' ' + total[p] + '</span>').join('') + '</div>';
  }

  // ---------- Pantallas: inicio y elección ----------

  function pintarInicio() {
    const guardada = almacen.leer();
    pantalla.innerHTML =
      '<section class="portada-juego">' +
      '<div class="urna">🗳️</div>' +
      '<div class="sello">Campaña<br><em>29-N</em></div>' +
      '<p>21 días, 350 escaños y ni una pizca de vergüenza.</p>' +
      '<div class="franja">' + ['fa', 'psoe', 'otros', 'pp', 'vox'].map((p) => '<span style="background:' + color(p) + '"></span>').join('') + '</div>' +
      '<div class="menu-inicio">' +
      (guardada && guardada.fase !== 'final' ? '<button class="boton primario" data-accion="continuar">Continuar partida (día ' + guardada.dia + ', ' + esc(nombre(guardada.jugador)) + ')</button>' : '') +
      '<button class="boton' + (guardada && guardada.fase !== 'final' ? '' : ' primario') + '" data-accion="nueva">Nueva partida</button>' +
      '<button class="boton" data-accion="ayuda">Cómo se juega</button>' +
      '</div>' +
      '<p class="nota" style="margin-top:22px">Sátira. Los partidos y candidatos son reales; los hechos, casi nunca. Todos reciben por igual.</p>' +
      '<a class="volver" href="../">&larr; Volver a Mini Juegos</a>' +
      '</section>';
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
      '<h1 class="titulo-pantalla">Nueva campaña</h1>' +
      '<p class="paso">1 · Elige partido</p><div class="rejilla">' + partidos + '</div>' +
      '<p class="paso" style="margin-top:16px">2 · Elige con qué encuesta empiezas</p>' + escenarios +
      '<div class="fila-botones"><button class="boton" data-accion="inicio">Volver</button>' +
      '<button class="boton primario" data-accion="empezar"' + (ui.partido && ui.escenario ? '' : ' disabled') + '>Empezar la campaña</button></div>';
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
    const marcas = {};
    po.mitinesAyer.filter((m) => m.rol === 'principal').forEach((m) => {
      (marcas[m.ca] = marcas[m.ca] || []).push({ color: color(m.p) });
    });
    let datos;
    if (modo === 'niebla') {
      const primero = M.lider(t, JUG);
      datos = '<div class="niebla">🌫️ Prohibido publicar encuestas.<br>Tu instinto dice que va primero ' + esc(M.el(primero)) + '. O no.</div>';
    } else {
      const orden = D.TODOS.slice().sort((a, b) => t[b] - t[a]);
      const cab = modo === 'andorra' ? '<tr><th>Mercado de frutas</th><th>€/kg</th><th>Cajas</th></tr>' : '<tr><th>Partido</th><th>Voto</th><th>Escaños</th></tr>';
      datos = '<div class="hemiciclo">' + hemicicloSVG(t) + filaEscanos(t, modo) + '</div>' +
        '<div class="seccion">' + (modo === 'andorra' ? 'Precios en origen (Andorra)' : 'Encuesta del día') + '</div>' +
        '<table class="tabla">' + cab + orden.map((p) => '<tr><td>' + puntoColor(p) + esc(etiqueta(p, modo)) + '</td><td>' + num(po.est[p]) + (modo === 'andorra' ? '' : ' %') + '</td><td>' + t[p] + deltas(p) + '</td></tr>').join('') +
        '<tr><td>Indecisos</td><td>' + num(po.est.ind) + ' %</td><td></td></tr></table>' +
        '<p class="nota">Bloque PP + Vox: <b>' + (t.pp + t.vox) + '</b> · PSOE + FA + otros: <b>' + (t.psoe + t.fa + t.otros) + '</b> · Mayoría: 176</p>';
    }
    const breves = po.breves.map((n) => '<li>' + (n.p ? puntoColor(n.p) : '') + '<b>' + esc(n.titular) + '</b>' + (n.cuerpo ? ' ' + esc(n.cuerpo) : '') + '</li>').join('');
    pantalla.innerHTML =
      '<article class="periodico">' +
      '<header class="cabecera"><div class="nombre">' + esc(po.periodico) + '</div>' +
      '<div class="meta"><span>' + esc(po.fecha) + '</span><span>Día ' + po.dia + ' de 21</span><span>1,50 €</span></div></header>' +
      '<h1 class="titular">' + esc(po.titular.titular) + '</h1>' +
      (po.titular.cuerpo ? '<p class="entradilla">' + esc(po.titular.cuerpo) + '</p>' : '') +
      '<div class="mapa" id="mapa-portada">' + mapaSVG({ modo: 'lider', marcas }) + '</div>' +
      '<div class="leyenda"><span>Color: quién va primero en cada comunidad (más intenso, más ventaja).</span>' +
      (po.mitinesAyer.length ? '<span>Puntos: mítines principales de ayer.</span>' : '') + '</div>' +
      datos +
      (breves ? '<div class="seccion">Breves</div><ul class="breves">' + breves + '</ul>' : '') +
      '</article>' +
      '<div class="fila-botones"><button class="boton primario ancho" data-accion="empezar-dia">' +
      (S.dia === 21 ? 'Pasar página: jornada de reflexión →' : 'Pasar página: las noticias del día →') + '</button></div>';
  }

  // ---------- Cartas ----------

  function textoPistas(op) {
    const pi = M.pistas(op);
    const ic = { votos: '🗳️', caja: '💶', animo: '🔥', sospecha: '🕵️' };
    return Object.keys(ic).filter((k) => pi[k]).map((k) => ic[k] + (pi[k] >= 12 ? '●' : '•')).join(' ');
  }

  function pintarCartas() {
    const cur = M.cartaActual(S);
    if (!cur) { M.siguienteCarta(S); return render(); }
    const { inst, def } = cur;
    const ctx = inst.ctx;
    const T = (s) => esc(M.texto(S, s, ctx));
    const total = S.hoy.cartas.length;
    let cuerpo = '<div class="icono">' + def.icono + '</div><h2>' + T(def.titulo) + '</h2><p>' + T(def.texto) + '</p>';
    let pie;
    if (inst.hecha) {
      const r = inst.resultado;
      const op = def[r.lado];
      cuerpo += '<div class="resultado"><div class="eleccion">Elegiste: ' + T(op.txt) +
        (r.exito === true ? ' · <span class="dado" style="color:var(--bien)">🎲 Salió bien</span>' : r.exito === false ? ' · <span class="dado" style="color:var(--mal)">🎲 Salió mal</span>' : '') + '</div>' +
        '<p>' + esc(r.texto) + '</p>' + chipsHTML(r.chips) + '</div>';
      pie = '<div class="fila-botones"><button class="boton primario ancho" data-accion="siguiente-carta">' +
        (S.hoy.idx + 1 < total ? 'Siguiente carta →' : S.dia === 21 ? 'A la reflexión →' : 'Preparar la agenda →') + '</button></div>';
    } else {
      cuerpo += '<div class="pista-lado a">← ' + T(def.a.txt) + '</div><div class="pista-lado b">' + T(def.b.txt) + ' →</div>';
      pie = '<div class="opciones">' + ['a', 'b'].map((l) => {
        const op = def[l];
        const coste = M.costeOpcion(op);
        const puede = M.puedeElegir(S, op);
        return '<button class="opcion ' + l + '" data-lado="' + l + '"' + (puede ? '' : ' disabled') + '>' +
          '<span class="flecha">' + (l === 'a' ? '← desliza' : 'desliza →') + '</span>' +
          '<span>' + T(op.txt) + '</span>' +
          '<span class="pistas">' + textoPistas(op) + (coste ? ' · 💶 −' + coste : '') + '</span>' +
          (op.azar != null ? '<span class="riesgo">🎲 Puede salir mal</span>' : '') +
          (puede ? '' : '<span class="riesgo">Sin fondos</span>') + '</button>';
      }).join('') + '</div>' +
        '<p class="nota" style="text-align:center">Los puntos indican qué se mueve (● mucho, • poco), no hacia dónde.</p>';
    }
    pantalla.innerHTML =
      '<p class="contador">Noticias del día · ' + (S.hoy.idx + 1) + ' de ' + total + '</p>' +
      '<div class="quien">' + esc(def.quien || '') + '</div>' +
      '<div class="mesa"><div class="carta" id="carta">' + cuerpo + '</div></div>' + pie;
    if (!inst.hecha) activarArrastre(def);
  }

  function chipsHTML(chips) {
    if (!chips || !chips.length) return '<p class="nota">Sin efectos visibles. De momento.</p>';
    return '<ul class="chips">' + chips.map((c) => '<li class="chip ' + (c.signo > 0 ? 'bien' : c.signo < 0 ? 'mal' : '') + '">' +
      (c.p ? puntoColor(c.p) : '') + esc(c.txt) + '</li>').join('') + '</ul>';
  }

  function elegir(lado) {
    const r = M.elegirOpcion(S, lado);
    if (!r) { toast('No tienes caja para eso'); return; }
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

  // ---------- Agenda ----------

  function estrellas(c) {
    const vals = RIDS.map((r) => M.valorMitin(S, yo(), r));
    const max = Math.max.apply(null, vals) || 1;
    const v = M.valorMitin(S, yo(), c) / max;
    const n = v > 0.66 ? 3 : v > 0.33 ? 2 : v > 0.08 ? 1 : 0;
    return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
  }

  function fichaRegion(c, conBotones) {
    const v = S.reg[c].v;
    const dec = 100 - v.ind;
    const modo = modoDatos();
    const escR = M.escanos(S).porRegion[c];
    const orden = D.TODOS.slice().sort((a, b) => v[b] - v[a]);
    const barras = modo === 'niebla' ? '<p class="nota">🌫️ Encuestas prohibidas. Solo sabes que va primero ' + esc(M.el(orden[0])) + '.</p>'
      : '<div class="barras-voto">' + orden.map((p) => '<div><span>' + puntoColor(p) + esc(etiqueta(p, modo)) + '</span><i class="barra" style="width:' + (v[p] / dec * 100) + '%;background:' + color(p) + '"></i><span>' + num(v[p] / dec * 100) + '% · ' + escR[p] + '</span></div>').join('') + '</div>';
    const h = M.hastio(S, yo(), c);
    const sinVisitar = S.dia - S.reg[c].ultimo[yo()];
    const rivalesAyer = S.mitines.filter((m) => m.dia === S.dia - 1 && m.ca === c && m.p !== yo());
    const der = M.DER[c];
    const datos = [
      'Indecisos: <b>' + (modo === 'niebla' ? '?' : num(v.ind) + ' %') + '</b> · Gobierno autonómico: ' + esc(R[c].gob === 'otros' ? R[c].otrosAqui : nombre(R[c].gob)),
      'Ideología: <div class="termometro"><b style="left:calc(' + (der * 100).toFixed(0) + '% - 2px)"></b></div>',
      'Potencial de un mitin tuyo: <span class="estrellas">' + estrellas(c) + '</span>',
      h < 1 ? (h <= 0 ? '😩 <b>Hastío total</b>: un mitin aquí restaría votos.' : '😒 Hastío: tus mítines recientes aquí rinden un ' + Math.round(h * 100) + ' %.') : '',
      sinVisitar >= M.CONFIG.OLVIDO_DIAS ? '🧊 Llevas ' + sinVisitar + ' días sin venir: tus votantes se enfrían.' : '',
      rivalesAyer.length ? 'Ayer estuvieron: ' + rivalesAyer.map((m) => puntoColor(m.p) + esc(nombre(m.p))).join(', ') : '',
      c === 'cat' || c === 'pvs' || c === 'nav' ? 'Aquí «otros» son ' + esc(R[c].otrosAqui) + '.' : '',
    ].filter(Boolean).map((t) => '<li>' + t + '</li>').join('');
    let botones = '';
    if (conBotones) {
      botones = '<div class="botones">' +
        '<button class="boton' + (S.agenda.principal === c ? ' primario' : '') + '" data-mitin="principal" data-ca="' + c + '">🎤 Mitin de ' + esc(P[yo()].candCorto) + '</button>' +
        '<button class="boton' + (S.agenda.secundario === c ? ' primario' : '') + '" data-mitin="secundario" data-ca="' + c + '">📢 Mitin de tu nº2</button></div>';
    }
    return '<div class="ficha"><h3>' + esc(R[c].nombre) + ' <small>' + R[c].escanos + ' escaños</small></h3>' + barras +
      '<ul class="datos">' + datos + '</ul>' + botones + '</div>';
  }

  function pintarAgenda() {
    const marcas = {};
    if (S.agenda.principal) (marcas[S.agenda.principal] = marcas[S.agenda.principal] || []).push({ emoji: '🎤' });
    if (S.agenda.secundario) (marcas[S.agenda.secundario] = marcas[S.agenda.secundario] || []).push({ emoji: '📢' });
    S.mitines.filter((m) => m.dia === S.dia - 1 && m.p !== yo() && m.rol === 'principal').forEach((m) => {
      (marcas[m.ca] = marcas[m.ca] || []).push({ color: color(m.p) });
    });
    const slot = (rol, ic, quien) => {
      const c = S.agenda[rol];
      return '<button class="slot' + (c ? ' listo' : '') + '" style="--c:' + color(yo()) + '" data-slot="' + rol + '">' +
        '<small>' + ic + ' ' + esc(quien) + '</small><b>' + (c ? esc(R[c].nombre) : 'Toca una comunidad') + '</b></button>';
    };
    const avisos = [];
    if (S.dia === M.CONFIG.DIA_CIERRE) avisos.push('🎆 <b>Cierre de campaña</b>: hoy los mítines valen ×1,8. Si todos vais al mismo sitio, nadie sale en la tele.');
    if (S.dia === M.CONFIG.DIA_DEBATE) avisos.push('🎙️ Esta noche es el <b>debate a cuatro</b>. Después de la agenda, al plató.');
    if (S.dia === 1) avisos.push('Elige dónde dan hoy el mitin tu candidato (🎤, vale el doble) y tu nº2 (📢). Los puntos de color son los mítines de los rivales ayer.');
    const mt = M.escanos(S).total;
    const lista = RIDS.slice().sort((a, b) => R[b].escanos - R[a].escanos).map((c) =>
      '<button data-ca="' + c + '"><span>' + esc(R[c].nombre) + '</span><span>' + R[c].escanos + ' esc.</span><span class="estrellas">' + estrellas(c) + '</span></button>').join('');
    pantalla.innerHTML =
      '<h1 class="titulo-pantalla">Agenda del día</h1>' +
      avisos.map((a) => '<div class="aviso">' + a + '</div>').join('') +
      '<div class="slots">' + slot('principal', '🎤', P[yo()].candCorto + ' (candidato)') + slot('secundario', '📢', 'Tu nº2') + '</div>' +
      '<div class="fila-botones" style="margin-top:8px">' +
      '<button class="boton" style="min-height:36px;padding:4px 12px;font-size:.82rem" data-modo-mapa="lider" aria-pressed="' + (ui.modoMapa === 'lider') + '">' + (ui.modoMapa === 'lider' ? '● ' : '') + 'Quién gana</button>' +
      '<button class="boton" style="min-height:36px;padding:4px 12px;font-size:.82rem" data-modo-mapa="yo" aria-pressed="' + (ui.modoMapa === 'yo') + '">' + (ui.modoMapa === 'yo' ? '● ' : '') + 'Tu voto</button></div>' +
      '<div class="mapa" id="mapa-agenda">' + mapaSVG({ modo: modoDatos() === 'niebla' ? 'lider' : ui.modoMapa, sel: ui.sel, marcas, etiquetas: true }) + '</div>' +
      '<p class="nota">Número: escaños de cada comunidad. ' + (modoDatos() === 'niebla' ? '' : 'Hoy tendrías <b>' + mt[yo()] + '</b> escaños.') + '</p>' +
      (ui.sel ? fichaRegion(ui.sel, true) : '<div class="ficha"><p class="nota" style="margin:0">Toca una comunidad en el mapa o en la lista para ver sus datos y montar el mitin.</p></div>') +
      '<details class="lista-ca"><summary>Lista de comunidades</summary>' + lista + '</details>' +
      '<div class="cerrar-dia"><button class="boton primario ancho" data-accion="cerrar-dia"' + (S.agenda.principal && S.agenda.secundario ? '' : ' disabled') + '>' +
      (S.agenda.principal && S.agenda.secundario ? 'Cerrar el día ▶' : 'Faltan mítines por colocar') + '</button></div>';
  }

  function ponerMitin(rol, c) {
    S.agenda[rol] = c;
    almacen.guardar();
    pintarAgenda();
  }

  function cerrarDia() {
    if (S.agenda.principal === S.agenda.secundario) toast('Dos mítines en el mismo sitio se pisan…');
    M.cerrarDia(S);
    ui.sel = null;
    almacen.guardar();
    render();
    arriba();
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
    if (ui.verDebate) {
      const orden = JUG.slice().sort((a, b) => d.flash[b] - d.flash[a]);
      pantalla.innerHTML = '<h1 class="titulo-pantalla">Encuesta flash: ¿quién ha ganado?</h1>' + atrilesHTML(d, ultima) + log +
        '<div class="flash">' + orden.map((p) => '<div><span>' + esc(P[p].candCorto) + '</span><i style="width:' + d.flash[p] + '%;background:' + color(p) + '"></i><b>' + d.flash[p] + ' %</b></div>').join('') + '</div>' +
        '<p>' + (d.ganador === yo() ? '🏆 ¡Has ganado el debate! Tus bases están eufóricas.' : 'El debate lo gana ' + esc(P[d.ganador].candCorto) + '.') + '</p>' +
        chipsHTML(d.chips) +
        '<div class="fila-botones"><button class="boton primario ancho" data-accion="fin-debate">Ver la portada de mañana →</button></div>';
      return;
    }
    const ronda = M.RONDAS[d.ronda];
    const cab = '<h1 class="titulo-pantalla">Debate a cuatro · ' + (d.ronda + 1) + '/4</h1>' +
      '<p class="paso">' + esc(ronda.nombre) + '</p>';
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
      pantalla.innerHTML = cab + atrilesHTML(d, ultima) + log +
        '<p class="reglas-debate">⚔️ Ataque gana a 💡 Propuesta · 💡 Propuesta gana a 🛡️ Réplica · 🛡️ Réplica gana a ⚔️ Ataque.<br>' +
        'Quien va primero (' + esc(P[d.lider].candCorto) + ') suele recibir los ataques.</p>' +
        '<p class="paso">Tu mano</p><div class="mano">' + cartas + '</div>' + objetivos +
        '<div class="fila-botones"><button class="boton primario ancho" data-accion="jugar-ronda"' + (listo ? '' : ' disabled') + '>Jugar carta</button></div>';
    } else {
      const ops = Object.keys(M.ORO).map((k) => '<button class="carta-mano" data-oro="' + k + '" aria-pressed="' + (ui.oro === k) + '"><b>' + esc(M.ORO[k].nombre) + '</b>' + esc(M.ORO[k].texto) + '</button>').join('');
      const objetivos = ui.oro === 'ataque' ? '<p class="paso">¿A quién rematas?</p><div class="objetivos">' + JUG.filter((p) => p !== yo()).map((p) =>
        '<button class="boton" style="--c:' + color(p) + '" data-oro-obj="' + p + '" aria-pressed="' + (ui.oroObj === p) + '">' + esc(P[p].candCorto) + '</button>').join('') + '</div>' : '';
      const listo = ui.oro && (ui.oro !== 'ataque' || ui.oroObj);
      pantalla.innerHTML = cab + atrilesHTML(d, ultima) + log +
        '<p>Último minuto, mirando a cámara. ¿Cómo cierras?</p><div class="mano">' + ops + '</div>' + objetivos +
        '<div class="fila-botones"><button class="boton primario ancho" data-accion="jugar-oro"' + (listo ? '' : ' disabled') + '>Cerrar el debate</button></div>';
    }
  }

  // ---------- Reflexión ----------

  function pintarReflexion() {
    const r = S.reflexion;
    const ctx = { obj: P[yo()].antagonista };
    if (r && r.hecha) {
      pantalla.innerHTML = '<h1 class="titulo-pantalla">Jornada de reflexión</h1>' +
        '<div class="ficha"><h3>' + esc(r.carta.nombre) + ' <small>' + (r.sale ? '🎲 Salió bien' : '🎲 Salió mal') + '</small></h3><p>' + esc(r.texto) + '</p>' + chipsHTML(r.chips) + '</div>' +
        '<p class="paso" style="margin-top:14px">Mientras tanto, los rivales…</p>' +
        (r.ia.length ? '<ul class="log">' + r.ia.map((x) => '<li>' + puntoColor(x.p) + esc(x.txt) + '</li>').join('') + '</ul>' : '<p class="nota">Los rivales cumplen la ley. Sospechoso.</p>') +
        '<div class="fila-botones"><button class="boton primario ancho" data-accion="urnas">🗳️ Abrir las urnas</button></div>';
      return;
    }
    const ops = M.opcionesReflexion(S).map((c) => '<button class="opcion-reflexion" data-reflexion="' + c.id + '"><b>' + esc(c.nombre) + '</b>' +
      '<span>' + esc(M.texto(S, c.texto, ctx)) + '</span><br><small>Riesgo de que salga mal: ' + Math.round((c.riesgo || 0) * 100) + ' %' + (c.basica ? '' : ' · carta de tu mano') + '</small></button>').join('');
    pantalla.innerHTML = '<h1 class="titulo-pantalla">Jornada de reflexión</h1>' +
      '<p>Sábado 28. No hay mítines ni propaganda. En teoría. Puedes jugar <b>una</b> carta: las de tu mano son muy potentes, pero si salen mal, el efecto se da la vuelta.</p>' +
      ops;
  }

  // ---------- Final ----------

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
      'Promesas: ' + M.formatoMillones(S.promesas) + '\n' + location.href.split('#')[0];
  }

  function pintarFinal() {
    const f = S.final;
    const t = f.esc.total;
    const orden = D.TODOS.slice().sort((a, b) => t[b] - t[a]);
    const tabla = '<table class="tabla">' + '<tr><th>Partido</th><th>Voto</th><th>Escaños</th><th>vs. inicio</th></tr>' + orden.map((p) => {
      const d = t[p] - S.escInicio[p];
      return '<tr><td>' + puntoColor(p) + esc(nombre(p)) + (p === yo() ? ' (tú)' : '') + '</td><td>' + num(f.est[p]) + ' %</td><td><b>' + t[p] + '</b></td><td>' +
        (d > 0 ? '<span class="sube">+' + d + '</span>' : d < 0 ? '<span class="baja">' + d + '</span>' : '=') + '</td></tr>';
    }).join('') + '</table>';
    const gob = f.gobierno === 'der' ? 'Gobierno de derechas (PP + Vox: ' + f.der + ')' : f.gobierno === 'izq' ? 'Gobierno de izquierdas con apoyos variados (y caros): ' + f.izq : 'Bloqueo: repetición electoral';
    pantalla.innerHTML =
      '<p class="paso" style="text-align:center">Noche electoral · domingo 29 de noviembre</p>' +
      '<div class="medalla">' + MEDALLAS[f.medalla] + '</div>' +
      '<h1 class="veredicto">' + { triunfo: '¡Triunfo histórico!', victoria: 'Victoria', digna: 'Derrota digna', debacle: 'Debacle' }[f.medalla] + '</h1>' +
      '<p class="gobierno">' + esc(veredicto(f)) + '</p>' +
      '<article class="periodico">' +
      '<header class="cabecera"><div class="nombre">' + esc(M.PERIODICOS[0]) + '</div><div class="meta"><span>lunes 30 de noviembre</span><span>Edición especial</span><span>2 €</span></div></header>' +
      '<h2 class="titular">' + esc(titularFinal(f)) + '</h2>' +
      '<p class="entradilla">' + esc(gob) + '. Tu partido, ' + esc(M.el(yo())) + ', saca ' + t[yo()] + ' escaños. Has prometido ' + esc(M.formatoMillones(S.promesas)) + '; el déficit te manda saludos.</p>' +
      '<div class="hemiciclo">' + hemicicloSVG(t) + filaEscanos(t, 'normal') + '</div>' +
      '<div class="mapa">' + mapaSVG({ modo: 'lider' }) + '</div>' +
      '<div class="seccion">Resultados</div>' + tabla +
      '<p class="nota">El escrutinio se desvía de la última encuesta por el margen de error: nunca acierta del todo.</p>' +
      '</article>' +
      '<div class="fila-botones"><button class="boton" data-accion="compartir">Compartir</button><button class="boton primario" data-accion="nueva">Otra campaña</button></div>' +
      '<a class="volver" href="../">&larr; Volver a Mini Juegos</a>';
  }

  // ---------- Modales ----------

  function ayudaHTML() {
    return '<h2>Cómo se juega</h2><ul>' +
      '<li><b>21 días</b> hasta el 29-N. Cada día: lees la <b>portada</b>, decides en las <b>cartas</b> (desliza o pulsa) y montas la <b>agenda</b>.</li>' +
      '<li><b>Mítines</b>: tu candidato (🎤) y tu nº2 (📢, la mitad de efecto) convencen a los indecisos de una comunidad. Rinden más donde ya tienes mucha gente.</li>' +
      '<li><b>No repitas</b>: cada mitin tuyo en la misma comunidad en los últimos 3 días resta un 35 %. Al cuarto, aburres y pierdes votos.</li>' +
      '<li><b>No abandones</b>: si pasas 4 días sin ir a una comunidad, tus votantes de allí se enfrían.</li>' +
      '<li><b>Ruido</b>: si los rivales dan mitin el mismo día en el mismo sitio, la tele se reparte y rinde menos.</li>' +
      '<li><b>Escaños</b>: cada comunidad los reparte en proporción a los votos decididos (los indecisos no cuentan). Mayoría: 176.</li>' +
      '<li><b>💶 Caja</b> paga opciones. <b>🔥 Ánimo</b> multiplica tus mítines (a 100, euforia peligrosa). <b>🕵️ Sospecha</b> sube con el juego sucio: a 100, estalla un escándalo.</li>' +
      '<li><b>🃏 Mano</b>: algunas cartas se guardan para el <b>debate</b> (día 16) o la <b>jornada de reflexión</b> (día 21).</li>' +
      '<li><b>Debate</b>: ⚔️ Ataque gana a 💡 Propuesta, 💡 a 🛡️ Réplica, 🛡️ a ⚔️.</li>' +
      '<li><b>Días clave</b>: huelga general (4), cara a cara (9), debate (16), veto de encuestas (17), cierre ×1,8 (20), reflexión (21).</li>' +
      '<li><b>Objetivo</b>: gobernar. PP+Vox o PSOE+FA+otros necesitan 176. Si no, al menos mejorar tus escaños.</li>' +
      '</ul>';
  }

  function manoHTML() {
    if (!S.mano.length) return '<h2>Tu mano</h2><p>Vacía. Algunas cartas te dejan guardar cosas para el debate o para la jornada de reflexión.</p>';
    return '<h2>Tu mano (' + S.mano.length + '/' + M.CONFIG.MANO_MAX + ')</h2><ul>' + S.mano.map((id) => {
      const c = M.cartaMano(id);
      if (c.clase === 'debate') return '<li>' + ICONO_TIPO[c.tipo] + ' <b>' + esc(c.nombre) + '</b> · debate · fuerza ' + c.fuerza + (c.tema ? ' · ' + TEMA[c.tema] : '') + '<br><small>' + esc(c.texto) + '</small></li>';
      return '<li>🌙 <b>' + esc(c.nombre) + '</b> · jornada de reflexión · riesgo ' + Math.round(c.riesgo * 100) + ' %<br><small>' + esc(M.texto(S, c.texto, {})) + '</small></li>';
    }).join('') + '</ul><p class="nota">Si guardas una sexta carta, se pierde la más antigua.</p>';
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
    if (ds.slot) { toast('Toca una comunidad y elige el mitin'); return; }
    if (ds.modoMapa) { ui.modoMapa = ds.modoMapa; return pintarAgenda(); }
    if (ds.mitin) return ponerMitin(ds.mitin, ds.ca);
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
      if (vista === 'juego' && S.fase === 'agenda') {
        ui.sel = ds.ca;
        pintarAgenda();
        const f = $('.ficha');
        if (f && e.target.closest('.lista-ca')) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (vista === 'juego' && S.fase !== 'final') abrirModal(fichaRegion(ds.ca, false));
    }
  });

  function accion(a) {
    switch (a) {
      case 'nueva': ui.partido = null; ui.escenario = null; vista = 'eleccion'; cerrarModal(); render(); return arriba();
      case 'inicio': vista = 'inicio'; return render();
      case 'continuar':
        S = almacen.leer();
        if (!S || S.version !== 1) { S = null; toast('No se pudo cargar la partida'); return render(); }
        return irJuego();
      case 'ayuda': return abrirModal(ayudaHTML());
      case 'empezar':
        S = M.nuevaPartida({ partido: ui.partido, escenario: ui.escenario });
        almacen.guardar();
        return irJuego();
      case 'empezar-dia': M.empezarDia(S); almacen.guardar(); render(); return arriba();
      case 'siguiente-carta': M.siguienteCarta(S); almacen.guardar(); render(); return arriba();
      case 'cerrar-dia': return cerrarDia();
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
      case 'urnas': M.calcularFinal(S); almacen.guardar(); render(); return arriba();
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
    if (vista !== 'juego' || !S || S.fase !== 'cartas' || modal.open) return;
    const cur = M.cartaActual(S);
    if (!cur) return;
    if (cur.inst.hecha && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); accion('siguiente-carta'); }
    else if (!cur.inst.hecha && e.key === 'ArrowLeft') elegir('a');
    else if (!cur.inst.hecha && e.key === 'ArrowRight') elegir('b');
  });

  // ---------- Arranque ----------

  render();
})();
