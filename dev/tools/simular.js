#!/usr/bin/env node
// Simulador de Campaña 29-N para equilibrar números. Carga los mismos scripts que el navegador.
//
//   node dev/tools/simular.js --inicio              Escaños de partida de cada escenario
//   node dev/tools/simular.js --catalogo            Tabla Markdown con todas las cartas
//   node dev/tools/simular.js [-n 200] [--jugador listo|mitinero|azar|quieto] [--cartas azar|oraculo]
//
// Políticas del jugador simulado:
//   listo     elige la mejor combinación de comunidad, acto y carta táctica que pueda pagar
//   mitinero  solo mítines, donde más rindan, sin tácticas
//   azar      va a una comunidad al azar (de las que puede pagar) y da un mitin o hace puerta a puerta
//   quieto    el candidato no hace nada (para medir cuánto vale la agenda)
// Cartas: azar (opción al azar) u oraculo (prueba ambas opciones en una copia y se queda la mejor).
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..', 'elecciones');
const ctx = { console, Math, Date, JSON };
ctx.window = ctx;
vm.createContext(ctx);
['data/partidos.js', 'data/regiones.js', 'data/gira.js', 'data/cartas.js', 'data/cartas2.js', 'motor.js'].forEach((f) => {
  vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f });
});
const M = ctx.Motor;
const D = ctx.DATOS;
const JUG = D.JUGABLES;

const args = process.argv.slice(2);
const opt = (k, def) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : def; };
const N = parseInt(opt('-n', '100'), 10);
const POLITICA = opt('--jugador', 'mitinero');
const CARTAS = opt('--cartas', 'azar');

const clonar = (S) => JSON.parse(JSON.stringify(S));
let semillaRnd = 12345;
const azar = () => { semillaRnd = (semillaRnd * 1103515245 + 12345) & 0x7fffffff; return semillaRnd / 0x7fffffff; };

function inicio() {
  Object.keys(D.ESCENARIOS).forEach((e) => {
    const tot = {};
    JUG.concat(['otros']).forEach((p) => { tot[p] = 0; });
    for (let i = 0; i < 50; i++) {
      const S = M.nuevaPartida({ partido: 'pp', escenario: e, semilla: 1000 + i });
      const t = M.escanos(S).total;
      Object.keys(tot).forEach((p) => { tot[p] += t[p] / 50; });
    }
    console.log(e.padEnd(6), Object.keys(tot).map((p) => p + ' ' + tot[p].toFixed(1)).join('  '),
      ' | PP+Vox', (tot.pp + tot.vox).toFixed(1));
  });
}

// Valor en escaños de un acto: puntos previstos × escaños de la comunidad / voto decidido.
function valorActo(S, c, acto, tactica) {
  const pv = M.prever(S, c, acto, tactica);
  const v = S.reg[c].v;
  let val = D.REGIONES[c].escanos * pv.g / (100 - v.ind) * (acto === 'puerta' ? 1.5 : 1);
  if (pv.riesgo) val *= 0.8;
  val -= pv.coste * 0.012;
  if (acto === 'cena') val += pv.caja * (S.met.caja < 25 ? 0.03 : 0.004);
  if (acto === 'masas') val += pv.animo * (S.met.animo < 45 ? 0.03 : 0.006);
  return val;
}

function agendaJugador(S) {
  const ids = Object.keys(D.REGIONES);
  const cita = (S.citas || []).find((x) => x.dia === S.dia);
  if (POLITICA === 'quieto') return { ca: null, acto: 'mitin', tactica: null };
  if (POLITICA === 'azar') {
    const pos = ids.filter((c) => M.puedeIr(S, c));
    return { ca: pos[Math.floor(azar() * pos.length)], acto: azar() < 0.7 ? 'mitin' : 'puerta', tactica: null };
  }
  if (POLITICA === 'mitinero') { // solo mítines, sin tácticas: lo más parecido a la v0.1
    const val = ids.filter((c) => M.puedeIr(S, c)).map((c) => [c, valorActo(S, c, 'mitin')]).sort((a, b) => b[1] - a[1]);
    return { ca: val[0][0], acto: 'mitin', tactica: null };
  }
  // listo: mejor combinación de comunidad, acto y carta táctica
  S.orden = S.met.caja < 12 ? 'recaudar' : (S.dia % 3 === 0 ? 'defender' : 'atacar');
  const tacticas = [null].concat(S.mano.filter((id) => D.TACTICAS[id] && !D.TACTICAS[id].espia));
  let mejor = null, mv = -Infinity;
  ids.forEach((c) => {
    D.ORDEN_ACTOS.forEach((acto) => {
      tacticas.forEach((t) => {
        if (!M.puedeIr(S, c, t)) return;
        let v = valorActo(S, c, acto, t) - (t ? 0.12 : 0);
        if (cita && cita.ca === c) v += 0.5;
        if (v > mv) { mv = v; mejor = { ca: c, acto, tactica: t }; }
      });
    });
  });
  return mejor;
}

function elegirCarta(S) {
  const { def } = M.cartaActual(S);
  const lados = ['a', 'b'].filter((l) => M.puedeElegir(S, def[l]));
  if (!lados.length) return 'a';
  if (CARTAS === 'oraculo' && lados.length === 2) {
    const valor = (l) => {
      const C = clonar(S);
      M.elegirOpcion(C, l);
      const e = M.estimacion(C);
      return e[C.jugador] - C.met.sospecha * 0.01;
    };
    return valor('a') >= valor('b') ? 'a' : 'b';
  }
  return lados[Math.floor(azar() * lados.length)];
}

function jugar(partido, escenario, semilla) {
  const S = M.nuevaPartida({ partido, escenario, semilla });
  const stats = { escandalos: 0, euforias: 0 };
  let guard = 0;
  while (S.fase !== 'final' && guard++ < 500) {
    if (S.fase === 'portada') {
      if (S.portada.titular.titular.indexOf('ESTALLA') === 0) stats.escandalos++;
      M.empezarDia(S);
    } else if (S.fase === 'cartas') {
      M.elegirOpcion(S, elegirCarta(S));
      M.siguienteCarta(S);
    } else if (S.fase === 'agenda') {
      S.agenda = agendaJugador(S);
      M.cerrarDia(S);
    } else if (S.fase === 'debate') {
      const mano = M.manoDebate(S);
      for (let r = 0; r < 3; r++) {
        const disponibles = M.manoDebate(S);
        const c = disponibles[Math.floor(azar() * disponibles.length)];
        const rivales = JUG.filter((p) => p !== S.jugador);
        M.jugarRonda(S, { cartaId: c.id, objetivo: rivales[Math.floor(azar() * 3)] });
      }
      M.jugarOro(S, ['emocion', 'propuesta', 'ataque'][Math.floor(azar() * 3)], M.CONFIG && D.PARTIDOS[S.jugador].antagonista);
      M.terminarDebate(S);
      void mano;
    } else if (S.fase === 'reflexion') {
      const ops = M.opcionesReflexion(S);
      M.jugarReflexion(S, ops[0].id);
      M.calcularFinal(S);
    }
  }
  return { S, stats };
}

function informe() {
  console.log('Política del jugador:', POLITICA, '· cartas:', CARTAS, '· partidas por combinación:', N);
  Object.keys(D.ESCENARIOS).forEach((esc) => {
    console.log('\n== Escenario', esc, '==');
    JUG.forEach((yo) => {
      const medallas = { triunfo: 0, victoria: 0, digna: 0, debacle: 0 };
      const gob = { der: 0, izq: 0, bloqueo: 0 };
      let delta = 0, final = 0, escandalos = 0, promesas = 0, ind = 0, caja = 0, visit = 0, aviones = 0;
      const media = {};
      JUG.concat(['otros']).forEach((p) => { media[p] = 0; });
      for (let i = 0; i < N; i++) {
        const { S, stats } = jugar(yo, esc, 7000 + i * 13);
        medallas[S.final.medalla]++;
        gob[S.final.gobierno]++;
        delta += (S.final.esc.total[yo] - S.escInicio[yo]) / N;
        final += S.final.esc.total[yo] / N;
        escandalos += stats.escandalos / N;
        promesas += S.promesas / N; caja += S.met.caja / N; visit += Object.keys(S.stats.visitadas).length / N; aviones += S.stats.aviones / N;
        ind += S.final.est.ind / N;
        Object.keys(media).forEach((p) => { media[p] += S.final.esc.total[p] / N; });
      }
      const pct = (x) => Math.round(x * 100 / N) + '%';
      console.log(yo.padEnd(5), 'escaños', final.toFixed(1).padStart(6), '(Δ', (delta >= 0 ? '+' : '') + delta.toFixed(1) + ')',
        '| 🏆', pct(medallas.triunfo), '🥇', pct(medallas.victoria), '🥈', pct(medallas.digna), '💀', pct(medallas.debacle),
        '| gob der', pct(gob.der), 'izq', pct(gob.izq), 'bloq', pct(gob.bloqueo),
        '| escánd', escandalos.toFixed(2), '| indec', ind.toFixed(1), '| caja', caja.toFixed(0), 'CCAA', visit.toFixed(1), 'vuelos', aviones.toFixed(1), 'prom', Math.round(promesas / 1000) + 'k');
      console.log('      media final:', Object.keys(media).map((p) => p + ' ' + media[p].toFixed(1)).join('  '));
    });
  });
}

function catalogo() {
  console.log('| id | Carta | Cuándo | Partidos | Opciones |');
  console.log('|----|-------|--------|----------|----------|');
  D.CARTAS.forEach((x) => {
    const cuando = x.dia ? 'día ' + x.dia : x.encadenada ? 'encadenada' : x.dias ? 'días ' + x.dias.join('-') : '—';
    const quien = x.solo ? x.solo.join(', ') : x.no ? 'todos menos ' + x.no.join(', ') : 'todos';
    console.log('| `' + x.id + '` | ' + x.icono + ' ' + x.titulo + ' | ' + cuando + ' | ' + quien + ' | ' + x.a.txt + ' / ' + x.b.txt + ' |');
  });
  console.log('\n' + D.CARTAS.length + ' cartas, ' + D.SUCESOS.length + ' sucesos, ' +
    Object.keys(D.CARTAS_DEBATE).length + ' cartas de debate, ' + Object.keys(D.CARTAS_REFLEXION).length + ' de reflexión.');
}

if (args.indexOf('--inicio') >= 0) inicio();
else if (args.indexOf('--catalogo') >= 0) catalogo();
else informe();
