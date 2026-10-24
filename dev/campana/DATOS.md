# Campaña 29-N · Datos

Datos de partida del juego y de dónde salen. Consultados el 24 de octubre de 2026.
El código los lee de `elecciones/data/partidos.js` y `elecciones/data/regiones.js`.

## Encuestas (escenarios)

### "La encuesta del CIS de Tezanos" — barómetro de octubre 2026

CIS, estudio 3582, publicado el 14-oct-2026. Trabajo de campo del 1 al 6 de octubre, 5.025 entrevistas.
Estimación de voto: **PSOE 34,0 · PP 22,2 · Vox 17,1 · Sumar/Frente Amplio 6,1** · Podemos 3,1 · ERC 3,0 ·
SALF 1,8 · EH Bildu 1,6 · Junts 1,1 · BNG 0,9 · PNV 0,6.

En el juego: PSOE 34,0 · PP 22,2 · Vox 17,1 · FA 6,1 · Otros 20,6 (el resto hasta 100).

Fuentes:
- https://www.cis.es/documents/d/guest/3582_estimacion-pdf
- https://electomania.es/barometro-del-cis-oct26-la-izquierda-se-dispara-con-el-psoe-en-el-34/
- https://www.cmmedia.es/noticias/espana/barometro-cis-octubre-2026-psoe-pp-vox.html

### "Encuestas independientes" — media de sondeos privados, octubre 2026

Media de 16 institutos recopilada por Demócrata: **PP 31,4-31,7 · PSOE 26,8-26,9 · Vox 18,7-18,8 ·
Frente Amplio 6,3-6,4** · Podemos 3,1. Algunos sondeos sueltos: IMOP (El Confidencial, 23-oct) PP 28,5,
PSOE 27,1, Vox 20, FA 8,9; GESOP (12-oct) PP 28,7, PSOE 26,1, Vox 18,9, FA 8; SocioMétrica (sept) PP 33,9,
PSOE 25,7, Vox 18,0; Sigma Dos: Vox 19,5, PP 25,3.

En el juego: PP 31,5 · PSOE 26,8 · Vox 18,8 · FA 6,4 · Otros 16,5.

Fuentes:
- https://www.democrata.es/elecciones-generales-espana/herramientas/encuestas
- https://www.democrata.es/encuestas/elecciones-generales/encuesta-elecciones-generales-imop-psoe-frente-amplio-vox-pp-octubre-2026/
- https://www.infobae.com/espana/2026/10/20/asi-estan-los-sondeos-de-las-elecciones-generales-de-espana-2026/

Con el reparto lineal del juego (sin d'Hondt) salen aproximadamente:

| Escenario | PSOE | PP | Vox | FA | Otros | Bloque PP+Vox |
|-----------|-----:|---:|----:|---:|------:|------:|
| CIS | ~119 | ~78 | ~60 | ~21 | ~72 | ~138 |
| Independientes | ~94 | ~110 | ~66 | ~22 | ~58 | ~176 |

El escenario de independientes empieza en el filo de la mayoría absoluta del bloque de derechas: es el
más igualado. El del CIS es fácil para PSOE/FA y muy difícil para PP/Vox.
(Ver la salida de `node dev/tools/simular.js --inicio` para los números exactos.)

## Escaños por comunidad (2026)

Real Decreto 806/2026 de disolución y convocatoria. Cambian dos circunscripciones respecto a 2023:
Madrid sube de 37 a 38 y Cádiz baja de 9 a 8 (Andalucía 60). Total 350.

Fuentes:
- https://www.estrelladigital.es/articulo/espana/escanos-provincias-elecciones-29-noviembre-congreso-diputados/20261020131814452348.html
- https://www.articulo14.es/espana-por-la-igualdad/estas-son-las-provincias-que-ganan-escanos-y-las-que-pierden-de-cara-a-las-elecciones-del-29-n-20261006.html

## Voto de 2023 por comunidad (base regional)

Porcentajes aproximados del voto a candidaturas en las generales de julio de 2023, redondeados.
"FA" toma el voto de Sumar en 2023 (que incluía a Podemos). "Otros" agrupa todo lo demás.
**Pendiente**: contrastar con los datos oficiales del Ministerio del Interior (ver `ESTADO.md`). Para el
juego basta con la forma del mapa (dónde es fuerte cada uno), porque luego se reescala al escenario.

| id | Comunidad | Esc. | Censo (miles) | PP | PSOE | Vox | FA | Otros | Gob. autonómico | Otros allí |
|----|-----------|----:|------:|---:|-----:|----:|---:|------:|----|----|
| and | Andalucía | 60 | 6650 | 36,6 | 33,2 | 14,7 | 11,0 | 4,5 | PP | Podemos, SALF |
| ara | Aragón | 13 | 1010 | 36,6 | 30,6 | 15,4 | 10,2 | 7,2 | PP | Teruel Existe |
| ast | Asturias | 7 | 870 | 34,8 | 34,5 | 12,6 | 13,6 | 4,5 | PSOE | Foro, Podemos |
| bal | Baleares | 8 | 820 | 35,8 | 31,5 | 16,0 | 12,6 | 4,1 | PP | Més, Podemos |
| can | Canarias | 15 | 1780 | 31,6 | 32,0 | 11,8 | 10,8 | 13,8 | CC (otros) | Coalición Canaria |
| cnt | Cantabria | 5 | 480 | 39,4 | 29,1 | 14,2 | 8,5 | 8,8 | PP | PRC |
| cyl | Castilla y León | 31 | 2060 | 39,4 | 30,4 | 17,0 | 6,9 | 6,3 | PP | UPL, Soria ¡Ya! |
| clm | Castilla-La Mancha | 21 | 1600 | 39,4 | 33,8 | 18,4 | 6,0 | 2,4 | PSOE | Podemos, SALF |
| cat | Cataluña | 48 | 5450 | 13,3 | 34,5 | 7,8 | 14,0 | 30,4 | PSOE (PSC) | ERC, Junts, CUP |
| val | C. Valenciana | 33 | 3700 | 35,6 | 30,4 | 16,0 | 15,6 | 2,4 | PP | Podemos, SALF |
| ext | Extremadura | 9 | 880 | 39,1 | 37,0 | 15,6 | 6,3 | 2,0 | PP | Podemos |
| gal | Galicia | 23 | 2240 | 43,6 | 30,0 | 5,8 | 9,3 | 11,3 | PP | BNG |
| mad | Madrid | 38 | 5100 | 40,5 | 27,4 | 13,9 | 15,3 | 2,9 | PP | Podemos, SALF |
| mur | Murcia | 10 | 1080 | 41,0 | 25,4 | 21,4 | 9,7 | 2,5 | PP | Podemos |
| nav | Navarra | 5 | 510 | 16,5 | 27,4 | 6,4 | 11,6 | 38,1 | PSOE | Bildu, UPN, Geroa Bai |
| pvs | País Vasco | 18 | 1760 | 11,6 | 25,3 | 2,6 | 11,1 | 49,4 | PNV (otros) | PNV, Bildu |
| rio | La Rioja | 4 | 250 | 44,6 | 32,5 | 12,0 | 7,6 | 3,3 | PP | Podemos |
| ceu | Ceuta | 1 | 62 | 40,0 | 27,0 | 27,0 | 2,0 | 4,0 | PP | — |
| mel | Melilla | 1 | 57 | 49,6 | 22,2 | 17,3 | 3,0 | 7,9 | PP | Coalición por Melilla |

El censo (aproximado, electores residentes) solo sirve para ponderar el total nacional.

## Cómo se construye el escenario por comunidad

1. Se parte de la tabla de 2023 (sobre 100 % de voto decidido).
2. Para cada partido, factor `f[p] = objetivo[p] / nacional_actual[p]`; se multiplica `v[c][p] *= f[p]`
   y se renormaliza cada comunidad a 100. Se repite 30 veces (ajuste proporcional iterativo).
3. Se añade ruido de ±0,5 puntos por partido y comunidad y se renormaliza.
4. Se escala a 82 % (decididos) y se añade 18 % de indecisos.

## Mapa

`elecciones/data/mapa.js` se genera con `dev/tools/build_map.py` a partir de
`spain-communities.geojson` del proyecto *click_that_hood* (Code for America / Code for Germany).
