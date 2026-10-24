# dev/

Documentación de trabajo de los juegos. No se enlaza desde la web: sirve para diseñar, retomar el trabajo
entre sesiones y dejar constancia de las decisiones.

## Convención

```
dev/
  README.md            Este fichero
  tools/               Scripts de apoyo (generar datos, simular partidas...)
  <juego>/
    DISENO.md          Documento de diseño: reglas, fórmulas y números. La fuente de verdad.
    ESTADO.md          Estado del trabajo: hecho, pendiente, ideas, registro de sesiones.
    *.md               Documentos adicionales para elementos concretos (cartas, datos, noticias...)
```

Al empezar una sesión: leer `ESTADO.md` del juego y después la parte de `DISENO.md` que toque.
Al terminar: actualizar `ESTADO.md` (qué se hizo, qué queda) y, si cambiaron reglas o números, `DISENO.md`.
Si un número cambia en el código (`CONFIG` del motor), cambia también en el documento.

## Juegos

- `campana/`: **Campaña 29-N**, simulador satírico de las elecciones generales del 29 de noviembre de 2026
  (código en `/elecciones`).
