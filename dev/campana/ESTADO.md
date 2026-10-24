# Campaña 29-N · Estado del trabajo

Leer primero al empezar una sesión. Actualizar al terminarla.

## Estado actual: v0.1 jugable

Partida completa de principio a fin, en móvil y escritorio, modo claro y oscuro.

Hecho:

- [x] Documento de diseño (`DISENO.md`), datos (`DATOS.md`), noticias (`NOTICIAS.md`), cartas (`CARTAS.md`).
- [x] Datos: 4 partidos + otros, 2 escenarios (CIS / independientes), 19 comunidades con escaños de 2026.
- [x] Mapa SVG real de las CCAA (generado con `dev/tools/build_map.py`), Canarias en recuadro, Ceuta y
      Melilla como círculos pulsables.
- [x] Motor (`elecciones/motor.js`): voto por comunidad con indecisos, escaños proporcionales (o d'Hondt),
      mítines con hastío, olvido, ruido mediático y cierre ×1,8, IA de agenda con dos algoritmos,
      medidores Caja/Ánimo/Sospecha con umbrales, huelgas en dos tiempos, campañas, cartas encadenadas,
      sucesos de los rivales, debate a cuatro (piedra-papel-tijera), jornada de reflexión, margen de
      error, investidura y veredictos.
- [x] Cartas: 92 de evento, 14 sucesos, 10 de debate, 6 de reflexión.
- [x] Interfaz (`elecciones/ui.js`): inicio, elección, portada de periódico (con modo niebla y modo
      Andorra), cartas deslizables, agenda con mapa y lista, debate, reflexión, noche electoral, compartir.
- [x] Partida guardada en `localStorage`.
- [x] Simulador de equilibrio (`dev/tools/simular.js`) y primera ronda de ajuste (ver DISENO §15).
- [x] Probado con Playwright a 390×844 en claro y oscuro: partidas completas sin errores de consola.

## Pendiente (por prioridad)

1. **Probarlo con personas** y ajustar: ¿se entiende la agenda sin leer la ayuda? ¿Las cartas cansan?
2. **Más cartas** (ver la lista en `CARTAS.md`): con 2 por día y 92 en total, en la tercera partida
   empiezan a repetirse. Objetivo: 150.
3. Contrastar el voto de 2023 por comunidad con los datos oficiales del Ministerio del Interior
   (ahora son aproximados, ver `DATOS.md`).
4. Revisar si el escenario CIS debe dejar alguna opción de gobierno a la derecha (ahora es imposible).
5. Animaciones: recuento en la noche electoral, voltear la carta al elegir.
6. Un tutorial de 3 pasos el día 1 (ahora hay un aviso en la agenda y la pantalla de ayuda).
7. Logros y partida diaria con semilla compartida (ver ideas en DISENO §16).

## Decisiones tomadas

- Escaños **proporcionales por comunidad** (como pidió el diseño original), no d'Hondt por provincia.
  Hay un interruptor `CONFIG.METODO` para probar d'Hondt.
- 21 turnos aunque la campaña oficial dure 15 días: los primeros 5 son precampaña.
- Los mítines **no roban** votos a otros partidos, solo movilizan indecisos (ver DISENO §5).
- Efectos escalados por el tamaño del partido (ver DISENO §4).
- Candidatos con nombre real en la pantalla de elección y en los titulares; las bromas fuertes van contra
  "tu candidato"/"el nº2 de X", sin nombres.

## Cómo probarlo

- Rama publicada en GitHub Pages: `https://jdmuriel.github.io/mini-games/test/claude-minijuegos-brainstorm-lvxmg7/elecciones/`
  (necesita la regla `claude/*` en el entorno github-pages, ver README).
- Sin Pages: `https://raw.githack.com/jdmuriel/mini-games/claude/minijuegos-brainstorm-lvxmg7/elecciones/index.html`
- En local: `python3 -m http.server 8000` y abrir `http://localhost:8000/elecciones/`.

## Registro de sesiones

### 2026-10-24 · Sesión 1

- Investigación: encuestas (CIS de octubre y media de privadas), reparto de escaños 2026, noticias de
  precampaña (huelga del 11-N, Milei, La Revuelta, cara a cara del 16-N, Frente Amplio con Colau, etc.).
- Diseño completo y primera versión jugable.
- Simulador: se detectó que dar puntos iguales a todos favorece a los partidos pequeños con reparto
  proporcional; se corrigió escalando efectos por tamaño y quitando el robo de votos de los mítines.
