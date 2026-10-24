# Mini Juegos

Colección de mini juegos estáticos (HTML + CSS + JavaScript) publicados en GitHub Pages.

## Juegos

- **Wordle** (`wordle/`): adivina la palabra de 5 letras en 6 intentos. Palabra del día y modo libre.
- **Campaña 29-N** (`elecciones/`): simulador satírico de las elecciones generales del 29-N. 21 días de
  campaña, mítines por comunidades, cartas de evento al estilo *Reigns*, debate y noche electoral.
  Diseño y estado en `dev/campana/`.

## Estructura

```
index.html        Página de inicio (descripción + botón para entrar)
shared/base.css   Estilos y colores comunes
wordle/           Un directorio por juego
elecciones/
dev/              Documentos de diseño y estado de cada juego, y herramientas (ver dev/README.md)
```

Cada juego es autocontenido en su carpeta. Sin build ni dependencias: JavaScript plano en scripts clásicos,
así funciona igual en GitHub Pages que abriendo `index.html` directamente.
El estado (partidas, estadísticas) se guarda solo en `localStorage`, con el prefijo `mini-games:<juego>:`.

Para juegos con gráficos/física en canvas, la idea es añadir [Phaser](https://phaser.io) desde CDN en esa carpeta,
sin afectar al resto.

## Desarrollo local

```sh
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Despliegue

El workflow `.github/workflows/pages.yml` publica el repositorio en GitHub Pages en cada push a `main`
(o manualmente desde la pestaña *Actions*).

Configuración inicial (una sola vez): *Settings → Pages → Build and deployment → Source: GitHub Actions*.

Para equilibrar Campaña 29-N sin navegador:

```sh
node dev/tools/simular.js --inicio      # escaños de partida
node dev/tools/simular.js -n 40         # partidas IA contra IA
```

## Créditos

Diccionario de palabras válidas derivado de [an-array-of-spanish-words](https://github.com/words/an-array-of-spanish-words) (MIT).
Mapa de comunidades autónomas de Campaña 29-N derivado de `spain-communities.geojson` del proyecto
[click_that_hood](https://github.com/codeforgermany/click_that_hood).
