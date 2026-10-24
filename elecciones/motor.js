// Motor de Campaña 29-N: lógica pura, sin DOM. Las reglas y los números están en dev/campana/DISENO.md.
// Funciona en el navegador (window) y en Node (dev/tools/simular.js lo carga con vm).
(function (root) {
  'use strict';

  const D = root.DATOS;
  const P = D.PARTIDOS;
  const R = D.REGIONES;
  const RIDS = Object.keys(R);
  const JUG = D.JUGABLES;
  const TODOS = D.TODOS;

  const CONFIG = {
    DIAS: 21,
    DIA_HUELGA_GENERAL: 4,
    DIA_CAMPANA: 6,
    DIA_CARA_A_CARA: 9,
    DIA_DEBATE: 16,
    DIA_VETO: 17,
    DIA_CIERRE: 20,
    DIA_REFLEXION: 21,
    METODO: 'proporcional', // o 'dhondt'
    INDECISOS: 18,
    RUIDO_INICIO: 0.5,
    MITIN: 1.6,
    TAMANO_REF: 25,
    TAMANO_MIN: 0.45,
    TAMANO_MAX: 1.25,
    IMPLANTACION_REF: 25,
    IMPLANTACION_EXP: 1,
    IMPLANTACION_MIN: 0.3,
    IMPLANTACION_MAX: 1.3,
    ROL: { principal: 1, secundario: 0.5, mismoSitio: 0.25 },
    DE_INDECISOS: 1.0,
    HASTIO: 0.35,
    HASTIO_DIAS: 3,
    HASTIO_MIN: -0.4,
    ATENCION: 0.3,
    CIERRE: 1.8,
    OLVIDO_DIAS: 4,
    OLVIDO: 0.008,
    CRISTALIZA: 0.012,
    CARTAS_DIA: 2,
    MANO_MAX: 5,
    MET_INICIO: { caja: 50, animo: 60, sospecha: 25 },
    CAJA_NOCHE: 4,
    ANIMO_NOCHE: -1,
    ANIMO_ESCANOS: 3,
    SOSPECHA_NOCHE: -1,
    ESCANDALO: 2,
    PROB_SUCESO: 0.6,
    IA_CARTAS: 0.12,
    HUELGA_CA: 2,
    DEBATE_FACTOR: 0.12,
    DEBATE_MAX: 1.2,
    REFLEXION_IA: 0.3,
    MARGEN_ERROR: 0.8,
    MAYORIA: 176,
  };

  const PERIODICOS = ['El Pregonero', 'Diario Equidistante', 'La Gaceta del Cuñado', 'El Bulo Matutino',
    'La Voz de la Barra del Bar', 'El Tertuliano', 'Heraldo del Titular', 'El Faro de la Mañana'];
  const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // ---------- Azar con semilla (mulberry32), estado guardado en S.rng ----------

  function rnd(S) {
    let t = (S.rng = (S.rng + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const entre = (S, a, b) => a + (b - a) * rnd(S);
  function normal(S) {
    const u = Math.max(1e-9, rnd(S)), v = rnd(S);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function elegirPeso(S, items, peso) {
    const pesos = items.map(peso);
    const total = pesos.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;
    let x = rnd(S) * total;
    for (let i = 0; i < items.length; i++) {
      x -= pesos[i];
      if (x <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r1 = (x) => Math.round(x * 10) / 10;

  // ---------- Datos fijos derivados ----------

  const CENSO_TOTAL = RIDS.reduce((s, c) => s + R[c].censo, 0);
  const DER = {};
  RIDS.forEach((c) => {
    const v = R[c].v2023;
    DER[c] = (v.pp + v.vox) / (v.pp + v.vox + v.psoe + v.fa);
  });
  const DER_NAT = RIDS.reduce((s, c) => s + DER[c] * R[c].censo, 0) / CENSO_TOTAL;

  // ---------- Partida nueva ----------

  function construirVoto(escenario, S) {
    const obj = D.ESCENARIOS[escenario].voto;
    const v = {};
    RIDS.forEach((c) => { v[c] = Object.assign({}, R[c].v2023); });
    for (let it = 0; it < 30; it++) {
      TODOS.forEach((p) => {
        const nat = RIDS.reduce((s, c) => s + v[c][p] * R[c].censo, 0) / CENSO_TOTAL;
        const f = obj[p] / nat;
        RIDS.forEach((c) => { v[c][p] *= f; });
      });
      RIDS.forEach((c) => {
        const t = TODOS.reduce((s, p) => s + v[c][p], 0);
        TODOS.forEach((p) => { v[c][p] *= 100 / t; });
      });
    }
    RIDS.forEach((c) => {
      TODOS.forEach((p) => { v[c][p] = Math.max(0.3, v[c][p] + (S ? entre(S, -1, 1) * CONFIG.RUIDO_INICIO : 0)); });
      const t = TODOS.reduce((s, p) => s + v[c][p], 0);
      const dec = 100 - CONFIG.INDECISOS;
      TODOS.forEach((p) => { v[c][p] = v[c][p] * dec / t; });
      v[c].ind = CONFIG.INDECISOS;
    });
    return v;
  }

  function nuevaPartida(opts) {
    const S = {
      version: 1,
      rng: (opts.semilla >>> 0) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0),
      jugador: opts.partido,
      escenario: opts.escenario,
      ia: !!opts.ia, // todo automático (simulador)
      dia: 1,
      fase: 'portada',
      reg: {},
      met: Object.assign({}, CONFIG.MET_INICIO),
      mano: [],
      promesas: 0,
      campanas: [],
      prog: [],
      huelgas: [],
      usadas: {},
      cola: [],
      flags: {},
      mitines: [],
      agenda: { principal: null, secundario: null },
      noticias: [],
      historia: [],
      hoy: null,
      portada: null,
      debate: null,
      reflexion: null,
      final: null,
    };
    const v = construirVoto(opts.escenario, S);
    RIDS.forEach((c) => {
      const ultimo = {};
      JUG.forEach((p) => { ultimo[p] = 0; });
      S.reg[c] = { v: v[c], ultimo };
    });
    S.escInicio = escanos(S).total;
    S.historia.push({ dia: 0, esc: S.escInicio, est: estimacion(S) });
    const e = D.ESCENARIOS[S.escenario];
    noticia(S, 100, 'Arranca la carrera hacia el 29-N',
      'Según ' + e.corto + ': ' + resumenEncuesta(S) + '. Quedan 21 días.');
    portadaDelDia(S);
    prepararDia(S);
    return S;
  }

  // ---------- Votos, escaños y estimaciones ----------

  function nacional(S) {
    const n = { ind: 0 };
    TODOS.forEach((p) => { n[p] = 0; });
    RIDS.forEach((c) => {
      const w = R[c].censo / CENSO_TOTAL;
      TODOS.forEach((p) => { n[p] += S.reg[c].v[p] * w; });
      n.ind += S.reg[c].v.ind * w;
    });
    return n;
  }

  // Porcentaje sobre voto decidido (lo que publica una encuesta).
  function estimacion(S) {
    const n = nacional(S);
    const dec = 100 - n.ind;
    const e = {};
    TODOS.forEach((p) => { e[p] = n[p] * 100 / dec; });
    e.ind = n.ind;
    return e;
  }

  function repartir(votos, escanosC) {
    const res = {};
    TODOS.forEach((p) => { res[p] = 0; });
    if (CONFIG.METODO === 'dhondt') {
      for (let i = 0; i < escanosC; i++) {
        let mejor = null, mv = -1;
        TODOS.forEach((p) => {
          const q = votos[p] / (res[p] + 1);
          if (q > mv) { mv = q; mejor = p; }
        });
        res[mejor]++;
      }
      return res;
    }
    const total = TODOS.reduce((s, p) => s + votos[p], 0);
    const restos = [];
    let asignados = 0;
    TODOS.forEach((p) => {
      const cuota = votos[p] * escanosC / total;
      res[p] = Math.floor(cuota);
      asignados += res[p];
      restos.push([p, cuota - res[p]]);
    });
    restos.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < escanosC - asignados; i++) res[restos[i][0]]++;
    return res;
  }

  function escanos(S) {
    const total = {};
    const porRegion = {};
    TODOS.forEach((p) => { total[p] = 0; });
    RIDS.forEach((c) => {
      porRegion[c] = repartir(S.reg[c].v, R[c].escanos);
      TODOS.forEach((p) => { total[p] += porRegion[c][p]; });
    });
    return { total, porRegion };
  }

  function lider(obj, lista) {
    return (lista || TODOS).reduce((a, b) => (obj[b] > obj[a] ? b : a));
  }

  function liderRegion(S, c) {
    return lider(S.reg[c].v);
  }

  function resumenEncuesta(S) {
    const e = estimacion(S);
    return JUG.slice().sort((a, b) => e[b] - e[a])
      .map((p) => nombre(p) + ' ' + r1(e[p]).toString().replace('.', ',') + ' %').join(', ');
  }

  // ---------- Movimientos de voto ----------

  // Mueve hasta n puntos de "de" a "a" en la comunidad c. Ningún valor baja de 0,1.
  function mover(S, c, de, a, n) {
    if (!(n > 0)) return 0;
    const v = S.reg[c].v;
    const m = Math.min(n, Math.max(0, v[de] - 0.1));
    v[de] -= m;
    v[a] += m;
    return m;
  }

  function regionesDe(S, ca, ctx) {
    if (!ca || ca === 'nat') return null;
    if (ca === 'ca') return ctx && ctx.ca ? [ctx.ca] : null;
    return Array.isArray(ca) ? ca : [ca];
  }

  // Movilizar (n>0, indecisos → p) o desmovilizar (n<0, p → indecisos).
  // Los efectos se escriben para un partido del 25 %; se escalan con √(tamaño/25) para no favorecer
  // a los pequeños (con reparto proporcional, dar los mismos puntos a todos beneficia al pequeño).
  function tamano(S, p) {
    return clamp(Math.sqrt(estimacion(S)[p] / CONFIG.TAMANO_REF), CONFIG.TAMANO_MIN, CONFIG.TAMANO_MAX);
  }

  function movilizar(S, p, n, ca, ctx, bruto) {
    if (!bruto) n *= tamano(S, p);
    const regs = regionesDe(S, ca, ctx);
    if (regs) {
      regs.forEach((c) => {
        if (n > 0) mover(S, c, 'ind', p, n);
        else mover(S, c, p, 'ind', -n);
      });
      return;
    }
    const nat = nacional(S)[p] || 0.1;
    RIDS.forEach((c) => {
      const k = Math.abs(n) * S.reg[c].v[p] / nat;
      if (n > 0) mover(S, c, 'ind', p, k);
      else mover(S, c, p, 'ind', k);
    });
  }

  function trasvasar(S, de, a, n, ca, ctx) {
    if (n < 0) { const t = de; de = a; a = t; n = -n; }
    const regs = regionesDe(S, ca, ctx);
    if (regs) { regs.forEach((c) => mover(S, c, de, a, n)); return; }
    const nat = nacional(S)[de] || 0.1;
    RIDS.forEach((c) => mover(S, c, de, a, n * S.reg[c].v[de] / nat));
  }

  // Movilización de bloque: pesa más donde ese bloque es fuerte (termómetro ideológico fijo).
  function bloque(S, lado, n, ca, ctx) {
    const partidos = lado === 'der' ? ['pp', 'vox'] : ['psoe', 'fa'];
    const regs = regionesDe(S, ca, ctx) || RIDS;
    regs.forEach((c) => {
      const f = lado === 'der' ? DER[c] / DER_NAT : (1 - DER[c]) / (1 - DER_NAT);
      const v = S.reg[c].v;
      const t = partidos.reduce((s, p) => s + v[p], 0) || 1;
      partidos.forEach((p) => {
        const k = Math.abs(n) * f * v[p] / t;
        if (n > 0) mover(S, c, 'ind', p, k);
        else mover(S, c, p, 'ind', k);
      });
    });
  }

  // ---------- Textos ----------

  function nombre(p) { return P[p].corto || P[p].nombre; }

  // Nombre con artículo para la prosa: «el PSOE», «Vox», «del PP», «a Vox».
  const ARTICULO = { psoe: 'el PSOE', pp: 'el PP', vox: 'Vox', fa: 'el Frente Amplio', otros: 'los demás' };
  const el = (p) => ARTICULO[p];
  const del = (p) => (el(p).indexOf('el ') === 0 ? 'del ' + el(p).slice(3) : el(p).indexOf('los ') === 0 ? 'de ' + el(p) : 'de ' + el(p));
  const al = (p) => (el(p).indexOf('el ') === 0 ? 'al ' + el(p).slice(3) : 'a ' + el(p));
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  function partidoEnTexto(str, marca, p) {
    return str
      .replace(new RegExp('\\bde \\{' + marca + '\\}', 'g'), del(p))
      .replace(new RegExp('\\ba \\{' + marca + '\\}', 'g'), al(p))
      .replace(new RegExp('\\{' + marca + 'N\\}', 'g'), P[p].nombre)
      .replace(new RegExp('\\{' + marca + '\\}', 'g'), el(p));
  }

  function mayusculas(t) {
    return t.replace(/(^|[.!?]\s+|[¿¡])(el|del|al) /g, (m, a, b) => a + cap(b) + ' ');
  }

  function texto(S, str, ctx) {
    if (!str) return '';
    ctx = ctx || {};
    const yo = S.jugador;
    const obj = ctx.obj || P[yo].antagonista;
    const ca = R[ctx.ca] ? ctx.ca : null;
    const gobca = ca ? R[ca].gob : null;
    str = str
      .replace(/\{CAND\}/g, P[yo].candCorto)
      .replace(/\{OBJCAND\}/g, P[obj].candCorto || nombre(obj))
      .replace(/\{ANTCAND\}/g, P[P[yo].antagonista].candCorto);
    str = partidoEnTexto(partidoEnTexto(partidoEnTexto(str, 'YO', yo), 'OBJ', obj), 'ANT', P[yo].antagonista);
    return mayusculas(str
      .replace(/\{GOBCA\}/g, gobca ? (gobca === 'otros' ? 'el gobierno autonómico' : 'el gobierno autonómico ' + del(gobca)) : 'el Gobierno')
      .replace(/\{CA\}/g, ca ? R[ca].nombre : 'España')
      .replace(/\{OTROSCA\}/g, ca ? R[ca].otrosAqui : 'los partidos pequeños'));
  }

  function noticia(S, peso, titular, cuerpo, p) {
    S.noticias.push({ peso, titular, cuerpo: cuerpo || '', p: p || null });
  }

  // ---------- Fechas ----------

  function fecha(dia) {
    const d = new Date(2026, 10, 7 + dia);
    return { semana: DIAS_SEM[d.getDay()], dia: d.getDate(), texto: DIAS_SEM[d.getDay()] + ' ' + d.getDate() + ' de noviembre' };
  }

  // ---------- Efectos de cartas ----------

  function quien(S, w, ctx) {
    if (w === 'yo') return [S.jugador];
    if (w === 'obj') return [ctx.obj];
    if (w === 'gob') return ['psoe'];
    if (w === 'gobca') return ctx.ca ? [R[ctx.ca].gob] : [];
    if (w === 'ant') return [P[S.jugador].antagonista];
    if (w === 'rivales') return JUG.filter((p) => p !== S.jugador);
    if (w === 'todos') return JUG.slice();
    return [w];
  }

  function aplicarEfectos(S, efs, ctx) {
    (efs || []).forEach((e) => {
      if (e.mov) quien(S, e.mov, ctx).forEach((p) => movilizar(S, p, e.n, e.ca, ctx));
      if (e.tras) {
        const de = quien(S, e.tras[0], ctx)[0], a = quien(S, e.tras[1], ctx)[0];
        if (de && a && de !== a) trasvasar(S, de, a, e.n, e.ca, ctx);
      }
      if (e.bloque) bloque(S, e.bloque, e.n, e.ca, ctx);
      ['caja', 'animo', 'sospecha'].forEach((k) => {
        if (e[k]) S.met[k] = clamp(S.met[k] + e[k], 0, 100);
      });
      if (e.promesa) S.promesas += e.promesa;
      if (e.mano) anadirMano(S, e.mano);
      if (e.flag) S.flags[e.flag] = true;
      if (e.sigue) S.cola.push(e.sigue);
      if (e.campana) {
        S.campanas.push({ nombre: texto(S, e.campana.nombre, ctx), quedan: e.campana.dias, ef: e.campana.ef, ctx });
      }
      if (e.prog) {
        S.prog.push({ dia: S.dia + e.prog.en, ef: e.prog.ef, titular: texto(S, e.prog.titular, ctx), ctx });
      }
      if (e.huelga) convocarHuelga(S, e.huelga, ctx);
    });
  }

  function anadirMano(S, id) {
    S.mano.push(id);
    if (S.mano.length > CONFIG.MANO_MAX) S.mano.shift();
  }

  function cartaMano(id) {
    return D.CARTAS_DEBATE[id] ? Object.assign({ id, clase: 'debate' }, D.CARTAS_DEBATE[id])
      : Object.assign({ id, clase: 'reflexion' }, D.CARTAS_REFLEXION[id]);
  }

  // Foto antes/después para enseñar al jugador qué ha cambiado.
  function foto(S) {
    return { est: estimacion(S), met: Object.assign({}, S.met), mano: S.mano.length, promesas: S.promesas };
  }

  function diferencias(S, antes) {
    const despues = foto(S);
    const chips = [];
    JUG.concat(['otros']).forEach((p) => {
      const d = despues.est[p] - antes.est[p];
      if (Math.abs(d) >= 0.05) chips.push({ p, txt: nombre(p) + ' ' + (d > 0 ? '+' : '') + r1(d).toString().replace('.', ','), signo: d > 0 ? 1 : -1 });
    });
    [['caja', '💶'], ['animo', '🔥'], ['sospecha', '🕵️']].forEach(([k, ic]) => {
      const d = despues.met[k] - antes.met[k];
      if (d) chips.push({ txt: ic + ' ' + (d > 0 ? '+' : '') + d, signo: k === 'sospecha' ? -Math.sign(d) : Math.sign(d) });
    });
    if (despues.mano > antes.mano || (despues.mano === CONFIG.MANO_MAX && antes.mano === CONFIG.MANO_MAX)) {
      chips.push({ txt: '🃏 +1 carta', signo: 1 });
    }
    if (despues.promesas > antes.promesas) {
      chips.push({ txt: '📜 ' + formatoMillones(despues.promesas - antes.promesas), signo: 0 });
    }
    return chips;
  }

  function formatoMillones(m) {
    return m >= 1000 ? (Math.round(m / 100) / 10).toString().replace('.', ',') + ' mil M€' : m + ' M€';
  }

  // ---------- Cartas del día ----------

  function cumple(S, c) {
    if (c.solo && c.solo.indexOf(S.jugador) < 0) return false;
    if (c.no && c.no.indexOf(S.jugador) >= 0) return false;
    if (c.dias && (S.dia < c.dias[0] || S.dia > c.dias[1])) return false;
    if (c.req && !c.req(S)) return false;
    return true;
  }

  function contextoCarta(S, c) {
    const ctx = {};
    const yo = S.jugador;
    if (c.obj === 'rival' || c.obj === undefined) {
      ctx.obj = elegirPeso(S, JUG.filter((p) => p !== yo), (p) =>
        (p === P[yo].antagonista ? 2 : 1) * (P[yo].vecinos.indexOf(p) >= 0 ? 1.5 : 1));
    } else if (c.obj === 'ant') {
      ctx.obj = P[yo].antagonista;
    } else if (c.obj === 'gob') {
      ctx.obj = 'psoe';
    } else {
      ctx.obj = c.obj;
    }
    if (c.ca === 'azar') {
      ctx.ca = elegirPeso(S, RIDS, (r) => Math.sqrt(R[r].escanos));
    } else if (c.ca === 'gobpp') {
      ctx.ca = elegirPeso(S, RIDS.filter((r) => R[r].gob === 'pp'), (r) => Math.sqrt(R[r].escanos));
    } else if (Array.isArray(c.ca)) {
      ctx.ca = c.ca[Math.floor(rnd(S) * c.ca.length)];
    } else if (c.ca) {
      ctx.ca = c.ca;
    }
    return ctx;
  }

  function buscarCarta(id) {
    return D.CARTAS.find((c) => c.id === id);
  }

  function prepararDia(S) {
    const lista = [];
    const usar = (c) => {
      if (!c || lista.some((x) => x.id === c.id)) return;
      lista.push({ id: c.id, ctx: contextoCarta(S, c), hecha: false, resultado: null });
    };
    if (S.dia === CONFIG.DIA_REFLEXION) {
      S.hoy = { cartas: [], idx: 0 };
      return;
    }
    D.CARTAS.filter((c) => c.dia === S.dia && cumple(S, c)).forEach(usar);
    while (S.cola.length) usar(buscarCarta(S.cola.shift()));
    const max = Math.max(CONFIG.CARTAS_DIA, lista.length);
    let intentos = 0;
    while (lista.length < max && intentos++ < 50) {
      const pool = D.CARTAS.filter((c) => !c.dia && !c.encadenada && !S.usadas[c.id] && cumple(S, c) &&
        !lista.some((x) => x.id === c.id));
      const c = elegirPeso(S, pool, (x) => x.peso || 1);
      if (!c) break;
      usar(c);
    }
    S.hoy = { cartas: lista, idx: 0 };
  }

  function cartaActual(S) {
    if (!S.hoy || S.hoy.idx >= S.hoy.cartas.length) return null;
    const inst = S.hoy.cartas[S.hoy.idx];
    return { inst, def: buscarCarta(inst.id) };
  }

  function costeOpcion(op) {
    let c = 0;
    (op.ef || []).forEach((e) => { if (e.caja < 0) c = Math.max(c, -e.caja); });
    return c;
  }

  function puedeElegir(S, op) {
    return S.met.caja >= costeOpcion(op);
  }

  // Medidores que toca una opción (para los puntitos estilo Reigns).
  function pistas(op) {
    const m = {};
    const mirar = (efs) => (efs || []).forEach((e) => {
      ['caja', 'animo', 'sospecha'].forEach((k) => { if (e[k]) m[k] = Math.max(m[k] || 0, Math.abs(e[k])); });
      if (e.mov || e.tras || e.bloque) m.votos = Math.max(m.votos || 0, Math.abs(e.n) * 20);
      if (e.huelga || e.campana) m.votos = Math.max(m.votos || 0, 12);
    });
    mirar(op.ef);
    if (op.si) mirar(op.si.ef);
    if (op.no) mirar(op.no.ef);
    return m;
  }

  function probAzar(S, op) {
    if (typeof op.azar === 'number') return op.azar;
    return op.azar[S.jugador] != null ? op.azar[S.jugador] : 0.5;
  }

  function elegirOpcion(S, lado) {
    const cur = cartaActual(S);
    if (!cur) return null;
    const { inst, def } = cur;
    const op = def[lado];
    if (!puedeElegir(S, op)) return null;
    const ctx = inst.ctx;
    const antes = foto(S);
    let res = op.res, tit = op.tit, exito = null;
    aplicarEfectos(S, op.ef, ctx);
    if (op.azar != null) {
      exito = rnd(S) < probAzar(S, op);
      const rama = exito ? op.si : op.no;
      aplicarEfectos(S, rama.ef, ctx);
      res = rama.res;
      tit = rama.tit || tit;
    }
    S.usadas[def.id] = true;
    const chips = diferencias(S, antes);
    const resultado = { lado, texto: texto(S, res, ctx), chips, exito };
    inst.hecha = true;
    inst.resultado = resultado;
    const mag = chips.reduce((s, ch) => s + (ch.p ? Math.abs(parseFloat(ch.txt.split(' ').pop().replace(',', '.'))) : 0), 0);
    noticia(S, 4 + mag * 12, texto(S, tit || def.titulo, ctx), texto(S, res, ctx), S.jugador);
    return resultado;
  }

  function empezarDia(S) {
    S.fase = 'cartas';
    if (!cartaActual(S)) trasCartas(S);
  }

  function siguienteCarta(S) {
    if (S.hoy) S.hoy.idx++;
    if (!cartaActual(S)) trasCartas(S);
  }

  function trasCartas(S) {
    S.fase = S.dia === CONFIG.DIA_REFLEXION ? 'reflexion' : 'agenda';
    if (S.fase === 'reflexion') iniciarReflexion(S);
  }

  // ---------- Mítines ----------

  function hastio(S, p, c) {
    let n = 0;
    S.mitines.forEach((m) => {
      if (m.p === p && m.ca === c && m.dia < S.dia && m.dia >= S.dia - CONFIG.HASTIO_DIAS) {
        n += m.rol === 'principal' ? 1 : 0.5;
      }
    });
    return Math.max(CONFIG.HASTIO_MIN, 1 - CONFIG.HASTIO * n);
  }

  // Un mitin moviliza más donde el partido ya tiene mucha gente: (voto decidido local / 25 %)^0,75.
  function implantacion(S, p, c) {
    const v = S.reg[c].v;
    return clamp(Math.pow(v[p] / (100 - v.ind) * 100 / CONFIG.IMPLANTACION_REF, CONFIG.IMPLANTACION_EXP), CONFIG.IMPLANTACION_MIN, CONFIG.IMPLANTACION_MAX);
  }

  function factorAnimo(S, p) {
    return p === S.jugador && !S.ia ? 0.6 + 0.8 * S.met.animo / 100 : 1;
  }

  // Valor estimado (en escaños) de dar hoy un mitin principal en c. Lo usan la IA y las estrellas de la agenda.
  function valorMitin(S, p, c, sinRuidoAyer) {
    const v = S.reg[c].v;
    const dec = 100 - v.ind;
    let rivalesAyer = 0;
    if (!sinRuidoAyer) {
      S.mitines.forEach((m) => {
        if (m.dia === S.dia - 1 && m.ca === c && m.p !== p) rivalesAyer += m.rol === 'principal' ? 0.5 : 0.25;
      });
    }
    const g = CONFIG.MITIN * implantacion(S, p, c) * hastio(S, p, c) / (1 + CONFIG.ATENCION * rivalesAyer);
    const combustible = Math.min(1, (v.ind + 0.3 * P[p].vecinos.reduce((s, q) => s + v[q], 0)) / 8);
    const enfriando = S.dia - S.reg[c].ultimo[p] >= CONFIG.OLVIDO_DIAS - 1 ? 1.2 : 1;
    return R[c].escanos * g * combustible * enfriando / dec;
  }

  function agendaIA(S, p) {
    const val = {};
    RIDS.forEach((c) => {
      val[c] = valorMitin(S, p, c) * (P[p].sesgo[c] || 1) * entre(S, 0.75, 1.25);
      if (S.dia === CONFIG.DIA_CIERRE) val[c] *= 1 + R[c].escanos / 30;
    });
    const orden = RIDS.slice().sort((a, b) => val[b] - val[a]);
    let principal = orden[0];
    if (rnd(S) < P[p].contraprogramacion) {
      const ant = P[p].antagonista;
      const ayer = S.mitines.find((m) => m.dia === S.dia - 1 && m.p === ant && m.rol === 'principal');
      if (ayer && val[ayer.ca] >= 0.5 * val[principal]) principal = ayer.ca;
    }
    const secundario = orden.find((c) => c !== principal);
    return { principal, secundario };
  }

  function resolverMitines(S, agendas) {
    const lista = [];
    Object.keys(agendas).forEach((p) => {
      const a = agendas[p];
      if (a.principal) lista.push({ p, ca: a.principal, rol: 'principal' });
      if (a.secundario) lista.push({ p, ca: a.secundario, rol: 'secundario', mismo: a.secundario === a.principal });
    });
    const presencia = {};
    lista.forEach((m) => {
      presencia[m.ca] = presencia[m.ca] || {};
      presencia[m.ca][m.p] = (presencia[m.ca][m.p] || 0) + (m.rol === 'principal' ? 1 : 0.5);
    });
    lista.forEach((m) => {
      const rol = m.rol === 'principal' ? CONFIG.ROL.principal : (m.mismo ? CONFIG.ROL.mismoSitio : CONFIG.ROL.secundario);
      let rivales = 0;
      Object.keys(presencia[m.ca]).forEach((q) => { if (q !== m.p) rivales += presencia[m.ca][q]; });
      let g = CONFIG.MITIN * rol * implantacion(S, m.p, m.ca) * factorAnimo(S, m.p) * hastio(S, m.p, m.ca) /
        (1 + CONFIG.ATENCION * rivales) * entre(S, 0.8, 1.2);
      if (S.dia === CONFIG.DIA_CIERRE) {
        g *= CONFIG.CIERRE;
        if (m.p === S.jugador && S.flags.concierto) g *= 1.3;
      }
      m.g = g;
      m.hastio = hastio(S, m.p, m.ca);
      m.rivales = rivales;
    });
    lista.forEach((m) => {
      const c = m.ca;
      if (m.g >= 0) {
        let resto = m.g - mover(S, c, 'ind', m.p, m.g * CONFIG.DE_INDECISOS);
        const vec = P[m.p].vecinos;
        const tv = vec.reduce((s, q) => s + S.reg[c].v[q], 0) || 1;
        vec.forEach((q) => { mover(S, c, q, m.p, resto * S.reg[c].v[q] / tv); });
      } else {
        mover(S, c, m.p, 'ind', -m.g);
      }
      S.reg[c].ultimo[m.p] = S.dia;
      S.mitines.push({ dia: S.dia, p: m.p, ca: c, rol: m.rol, g: r1(m.g * 100) / 100 });
    });
    return lista;
  }

  function cronicaMitines(S, lista) {
    const yo = S.jugador;
    lista.filter((m) => m.rol === 'principal').forEach((m) => {
      const organiza = Math.max(300, Math.round((m.g * 6000 + entre(S, 500, 3000)) / 100) * 100);
      const policia = Math.max(20, Math.round(organiza / entre(S, 6, 14) / 10) * 10);
      const quienEs = m.p === yo ? 'Tu candidato' : P[m.p].candCorto;
      let txt = quienEs + ' en ' + R[m.ca].nombre + ': ' + organiza.toLocaleString('es-ES') +
        ' asistentes según la organización, ' + policia.toLocaleString('es-ES') + ' según la policía.';
      if (m.hastio <= 0) txt += ' «¿Otra vez aquí?», se oye entre el público.';
      else if (m.rivales >= 2) txt += ' Con tanto mitin a la vez, la tele no sabe a quién enfocar.';
      noticia(S, m.p === yo ? 3 : 1.5 + m.g, m.p === yo ? 'Mitin en ' + R[m.ca].nombre : P[m.p].candCorto + ' llena ' + R[m.ca].nombre, txt, m.p);
    });
  }

  // ---------- Huelgas ----------

  function convocarHuelga(S, h, ctx) {
    const ca = h.ca === 'ca' ? ctx.ca : h.ca;
    const objetivo = h.obj === 'gobca' ? R[ca].gob : (h.obj || 'psoe');
    const posturas = {};
    JUG.forEach((p) => {
      let post = p === objetivo ? 'critica' : (P[p].bloque === 'izq' ? 'apoya' : 'critica');
      if (h.ia && h.ia[p]) post = h.ia[p];
      posturas[p] = post;
    });
    if (h.postura) posturas[S.jugador] = h.postura;
    const nombreH = texto(S, h.nombre, Object.assign({}, ctx, { ca }));
    S.huelgas.push({ nombre: nombreH, dia: S.dia + h.en, ca, objetivo, posturas });
    movilizar(S, objetivo, -0.1, ca === 'nat' ? null : ca);
  }

  function resolverHuelgas(S) {
    S.huelgas.filter((h) => h.dia === S.dia).forEach((h) => {
      const nat = h.ca === 'nat';
      const base = nat ? estimacion(S) : (() => {
        const v = S.reg[h.ca].v, dec = 100 - v.ind, e = {};
        TODOS.forEach((p) => { e[p] = v[p] * 100 / dec; });
        return e;
      })();
      const apoyo = JUG.filter((p) => h.posturas[p] === 'apoya').reduce((s, p) => s + base[p], 0) / 100;
      const seg = Math.round(clamp(45 + entre(S, -20, 20) + 40 * (apoyo - 0.5), 15, 90));
      const exito = seg >= 50;
      const k = nat ? 1 : CONFIG.HUELGA_CA;
      const ca = nat ? null : h.ca;
      JUG.forEach((p) => {
        if (h.posturas[p] === 'apoya') movilizar(S, p, k * (exito ? 0.5 : -0.3), ca);
        else movilizar(S, p, k * (exito ? -0.3 : 0.3), ca);
      });
      movilizar(S, h.objetivo, k * (exito ? -0.6 : 0.2), ca);
      const segObj = Math.max(3, Math.round(seg / entre(S, 2.5, 5)));
      const tuPostura = h.posturas[S.jugador] === 'apoya' ? 'la apoyaste' : 'la criticaste';
      noticia(S, 18, (exito ? 'Éxito de ' : 'Pinchazo en ') + h.nombre,
        'Seguimiento del ' + seg + ' % según los convocantes, del ' + segObj + ' % según ' +
        (h.objetivo === 'otros' ? 'el gobierno autonómico' : el(h.objetivo)) +
        ' y "un día normal" según el bar de abajo. Tú ' + tuPostura + '.', S.jugador);
    });
  }

  // ---------- Sucesos automáticos de los rivales ----------

  function suceso(S) {
    if (rnd(S) >= CONFIG.PROB_SUCESO) return;
    const p = JUG.filter((x) => x !== S.jugador)[Math.floor(rnd(S) * 3)];
    const s = D.SUCESOS[Math.floor(rnd(S) * D.SUCESOS.length)];
    const ca = elegirPeso(S, RIDS, (r) => Math.sqrt(R[r].escanos));
    const ctx = { obj: p, ca };
    movilizar(S, p, s.n);
    if (s.nca) movilizar(S, p, s.nca, ca);
    const t = mayusculas(partidoEnTexto(s.txt, 'P', p).replace(/\{PC\}/g, P[p].candCorto).replace(/\{CA\}/g, R[ca].nombre));
    noticia(S, 5 + Math.abs(s.n) * 10, t, '', p);
    return ctx;
  }

  // ---------- Fin del día ----------

  function cerrarDia(S) {
    const agendas = {};
    JUG.forEach((p) => {
      agendas[p] = p === S.jugador && !S.ia ? Object.assign({}, S.agenda) : agendaIA(S, p);
    });
    if (S.dia !== CONFIG.DIA_REFLEXION) {
      const lista = resolverMitines(S, agendas);
      cronicaMitines(S, lista);
    }
    S.campanas.forEach((c) => {
      aplicarEfectos(S, c.ef, c.ctx);
      c.quedan--;
    });
    S.campanas.filter((c) => c.quedan === 0).forEach((c) => noticia(S, 3, 'Termina la campaña «' + c.nombre + '»', '', S.jugador));
    S.campanas = S.campanas.filter((c) => c.quedan > 0);
    S.prog.filter((x) => x.dia === S.dia).forEach((x) => {
      aplicarEfectos(S, x.ef, x.ctx);
      if (x.titular) noticia(S, 10, x.titular, '', S.jugador);
    });
    S.prog = S.prog.filter((x) => x.dia !== S.dia);
    resolverHuelgas(S);
    suceso(S);
    S.agenda = { principal: null, secundario: null };
    if (S.dia === CONFIG.DIA_DEBATE) {
      iniciarDebate(S);
      S.fase = 'debate';
    } else {
      pasarNoche(S);
    }
  }

  function pasarNoche(S) {
    const yo = S.jugador;
    // Los rivales también juegan sus cartas, fuera de cámara.
    const est = estimacion(S);
    JUG.forEach((p) => { if (p !== yo || S.ia) movilizar(S, p, CONFIG.IA_CARTAS * est[p] / CONFIG.TAMANO_REF, null, null, true); });
    RIDS.forEach((c) => {
      JUG.forEach((p) => {
        if (S.dia - S.reg[c].ultimo[p] >= CONFIG.OLVIDO_DIAS) mover(S, c, p, 'ind', S.reg[c].v[p] * CONFIG.OLVIDO);
      });
      const v = S.reg[c].v;
      const k = v.ind * CONFIG.CRISTALIZA;
      const dec = 100 - v.ind;
      TODOS.forEach((p) => { mover(S, c, 'ind', p, k * v[p] / dec); });
    });
    const esc = escanos(S).total;
    const ayer = S.historia[S.historia.length - 1].esc;
    S.met.caja = clamp(S.met.caja + CONFIG.CAJA_NOCHE, 0, 100);
    S.met.animo = clamp(S.met.animo + CONFIG.ANIMO_NOCHE + CONFIG.ANIMO_ESCANOS * Math.sign(esc[yo] - ayer[yo]), 0, 100);
    S.met.sospecha = clamp(S.met.sospecha + CONFIG.SOSPECHA_NOCHE, 0, 100);
    if (S.met.sospecha >= 100) {
      movilizar(S, yo, -CONFIG.ESCANDALO);
      S.met.animo = clamp(S.met.animo - 20, 0, 100);
      S.met.sospecha = 45;
      noticia(S, 60, 'ESTALLA EL ESCÁNDALO EN ' + el(yo).toUpperCase(),
        'Demasiado juego sucio: la sospecha llega al máximo y salen a la luz los audios, los sobres y el pendrive con forma de chorizo.', yo);
    }
    if (S.met.animo >= 100) {
      S.met.animo = 85;
      S.cola.push('euforia');
    } else if (S.met.animo <= 0) {
      S.met.animo = 15;
      movilizar(S, yo, -0.5);
      noticia(S, 30, 'Desbandada en ' + el(yo), 'Las bases, hundidas: los interventores no cogen el teléfono y la sede huele a derrota.', yo);
    }
    const escFin = escanos(S).total;
    S.historia.push({ dia: S.dia, esc: escFin, est: estimacion(S) });
    narrarEscanos(S, ayer, escFin);
    S.dia++;
    portadaDelDia(S);
    prepararDia(S);
    S.fase = 'portada';
  }

  function narrarEscanos(S, ayer, hoy) {
    const la = lider(ayer, JUG), lh = lider(hoy, JUG);
    if (la !== lh) noticia(S, 40, cap(el(lh)) + ' adelanta ' + al(la), 'Cambio de líder en la encuesta diaria.', lh);
    JUG.forEach((p) => {
      const d = hoy[p] - ayer[p];
      if (Math.abs(d) >= 3) {
        noticia(S, 6 + Math.abs(d) * 2, cap(el(p)) + (d > 0 ? ' sube ' : ' se deja ') + Math.abs(d) + ' escaños',
          'Hoy tendría ' + hoy[p] + ' diputados.', p);
      }
    });
    const der = hoy.pp + hoy.vox, derAyer = ayer.pp + ayer.vox;
    if ((der >= CONFIG.MAYORIA) !== (derAyer >= CONFIG.MAYORIA)) {
      noticia(S, 35, der >= CONFIG.MAYORIA ? 'PP y Vox suman mayoría absoluta' : 'PP y Vox pierden la mayoría absoluta',
        'El bloque de la derecha tendría ' + der + ' escaños.', 'pp');
    }
  }

  function portadaDelDia(S) {
    const ordenadas = S.noticias.slice().sort((a, b) => b.peso - a.peso);
    const ayer = S.historia.length > 1 ? S.historia[S.historia.length - 2].esc : S.historia[0].esc;
    const modo = S.dia >= CONFIG.DIA_VETO ? (S.flags.andorra ? 'andorra' : 'niebla') : 'normal';
    S.portada = {
      dia: S.dia,
      fecha: fecha(S.dia).texto,
      periodico: modo === 'andorra' ? "El Periòdic d'Andorra" : PERIODICOS[(S.dia * 3) % PERIODICOS.length],
      modo,
      titular: ordenadas[0] || { titular: 'Otro día de campaña', cuerpo: '' },
      breves: ordenadas.slice(1, 7),
      esc: escanos(S),
      escAyer: ayer,
      est: estimacion(S),
      mitinesAyer: S.mitines.filter((m) => m.dia === S.dia - 1),
    };
    S.noticias = [];
  }

  // ---------- Debate a cuatro ----------

  const RONDAS = [
    { tema: 'eco', nombre: 'Economía y vivienda' },
    { tema: 'cor', nombre: 'Corrupción y regeneración' },
    { tema: 'esp', nombre: 'España: territorio e inmigración' },
    { tema: 'oro', nombre: 'Minuto de oro' },
  ];
  const TIPOS = ['ataque', 'replica', 'propuesta'];
  const GANA = { ataque: 'propuesta', propuesta: 'replica', replica: 'ataque' };

  function iniciarDebate(S) {
    const esc = escanos(S).total;
    const manos = {};
    JUG.filter((p) => p !== S.jugador || S.ia).forEach((p) => {
      manos[p] = [0, 1, 2].map(() => ({
        id: 'ia', tipo: elegirPeso(S, TIPOS, (t) => P[p].debate[t]), fuerza: 1 + Math.floor(rnd(S) * 3),
        tema: [null, 'eco', 'cor', 'esp'][Math.floor(rnd(S) * 4)],
      }));
    });
    S.debate = { ronda: 0, puntos: { psoe: 0, pp: 0, vox: 0, fa: 0 }, manos, log: [], jugadas: [], lider: lider(esc, JUG), esc };
  }

  function improvisadas() {
    return TIPOS.map((t) => ({ id: 'imp_' + t, tipo: t, fuerza: 1, tema: null, nombre: 'Improvisar', improvisada: true }));
  }

  function manoDebate(S) {
    return S.mano.map(cartaMano).filter((c) => c.clase === 'debate').concat(improvisadas());
  }

  function eleccionIA(S, p, tema) {
    const d = S.debate;
    const mano = d.manos[p];
    const esLider = d.lider === p;
    let mejor = 0, mv = -1;
    mano.forEach((c, i) => {
      const peso = P[p].debate[c.tipo] * (esLider && c.tipo === 'replica' ? 1.6 : 1) * (!esLider && c.tipo === 'ataque' ? 1.2 : 1);
      const v = (c.fuerza + (c.tema === tema ? 1 : 0)) * peso * entre(S, 0.7, 1.3);
      if (v > mv) { mv = v; mejor = i; }
    });
    const carta = mano.splice(mejor, 1)[0] || improvisadas()[Math.floor(rnd(S) * 3)];
    let objetivo = null;
    if (carta.tipo === 'ataque') {
      objetivo = elegirPeso(S, JUG.filter((q) => q !== p), (q) =>
        (d.esc[q] + 10) * (P[q].bloque !== P[p].bloque ? 1.3 : 1) * (q === d.lider ? 1.5 : 1) * (q === P[p].antagonista ? 1.5 : 1));
    }
    return { carta, objetivo };
  }

  function jugarRonda(S, eleccion) {
    const d = S.debate;
    const ronda = RONDAS[d.ronda];
    const jug = {};
    JUG.forEach((p) => {
      if (p === S.jugador && !S.ia) {
        let carta;
        if (eleccion.cartaId.indexOf('imp_') === 0) carta = improvisadas().find((c) => c.id === eleccion.cartaId);
        else {
          carta = cartaMano(eleccion.cartaId);
          S.mano.splice(S.mano.indexOf(eleccion.cartaId), 1);
        }
        jug[p] = { carta, objetivo: carta.tipo === 'ataque' ? eleccion.objetivo : null };
      } else {
        jug[p] = eleccionIA(S, p, ronda.tema);
      }
    });
    const pts = { psoe: 0, pp: 0, vox: 0, fa: 0 };
    const log = [];
    const fuerza = (j) => j.carta.fuerza + (j.carta.tema && j.carta.tema === ronda.tema ? 1 : 0);
    const atacantes = {};
    JUG.forEach((p) => {
      const j = jug[p];
      if (j.carta.tipo === 'ataque') (atacantes[j.objetivo] = atacantes[j.objetivo] || []).push(p);
    });
    JUG.forEach((p) => {
      const j = jug[p];
      if (j.carta.tipo !== 'ataque') return;
      const o = j.objetivo, jo = jug[o];
      if (jo.carta.tipo === 'replica') {
        pts[p] -= 1;
        const primero = atacantes[o][0] === p;
        pts[o] += primero ? fuerza(jo) + 1 : 1;
        log.push('🛡️ Zasca de ' + P[o].candCorto + ' a ' + P[p].candCorto + '.');
      } else if (jo.carta.tipo === 'propuesta') {
        pts[p] += fuerza(j);
        pts[o] -= 1;
        log.push('⚔️ ' + P[p].candCorto + ' interrumpe a ' + P[o].candCorto + ' en plena propuesta.');
      } else {
        pts[p] += Math.ceil(fuerza(j) / 2);
        log.push('🔥 ' + P[p].candCorto + ' y ' + P[o].candCorto + ' se enzarzan; el moderador suspira.');
      }
    });
    JUG.forEach((p) => {
      const j = jug[p];
      const atacado = !!atacantes[p];
      if (j.carta.tipo === 'propuesta' && !atacado) {
        pts[p] += fuerza(j);
        log.push('💡 ' + P[p].candCorto + ' explica su propuesta sin que nadie le corte.');
      }
      if (j.carta.tipo === 'replica' && !atacado) {
        pts[p] -= 1;
        log.push('🙄 ' + P[p].candCorto + ' replica a un ataque que nadie ha hecho.');
      }
    });
    JUG.forEach((p) => { d.puntos[p] += pts[p]; });
    d.jugadas.push({ ronda: ronda.nombre, jug, pts, log });
    d.ronda++;
    return { jug, pts, log };
  }

  const ORO = {
    emocion: { nombre: 'Emocionar', texto: 'Una historia de tu abuela. 60 %: +3. Si no, −1.' },
    propuesta: { nombre: 'Propuesta estrella', texto: 'Una idea clara. +1,5 seguro.' },
    ataque: { nombre: 'Ataque final', texto: '60 %: +2 y el atacado −1. Si no, el moderador te corta: −1.' },
  };

  function jugarOro(S, opcionJugador, objetivoJugador) {
    const d = S.debate;
    const pts = { psoe: 0, pp: 0, vox: 0, fa: 0 };
    const log = [];
    const eleccion = {};
    JUG.forEach((p) => {
      let op = opcionJugador, obj = objetivoJugador;
      if (p !== S.jugador || S.ia) {
        op = elegirPeso(S, ['emocion', 'propuesta', 'ataque'], (o) =>
          o === 'ataque' ? P[p].debate.ataque : o === 'propuesta' ? P[p].debate.propuesta : P[p].debate.replica + 0.2);
        obj = P[p].antagonista;
      }
      eleccion[p] = { op, obj };
      if (op === 'emocion') {
        if (rnd(S) < 0.6) { pts[p] += 3; log.push('🥹 ' + P[p].candCorto + ' emociona con la historia de su abuela.'); }
        else { pts[p] -= 1; log.push('😬 ' + P[p].candCorto + ' intenta emocionar y se le quiebra la voz en el sitio equivocado.'); }
      } else if (op === 'propuesta') {
        pts[p] += 1.5;
        log.push('📋 ' + P[p].candCorto + ' cierra con una propuesta clara. Correcto.');
      } else if (rnd(S) < 0.6) {
        pts[p] += 2; pts[obj] -= 1;
        log.push('🎯 ' + P[p].candCorto + ' remata a ' + P[obj].candCorto + ' en el último segundo.');
      } else {
        pts[p] -= 1;
        log.push('⏱️ El moderador corta a ' + P[p].candCorto + ' a mitad de insulto.');
      }
    });
    JUG.forEach((p) => { d.puntos[p] += pts[p]; });
    d.jugadas.push({ ronda: 'Minuto de oro', oro: eleccion, pts, log });
    d.ronda++;
    return { eleccion, pts, log };
  }

  function terminarDebate(S) {
    const d = S.debate;
    const media = JUG.reduce((s, p) => s + d.puntos[p], 0) / JUG.length;
    const exps = {};
    let suma = 0;
    JUG.forEach((p) => { exps[p] = Math.exp(d.puntos[p] * 0.35); suma += exps[p]; });
    const flash = {};
    JUG.forEach((p) => { flash[p] = Math.round(exps[p] * 100 / suma); });
    const antes = foto(S);
    JUG.forEach((p) => {
      movilizar(S, p, clamp(CONFIG.DEBATE_FACTOR * (d.puntos[p] - media), -CONFIG.DEBATE_MAX, CONFIG.DEBATE_MAX));
    });
    const ganador = lider(flash, JUG);
    if (ganador === S.jugador) S.met.animo = clamp(S.met.animo + 10, 0, 100);
    d.flash = flash;
    d.ganador = ganador;
    d.chips = diferencias(S, antes);
    noticia(S, 50, P[ganador].candCorto + ' gana el debate a cuatro',
      'Encuesta flash: ' + JUG.slice().sort((a, b) => flash[b] - flash[a]).map((p) => P[p].candCorto + ' ' + flash[p] + ' %').join(', ') + '.', ganador);
    pasarNoche(S);
  }

  // ---------- Jornada de reflexión ----------

  const REFLEXION_BASICAS = ['r_paella', 'r_descanso'];

  function iniciarReflexion(S) {
    S.reflexion = { hecha: false };
  }

  function opcionesReflexion(S) {
    return S.mano.map(cartaMano).filter((c) => c.clase === 'reflexion')
      .concat(REFLEXION_BASICAS.map((id) => Object.assign({ id, clase: 'reflexion', basica: true }, D.CARTAS_REFLEXION[id])));
  }

  function jugarReflexion(S, id) {
    const c = cartaMano(id);
    const ctx = { obj: P[S.jugador].antagonista, ca: 'mad' };
    const antes = foto(S);
    const sale = rnd(S) >= (c.riesgo || 0);
    aplicarEfectos(S, sale ? c.ef : c.efMal, ctx);
    const i = S.mano.indexOf(id);
    if (i >= 0) S.mano.splice(i, 1);
    const ia = [];
    JUG.filter((p) => p !== S.jugador).forEach((p) => {
      if (rnd(S) >= CONFIG.REFLEXION_IA) return;
      const ids = Object.keys(D.CARTAS_REFLEXION).filter((k) => !D.CARTAS_REFLEXION[k].basica && D.CARTAS_REFLEXION[k].ia);
      const k = ids[Math.floor(rnd(S) * ids.length)];
      const rc = D.CARTAS_REFLEXION[k];
      const bien = rnd(S) >= rc.riesgo;
      movilizar(S, p, bien ? rc.ia : -rc.ia);
      ia.push({ p, txt: P[p].candCorto + ': ' + rc.nombre.toLowerCase() + (bien ? '. Le sale bien.' : '. Le sale fatal.'), bien });
    });
    S.reflexion = {
      hecha: true, carta: c, sale,
      texto: texto(S, sale ? c.txtBien : c.txtMal, ctx), chips: diferencias(S, antes), ia,
    };
    return S.reflexion;
  }

  // ---------- Noche electoral ----------

  function calcularFinal(S) {
    const antesEst = estimacion(S);
    TODOS.forEach((p) => { movilizar(S, p, normal(S) * CONFIG.MARGEN_ERROR); });
    const esc = escanos(S);
    const t = esc.total;
    const der = t.pp + t.vox;
    const izq = t.psoe + t.fa + t.otros;
    let gobierno, presidente;
    if (der >= CONFIG.MAYORIA) { gobierno = 'der'; presidente = t.pp >= t.vox ? 'pp' : 'vox'; }
    else if (izq >= CONFIG.MAYORIA) { gobierno = 'izq'; presidente = t.psoe >= t.fa ? 'psoe' : 'fa'; }
    else { gobierno = 'bloqueo'; presidente = null; }
    const yo = S.jugador;
    const primera = lider(t, JUG);
    const mejora = t[yo] > S.escInicio[yo];
    let medalla;
    const preside = presidente === yo;
    if (yo === 'psoe' || yo === 'pp') {
      const miBloque = yo === 'psoe' ? 'izq' : 'der';
      medalla = t[yo] >= CONFIG.MAYORIA ? 'triunfo' : preside ? 'victoria'
        : (mejora || primera === yo || gobierno === miBloque) ? 'digna' : 'debacle';
    } else {
      const socio = yo === 'vox' ? 'pp' : 'psoe';
      const miBloque = yo === 'vox' ? 'der' : 'izq';
      medalla = preside ? 'triunfo' : (gobierno === miBloque || t[yo] > t[socio]) ? 'victoria' : mejora ? 'digna' : 'debacle';
    }
    S.final = { esc, gobierno, presidente, medalla, der, izq, estAntes: antesEst, est: estimacion(S), primera };
    S.fase = 'final';
    return S.final;
  }

  // ---------- Exportar ----------

  root.Motor = {
    CONFIG, RONDAS, ORO, PERIODICOS, DER,
    el, del, cap,
    nuevaPartida, prepararDia, empezarDia, cartaActual, elegirOpcion, siguienteCarta, puedeElegir, costeOpcion, pistas, probAzar,
    cerrarDia, pasarNoche, agendaIA, valorMitin, hastio,
    escanos, estimacion, nacional, liderRegion, lider, nombre, texto, fecha, formatoMillones, resumenEncuesta,
    manoDebate, jugarRonda, jugarOro, terminarDebate, cartaMano,
    opcionesReflexion, jugarReflexion, calcularFinal,
    rnd,
  };
})(typeof window !== 'undefined' ? window : globalThis);
