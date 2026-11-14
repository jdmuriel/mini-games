# Campaña 29-N · Estado del trabajo

Leer primero al empezar una sesión. Actualizar al terminarla.

## Estado actual: v0.2 jugable

Partida completa de principio a fin, en móvil y escritorio, modo claro y oscuro.

Hecho en la v0.2 (ver DISENO §5):

- [x] **La gira** sustituye a la agenda: caravana con vecindades y avión, cuatro tipos de acto, orden
      permanente del nº2, sucesos del mapa, citas de las cartas, filtraciones de la agenda rival y duelos.
- [x] **Escaños en juego** en el mapa (▲/▼) y previsión de cada acto en puntos y escaños.
- [x] **Cercanía**: un acto mueve más puntos en una comunidad pequeña.
- [x] **Cartas tácticas** en la mano (12), jugables en la gira.
- [x] **170 cartas** (eran 92): platós de noviembre, 4 sagas, 21 reactivas, 8 citas, 10 de tácticas.
- [x] **Las promesas cuentan** (debate, castigo el domingo, cartas reactivas, medidor 📜).
- [x] **Resolución animada** del día y **escrutinio en directo** la noche electoral.
- [x] Visual: cartel de inicio, retratos SVG de los personajes, cartas con sello y giro, pistas legibles
      en las opciones, portada compacta con tendencia, color del partido en la interfaz, escritorio a dos
      columnas.
- [x] Probado con Playwright (390×844 claro y oscuro, 1280×800): 7 partidas completas sin errores de consola.

## Pendiente (por prioridad)

1. **Probarlo con personas**: ¿se entiende la gira el día 1? ¿El panel tiene demasiada información?
2. Arrastrar la caravana en el mapa (ahora es tocar comunidad y tocar acto).
3. FA gana 2-4 escaños incluso jugando al azar: revisar la escala por tamaño.
4. Los sucesos del mapa solo afectan al jugador; la IA no los busca.
5. Sonido, logros, partida diaria con semilla, investidura negociada (DISENO §16).
6. Contrastar el voto de 2023 por comunidad con los datos oficiales (`DATOS.md`).

## Decisiones tomadas

- Escaños **proporcionales por comunidad** (como pidió el diseño original), no d'Hondt por provincia.
  Hay un interruptor `CONFIG.METODO` para probar d'Hondt.
- 21 turnos aunque la campaña oficial dure 15 días: los primeros 5 son precampaña.
- Los mítines **no roban** votos a otros partidos, solo movilizan indecisos (ver DISENO §5).
- Efectos escalados por el tamaño del partido (ver DISENO §4).
- Candidatos con nombre real en la pantalla de elección y en los titulares; las bromas fuertes van contra
  "tu candidato"/"el nº2 de X", sin nombres.

- v0.2: las partidas guardadas de la v0.1 no se pueden continuar (`version: 2`).
- v0.2: los duelos por la tele no dependen del tamaño del partido (FA los perdía todos).
- v0.2: nada de tragedias reales en las cartas (ver `CARTAS.md`).

## Cómo probarlo

- Rama publicada en GitHub Pages: `https://jdmuriel.github.io/mini-games/test/claude-nifty-lamport-oph039/elecciones/`
  (necesita la regla `claude/*` en el entorno github-pages, ver README).
- Sin Pages: `https://raw.githack.com/jdmuriel/mini-games/claude/nifty-lamport-oph039/elecciones/index.html`
- En local: `python3 -m http.server 8000` y abrir `http://localhost:8000/elecciones/`.

## Registro de sesiones

### 2026-10-24 · Sesión 1

- Investigación: encuestas (CIS de octubre y media de privadas), reparto de escaños 2026, noticias de
  precampaña (huelga del 11-N, Milei, La Revuelta, cara a cara del 16-N, Frente Amplio con Colau, etc.).
- Diseño completo y primera versión jugable.
- Simulador: se detectó que dar puntos iguales a todos favorece a los partidos pequeños con reparto
  proporcional; se corrigió escalando efectos por tamaño y quitando el robo de votos de los mítines.

### 2026-11-14 · Sesión 2

- Revisión crítica tras jugar: la agenda se jugaba en 6 de 19 comunidades y la segunda mejor opción valía
  el 80 % de la primera; el mazo se repetía en la segunda partida.
- v0.2: la gira, cartas nuevas, promesas con efecto, resolución del día, escrutinio y rediseño visual.
- Noticias de noviembre añadidas a `NOTICIAS.md` (La Revuelta, El Hormiguero, Jordi Wild).
