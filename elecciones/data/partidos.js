// Partidos, candidatos y escenarios de partida. Ver dev/campana/DISENO.md §2 y dev/campana/DATOS.md.
// Para cambiar nombres reales por nombres "parecidos pero no iguales", basta con tocar este fichero.
window.DATOS = window.DATOS || {};

window.DATOS.PARTIDOS = {
  psoe: {
    nombre: 'PSOE', largo: 'Partido Socialista', color: '#E30613', claro: '#f7c6c9',
    cand: 'Pedro Sánchez', candCorto: 'Sánchez', fruta: 'Tomate', frutaIcono: '🍅',
    pos: -0.35, vecinos: ['fa', 'pp'], antagonista: 'pp', bloque: 'izq',
    personalidad: 'El superviviente',
    sesgo: { and: 1.25, cat: 1.2, ast: 1.2, clm: 1.2, ext: 1.15, can: 1.1, val: 1.05 },
    contraprogramacion: 0.25,
    debate: { ataque: 0.35, replica: 0.4, propuesta: 0.25 },
  },
  pp: {
    nombre: 'PP', largo: 'Partido Popular', color: '#1D84CE', claro: '#c5e0f5',
    cand: 'Alberto Núñez Feijóo', candCorto: 'Feijóo', fruta: 'Arándano', frutaIcono: '🫐',
    pos: 0.4, vecinos: ['psoe', 'vox'], antagonista: 'psoe', bloque: 'der',
    personalidad: 'El gestor',
    sesgo: { mad: 1.25, gal: 1.2, and: 1.15, val: 1.15, cyl: 1.15, mur: 1.1 },
    contraprogramacion: 0.3,
    debate: { ataque: 0.45, replica: 0.25, propuesta: 0.3 },
  },
  vox: {
    nombre: 'Vox', largo: 'Vox', color: '#5AC035', claro: '#d3efc4',
    cand: 'Santiago Abascal', candCorto: 'Abascal', fruta: 'Melón', frutaIcono: '🍈',
    pos: 0.85, vecinos: ['pp'], antagonista: 'pp', bloque: 'der',
    personalidad: 'El ruido',
    sesgo: { mur: 1.25, ceu: 1.3, mel: 1.2, and: 1.15, mad: 1.15, clm: 1.15, val: 1.1 },
    contraprogramacion: 0.35,
    debate: { ataque: 0.6, replica: 0.2, propuesta: 0.2 },
  },
  fa: {
    nombre: 'Frente Amplio', corto: 'FA', largo: 'Frente Amplio', color: '#7B2D8E', claro: '#e2c9ea',
    cand: 'Ada Colau', candCorto: 'Colau', fruta: 'Uva', frutaIcono: '🍇',
    pos: -0.8, vecinos: ['psoe'], antagonista: 'psoe', bloque: 'izq',
    personalidad: 'La asamblea',
    sesgo: { cat: 1.25, mad: 1.2, val: 1.2, bal: 1.15, ast: 1.15, nav: 1.1, gal: 1.05 },
    contraprogramacion: 0.2,
    debate: { ataque: 0.25, replica: 0.25, propuesta: 0.5 },
  },
  otros: {
    nombre: 'Otros', largo: 'Otros partidos', color: '#8E8E93', claro: '#dedee2',
    fruta: 'Macedonia', frutaIcono: '🥗', pos: 0, vecinos: [], bloque: null,
  },
};

// Orden de dibujo en el hemiciclo (izquierda → derecha) y lista de jugables.
window.DATOS.ORDEN_HEMICICLO = ['fa', 'psoe', 'otros', 'pp', 'vox'];
window.DATOS.JUGABLES = ['psoe', 'pp', 'vox', 'fa'];
window.DATOS.TODOS = ['psoe', 'pp', 'vox', 'fa', 'otros'];

window.DATOS.ESCENARIOS = {
  cis: {
    nombre: 'La encuesta del CIS de Tezanos',
    corto: 'CIS de Tezanos',
    texto: 'Barómetro de octubre: el PSOE arrasa con 12 puntos de ventaja. Fácil para la izquierda, cuesta arriba para la derecha.',
    fuente: 'CIS, estudio 3582 (oct. 2026)',
    voto: { psoe: 34.0, pp: 22.2, vox: 17.1, fa: 6.1, otros: 20.6 },
  },
  indep: {
    nombre: 'Las encuestas independientes',
    corto: 'Encuestas independientes',
    texto: 'Media de 16 sondeos privados: el PP gana y la suma con Vox roza la mayoría absoluta. Todo en el aire.',
    fuente: 'Media de sondeos privados (oct. 2026)',
    voto: { psoe: 26.8, pp: 31.5, vox: 18.8, fa: 6.4, otros: 16.5 },
  },
};
