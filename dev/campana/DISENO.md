# Campaña 29-N · Documento de diseño

> Simulador satírico de campaña electoral. Elecciones generales españolas del **29 de noviembre de 2026**.
> 21 días de campaña, 350 escaños, cartas de evento al estilo *Reigns* y un poco de estrategia.
> Juego HTML estático, jugable en móvil. Código en `/elecciones`.

Documentos relacionados:

- [`ESTADO.md`](ESTADO.md): qué está hecho, qué falta y registro de sesiones.
- [`DATOS.md`](DATOS.md): encuestas, escaños por comunidad y datos de partida (con fuentes).
- [`NOTICIAS.md`](NOTICIAS.md): noticias reales en las que se basan las cartas.
- [`CARTAS.md`](CARTAS.md): formato de las cartas, guía de tono y de equilibrio, catálogo.

---

## 1. Visión

**Frase de venta**: *"21 días, 350 escaños y ni una pizca de vergüenza."*

El jugador dirige la campaña de uno de los cuatro partidos nacionales. Cada día decide **dónde dan el mitin**
su candidato y su número 2, y **cómo reacciona** a lo que pasa (cartas de evento: catástrofes, platós de
televisión, deslices, líderes extranjeros, juzgados, huelgas...). El objetivo es llegar al 29-N con los
escaños suficientes para gobernar, o al menos con algo que celebrar en el balcón.

Pilares:

1. **Regla de oro de Sid Meier**: reglas simples que se explican en una frase; la dificultad sale de
   combinarlas, no de su número. Cada mecánica debe caber en la pantalla de ayuda.
2. **Humor negro y mala baba, sin bando**: todos los partidos reciben por igual. Ningún partido tiene
   reglas distintas; solo cambian sus datos (dónde son fuertes) y sus cartas específicas, en igual número
   y con efectos de igual tamaño (ver `CARTAS.md`, *regla de simetría*).
3. **Pegado a la actualidad**: las cartas parten de noticias reales de la precampaña (`NOTICIAS.md`).
4. **Partidas cortas**: 21 turnos de 1-2 minutos. Una partida, 20-30 minutos. Se guarda sola.
5. **Móvil primero**: todo se juega con el pulgar; el mapa siempre tiene una alternativa en lista.

## 2. Partidos y escenarios

### Partidos

| id | Partido | Color | Candidato | Posición (−1 izq, +1 der) | Vecinos ideológicos |
|----|---------|-------|-----------|------|------|
| `psoe` | PSOE | rojo `#E30613` | Pedro Sánchez | −0,35 | FA, PP |
| `pp` | PP | azul `#1D84CE` | Alberto Núñez Feijóo | +0,40 | PSOE, Vox |
| `vox` | Vox | verde `#5AC035` | Santiago Abascal | +0,85 | PP |
| `fa` | Frente Amplio | morado `#7B2D8E` | Ada Colau | −0,80 | PSOE |
| `otros` | Otros (ERC, Junts, PNV, Bildu, BNG, CC, Podemos, SALF...) | gris | — | — | — |

- Los nombres de partido y candidato están en un único fichero de datos (`elecciones/data/partidos.js`) para
  poder cambiarlos por nombres parecidos-pero-no-iguales si hiciera falta. Las cartas nunca escriben un
  nombre propio a pelo: usan marcadores (`{CAND}`, `{OBJ}`...). Los números 2 no tienen nombre: son "tu nº2".
- **Otros** no se puede elegir ni hace campaña. Es el bloque de partidos territoriales y pequeños: no da
  mítines y no "se enfría", así que gana peso donde nadie hace campaña (Cataluña, País Vasco...).

### Escenarios de partida

El jugador elige con qué encuesta empieza la campaña. Es, en la práctica, el selector de dificultad.

| Escenario | PSOE | PP | Vox | FA | Otros | Fuente |
|-----------|-----:|---:|----:|---:|------:|--------|
| **La encuesta del CIS de Tezanos** | 34,0 | 22,2 | 17,1 | 6,1 | 20,6 | CIS, barómetro de octubre 2026 (estudio 3582) |
| **Encuestas independientes** | 26,8 | 31,5 | 18,8 | 6,4 | 16,5 | Media de 16 sondeos privados (octubre 2026) |

Porcentajes sobre voto decidido. Además empiezan un **18 % de indecisos** en cada comunidad.
Los valores de cada comunidad se obtienen aplicando a los resultados de 2023 de esa comunidad un factor
multiplicativo por partido (ajuste iterativo) hasta cuadrar el total nacional del escenario
(detalle en `DATOS.md`). Al empezar se añade un ruido de ±0,5 puntos para que no haya dos partidas iguales.

## 3. Estructura de la partida

| Día | Fecha | Qué pasa |
|----:|-------|----------|
| 1 | dom 8 nov | Empieza la precampaña. Carta fija: la **huelga general del 11-N** (¿la apoyas?). |
| 4 | mié 11 nov | Se celebra la huelga general. |
| 6 | vie 13 nov | Empieza la campaña oficial. Carta fija: **pegada de carteles**. |
| 9 | lun 16 nov | **Cara a cara** PSOE-PP en televisión (carta fija; Vox y FA no están invitados). |
| 15 | dom 22 nov | Carta fija: preparar el debate. |
| 16 | lun 23 nov | **Debate a cuatro** en televisión (minijuego, por la noche). |
| 17 | mar 24 nov | **Prohibido publicar encuestas** (ley electoral). Solo la prensa andorrana publica "precios de fruta". |
| 20 | vie 27 nov | **Cierre de campaña**: los mítines valen ×1,8. |
| 21 | sáb 28 nov | **Jornada de reflexión**: sin mítines; cartas especiales muy potentes y arriesgadas. |
| — | dom 29 nov | **Noche electoral**: resultados, investidura y portada del lunes. |

Aunque la campaña oficial dura 15 días (13-27 nov), el juego cubre 21 días incluyendo el final de la
precampaña; mecánicamente todos los días son iguales salvo los marcados.

### Un día normal

1. **Portada** del periódico del día: titular con lo más gordo de ayer, mapa, hemiciclo, encuesta y breves
   (mítines de los rivales, sucesos, resultados de tus cartas).
2. **Cartas del día**: 2 cartas. Cada una tiene dos opciones (deslizar a izquierda/derecha o pulsar).
3. **Agenda**: eliges la comunidad del **mitin principal** (candidato) y la del **secundario** (nº2).
4. **Cerrar el día**: los rivales eligen sus mítines a la vez que tú, se resuelve todo y pasa la noche.

## 4. El modelo electoral

### Estado

Para cada comunidad autónoma *c* y partido *p* se guarda `v[c][p]`: porcentaje del electorado de *c* que
votaría a *p*. Lo que falta hasta 100 son **indecisos** `v[c].ind`. Siempre suma 100.

### Escaños (lineales, como se pidió)

Cada comunidad reparte sus escaños **proporcionalmente** entre los votos decididos (los indecisos no
cuentan), por **restos mayores**. No es la ley d'Hondt: así el jugador puede razonar "1 punto en Andalucía
son ~0,7 escaños". El motor tiene `CONFIG.METODO = 'dhondt'` como alternativa por si se quiere probar.

Regla útil para diseñar: **1 punto nacional ≈ 4 escaños** (350 escaños / ~82 % de decididos).

| Comunidad | Escaños | Comunidad | Escaños |
|-----------|--------:|-----------|--------:|
| Andalucía | 60 | Galicia | 23 |
| Cataluña | 48 | Castilla-La Mancha | 21 |
| Madrid | 38 | País Vasco | 18 |
| C. Valenciana | 33 | Canarias | 15 |
| Castilla y León | 31 | Aragón | 13 |
| Murcia | 10 | Extremadura | 9 |
| Baleares | 8 | Asturias | 7 |
| Cantabria | 5 | Navarra | 5 |
| La Rioja | 4 | Ceuta / Melilla | 1 / 1 |

(Reparto del Real Decreto 806/2026: Madrid sube a 38 y Andalucía baja a 60 por Cádiz.)

### Ideología fija de cada comunidad

Cada comunidad tiene un **termómetro ideológico fijo** `der[c]` = peso del bloque PP+Vox frente a
PSOE+FA en 2023 (de 0 a 1). No cambia durante la partida: es "cuántos conservadores y progresistas hay".
Se usa en las **cartas de bloque** ("moviliza a la derecha", "efecto rebote en la izquierda"): el efecto
en cada comunidad se multiplica por `der[c]/der_nacional` (o por su inverso para la izquierda), y dentro del
bloque se reparte en proporción al voto de cada partido. También se enseña en la ficha de cada comunidad.

### Movimientos de voto (el vocabulario de todo el juego)

Todo efecto se expresa como uno de estos tres movimientos, en **puntos del electorado**:

| Movimiento | Qué hace | Ejemplo |
|------------|----------|---------|
| **Movilizar** `+n` | indecisos → partido | Un buen mitin, un vídeo viral. |
| **Desmovilizar** `−n` | partido → indecisos | Un escándalo: tus votantes se quedan en casa. |
| **Trasvase** `n` | partido A → partido B | "Voto útil", un debate. |

Cuando el efecto es **nacional**, se reparte entre comunidades en proporción a la fuerza local del partido
(un punto nacional del PSOE pesa más en Andalucía que en Murcia). Ningún valor baja de 0,1.

**Escala por tamaño.** Los números de las cartas están pensados para un partido del 25 %. Al aplicarse se
multiplican por `√(estimación del partido / 25)`, entre 0,45 y 1,25 (FA ×0,5, Vox ×0,87, PP ×1,12).
Motivo (descubierto con el simulador): con reparto proporcional, dar los **mismos puntos** a todos
beneficia al pequeño, porque sus escaños crecen en proporción. Sin esta escala, FA y Vox ganaban ~10
escaños solo con estar en la partida.

## 5. Mítines

Cada día cada partido da **2 mítines**: el **principal** (candidato) y el **secundario** (nº2).

**Ganancia de un mitin** (puntos del electorado de esa comunidad):

```
G = 1,6 × rol × implantación × ánimo × hastío × ruido_mediático × cierre × azar
```

| Factor | Valor | Por qué |
|--------|-------|---------|
| `rol` | principal 1 · secundario 0,5 · secundario en la misma comunidad que el principal: 0,25 | El candidato tira más; dos mítines propios en el mismo sitio se pisan. |
| `implantación` | voto decidido local del partido / 25 %, entre 0,3 y 1,3 | Moviliza más quien ya tiene mucha gente allí: no es lo mismo Vox en Murcia que en Euskadi. Es proporcional para no favorecer a nadie (ver la escala por tamaño en §4). |
| `ánimo` | 0,6 + 0,8 × Ánimo/100 (solo jugador; la IA usa 1) | Unas bases desanimadas no llenan plazas. |
| `hastío` | 1 − 0,35 × (mítines propios en esa comunidad en los 3 días anteriores; secundario cuenta 0,5). Mínimo −0,4 | Repetir aburre; a partir del 4º seguido, **resta**. |
| `ruido mediático` | 1 / (1 + 0,3 × mítines rivales ese día en esa comunidad) | Si todos van al mismo sitio, nadie sale en la tele. |
| `cierre` | ×1,8 el día 20 | El último mitin es el que se recuerda. |
| `azar` | 0,8 – 1,2 | "8.000 asistentes según la organización, 800 según la policía". |

**De dónde salen los votos**: de los **indecisos** de la comunidad. Los mítines movilizan; robar votos a
otros partidos es cosa de las cartas y del debate (trasvases).

> Se probó que el 30 % se robara a los vecinos ideológicos (`CONFIG.DE_INDECISOS = 0,7`), pero el PP, que
> está en medio y es grande, se desangraba hacia Vox y PSOE en todas las partidas. Queda desactivado.

### Olvido (perder influencia)

Si un partido lleva **4 días o más** sin mitin en una comunidad, cada noche el **0,8 %** de sus votantes
de allí pasa a indecisos ("se enfrían"). *Otros* no se enfría nunca.

### Cristalización

Cada noche el **1,2 %** de los indecisos de cada comunidad se decide, repartiéndose en proporción al voto
actual. Los indecisos van bajando: los mítines tardíos tienen menos combustible.

### IA de los rivales (algoritmos de agenda)

Los rivales eligen a la vez que el jugador, sin saber dónde irá. Combinan dos algoritmos:

1. **Codicioso** (siempre): puntúa cada comunidad con
   `escaños × ganancia_estimada / decididos × sesgo_del_partido × azar(0,75–1,25)`, donde la ganancia
   estimada usa la misma fórmula del mitin (afinidad, hastío, indecisos disponibles y ruido mediático de
   ayer). Bonus +20 % si allí se está "enfriando". El día 20 añade `×(1 + escaños/30)`: todos quieren cerrar
   a lo grande.
2. **Contraprogramación** (con probabilidad propia): el mitin principal va a la comunidad donde ayer dio
   el suyo su **antagonista**, si allí vale al menos la mitad que la mejor opción.

El secundario va a la mejor comunidad distinta de la del principal.

**Cartas fuera de cámara**: los rivales no juegan cartas, pero cada noche movilizan `0,12 × (su voto / 25)`
puntos. Equivale a lo que gana de media un jugador que elige cartas al azar; así, jugar las cartas peor que
la media se paga.

| Partido | Personalidad | Sesgo (feudos) | Contraprogramación | Antagonista |
|---------|-------------|----------------|------------------:|-------------|
| PSOE | "El superviviente" | Andalucía, Cataluña, Asturias, C-LM, Extremadura, Canarias | 25 % | PP |
| PP | "El gestor" | Madrid, Galicia, Andalucía, C. Valenciana, C. y León | 30 % | PSOE |
| Vox | "El ruido" | Murcia, Ceuta, Melilla, Andalucía, Madrid, C-LM, C. Valenciana | 35 % | PP |
| FA | "La asamblea" | Cataluña, Madrid, C. Valenciana, Baleares, Asturias, Navarra | 20 % | PSOE |

## 6. Medidores del jugador (lo *Reigns*)

Tres barras de 0 a 100 arriba de la pantalla. Las cartas muestran con puntos qué barras tocará cada opción
(sin decir cuánto), como en *Reigns*.

| Medidor | Empieza | Cada noche | Para qué sirve | En el extremo |
|---------|--------:|-----------|----------------|---------------|
| 💶 **Caja** | 50 | +4 (donaciones) | Pagar opciones de las cartas (campañas, vídeos, fichajes). | Sin caja no puedes elegir opciones que cuesten dinero. |
| 🔥 **Ánimo** de las bases | 60 | −1; ±3 según suban o bajen tus escaños | Multiplica tus mítines (0,6× a 1,4×). | 100: **euforia**, mañana tu nº2 se viene arriba (carta forzada). 0: **desbandada**, vuelve a 15 y pierdes 0,5 puntos. |
| 🕵️ **Sospecha** | 25 | −1 (la gente olvida) | Sube con el juego sucio. | 100: **estalla el escándalo**: −2 puntos nacionales, Ánimo −20, vuelve a 45. |

Todos los partidos empiezan con los mismos valores (regla de simetría).

Además se lleva la cuenta de las **promesas electorales** (en millones de euros). No tiene efecto
mecánico; sale en la portada final: *"Has prometido 87.000 millones. El déficit te manda saludos."*

## 7. Cartas de evento

Cada día salen **2 cartas** (ninguna el día de reflexión, que tiene su pantalla). Primero las **fijas** del día y las **encadenadas**
(consecuencias de cartas anteriores); el resto se roba al azar del mazo según peso y condiciones.

Cada carta tiene: personaje que la trae (estilo *Reigns*), título, texto y **dos opciones**. Una opción
puede:

- mover votos (movilizar / desmovilizar / trasvasar) en todo el país, en una comunidad o en un bloque;
- tocar los medidores (Caja, Ánimo, Sospecha) o sumar promesas;
- tener **riesgo** (probabilidad de salir bien o mal, a veces distinta según el partido);
- dar una **carta a la mano** para el debate o para la jornada de reflexión (máximo 5 en la mano);
- lanzar una **campaña** de varios días (apoyo local o general, o ataque a un rival);
- convocar una **huelga** que se resuelve días después;
- **encadenar** otra carta para mañana.

Tipos de carta (todas con su ración de humor negro):

| Tipo | Ejemplos | Notas |
|------|----------|-------|
| Catástrofes | Gota fría, nevada, apagón | Castigan al Gobierno central y al autonómico de esa comunidad. Tú decides si vas con botas de agua. |
| Platós | *La Revuelta*, *El Hormiguero* | Riesgo distinto según el partido (el público no es el mismo). |
| Deslices | Micrófono abierto, caída del escenario, velatorio por error | Pura mala baba, para todos por igual. |
| Líderes extranjeros | Milei, Trump, Lula, bots rusos | Efecto de bloque: suben a los afines y movilizan a los contrarios (efecto rebote). |
| Famosos | Reguetonero, futbolista, actriz en los Goya | |
| Judiciales | Una por partido, mismo tamaño | |
| Huelgas | General 11-N, médicos, tractores, Rodalies, profesores | Ver §8. |
| Juego sucio | Karaoke del nº2 rival, bots, lona gigante, encuesta "amiga" | Suben Sospecha; pueden volverse en tu contra. |
| Campañas | Buzoneo, influencers, "ellos votaron NO" | Cuestan Caja; efecto durante varios días. |
| Del partido | 5 por partido | Solo salen si juegas con ese partido. |

Además, cada día hay un 60 % de que un **suceso** automático afecte a un partido rival (sin decisión:
"El cartel de Vox tiene una falta de ortografía en *España*"). Los sucesos son simétricos: la mitad suman y
la mitad restan, con el mismo tamaño medio.

Tamaños de efecto (para escribir cartas equilibradas; detalles en `CARTAS.md`):

| Tamaño | Puntos | ≈ Escaños |
|--------|-------:|----------:|
| Pequeño | 0,1 – 0,3 | 0,5 – 1 |
| Medio | 0,4 – 0,7 | 2 – 3 |
| Grande | 0,8 – 1,5 | 3 – 6 |
| Reflexión | 1 – 2 | 4 – 8 |

## 8. Huelgas

Una huelga son **dos momentos**: la **convocatoria** (carta) y el **día de huelga** (unos días después).

- Convocatoria: el jugador elige **apoyarla** o **criticarla**. Los rivales tienen postura fija por huelga
  (normalmente: la izquierda apoya y la derecha critica, salvo excepciones como los tractores).
  Efecto pequeño inmediato contra el **objetivo** (el Gobierno central o el autonómico).
- Día de huelga: se calcula el **seguimiento**:
  `45 % + azar(±20) + 40 × (voto de los partidos que la apoyan − 0,5)`, entre 15 y 90 %.
  Es una mini-elección:

| Seguimiento | Quien apoya | Quien critica | Objetivo |
|-------------|------------|---------------|----------|
| ≥ 50 % (éxito) | +0,5 | −0,3 | −0,6 |
| < 50 % (fracaso) | −0,3 | +0,3 | +0,2 |

(Puntos nacionales si la huelga es general; si es de una comunidad, el doble y solo allí.) Si el objetivo es tu propio partido y la
apoyas... también se puede. España.

**La huelga general del 11-N** (real: CCOO y UGT, por la vivienda) se convoca el día 1 y se celebra el día 4.
Objetivo: el Gobierno (PSOE). Posturas: PSOE y FA apoyan (es "contra la oposición que tumbó los decretos"),
PP y Vox critican. El caso raro español de huelga que puede beneficiar al Gobierno.

## 9. Debate a cuatro (día 16)

Minijuego de **piedra-papel-tijera con cartas**. Participan los cuatro candidatos.

Tipos de carta:

- ⚔️ **Ataque** (eliges a quién) gana a 💡 **Propuesta** (le interrumpes).
- 💡 **Propuesta** gana a 🛡️ **Réplica** (el otro está a la defensiva y tú propones).
- 🛡️ **Réplica** gana a ⚔️ **Ataque** (zasca).

Cada carta tiene **fuerza** 1-3 y a veces un **tema**. Hay 3 bloques (Economía y vivienda; Corrupción y
regeneración; España: territorio e inmigración) y un **minuto de oro**. Si el tema coincide con el bloque,
+1 de fuerza. El jugador juega las cartas que guardó durante la campaña; si no tiene, **improvisa** (fuerza 1,
del tipo que quiera, ilimitadas).

Puntuación de cada bloque:

| Situación | Puntos |
|-----------|--------|
| Atacas a alguien que juega Propuesta | tú +fuerza; él −1 (y su propuesta no puntúa) |
| Atacas a alguien que juega Réplica | tú −1; él +fuerza+1 (+1 por cada atacante extra) |
| Atacas a alguien que también ataca | tú +⌈fuerza/2⌉ (bronca) |
| Propuesta sin que nadie te ataque | +fuerza |
| Réplica sin que nadie te ataque | −1 (contestas a la nada) |

**Minuto de oro**: cada uno elige *emocionar* (60 %: +3; si no, −1), *propuesta estrella* (+1,5 seguro) o
*ataque final* (60 %: +2 y el atacado −1; si no, el moderador te corta: −1).

**IA**: cada rival recibe 3 cartas con tipos según su personalidad (Vox ataca mucho, FA propone, el PSOE
replica, el PP ataca). El que va primero en escaños tiende a replicar; los demás atacan al que va primero o
a su antagonista. Leerlo es la estrategia: si vas primero, te van a atacar.

**Resultado**: "encuesta flash" de quién ganó. Cada candidato moviliza
`0,12 × (puntos − media)` puntos nacionales (máx. ±1,2). Ganar el debate da +10 de Ánimo.

## 10. Jornada de reflexión (día 21)

No hay mítines ni cartas normales. Puedes jugar **una** carta de reflexión de tu mano (conseguidas durante
la campaña: autobuses para los mayores, concentración "espontánea", bulo por WhatsApp, TikTok "apolítico"...)
o una de las básicas (paella familiar en Instagram, o cumplir la ley y descansar).

Son las cartas más potentes (1-2 puntos) y las más arriesgadas: si salen mal, el efecto se **invierte**
("la gente se indigna con la maniobra electoralista y se queda en casa"). Cada rival tiene un 30 % de
intentar alguna también.

## 11. Noche electoral y final

1. **Margen de error**: a cada partido se le aplica un ajuste nacional aleatorio (normal, σ = 0,8 puntos).
   La encuesta nunca acierta del todo.
2. Escaños con los votos decididos.
3. **Investidura**:
   - Si PP + Vox ≥ 176: gobierno de derechas; preside el que tenga más escaños de los dos.
   - Si no, si PSOE + FA + Otros ≥ 176: gobierno de izquierdas "con apoyos variados (y caros)"; preside el
     mayor de PSOE y FA.
   - Si no (empate 175-175): **bloqueo** y repetición electoral.
4. **Veredicto** para tu partido:

| Partido | 🏆 Triunfo histórico | 🥇 Victoria | 🥈 Ganar perdiendo / digna | 💀 Debacle |
|---------|-------------------|-------------|----------------------------|------------|
| PSOE | ≥ 176 escaños solo | Presidir el Gobierno | Más escaños que al empezar, primera fuerza o gobierno de su bloque | Lo demás |
| PP | ≥ 176 escaños solo | Presidir el Gobierno | Más escaños que al empezar, primera fuerza o gobierno de su bloque | Lo demás |
| Vox | Presidir el Gobierno (sorpasso + mayoría) | Gobierno de derechas o sorpasso al PP | Más escaños que al empezar | Lo demás |
| FA | Presidir el Gobierno (sorpasso + mayoría) | Gobierno de izquierdas o sorpasso al PSOE | Más escaños que al empezar | Lo demás |

"Más escaños que al empezar" hace que el veredicto dependa del escenario: con el CIS, el PP no puede
gobernar, pero sí salvar los muebles.

5. **Portada del lunes 30** con el titular, el hemiciclo, el total de promesas y un texto para compartir
   (al estilo Wordle, con cuadraditos de colores).

## 12. Encuestas prohibidas y la prensa andorrana (día 17)

La ley prohíbe publicar encuestas los 5 días anteriores a la votación. El día 17 sale una carta fija:

- **Suscribirte a *El Periòdic d'Andorra*** (−5 de Caja): la portada sigue mostrando los datos, pero
  disfrazados de "mercado de frutas" (el PSOE es el tomate, el PP el arándano...).
- **Fiarte de tu instinto** (+5 de Ánimo): hasta el final, el mapa y los escaños se muestran con niebla
  (solo quién va primero, sin números).

## 13. Pantallas (móvil)

1. **Inicio**: título, "Nueva partida", "Continuar", "Cómo se juega".
2. **Elegir partido** (4 tarjetas con color y candidato) y **escenario** (CIS / independientes, con números).
3. **Portada**: cabecera de periódico (nombre rotatorio: *El Pregonero*, *Diario Equidistante*,
   *La Gaceta del Cuñado*, *El Bulo Matutino*...), titular, mapa, hemiciclo, encuesta, breves.
4. **Cartas**: carta grande, deslizable; dos botones debajo. Tras elegir, la carta muestra el resultado y
   los efectos ("PP +0,4 · 💶 −10").
5. **Agenda**: mapa + lista de comunidades (para las pequeñas). Al tocar una, ficha con escaños, tu voto,
   quién gana allí, indecisos, termómetro ideológico, hastío/olvido y un **potencial** en estrellas.
   Botones "Mitin del candidato aquí" / "Mitin del nº2 aquí". Luego "Cerrar el día".
6. **Debate**: cuatro atriles, bloque actual, tu mano, comentarios del moderador, encuesta flash.
7. **Reflexión**: lista de opciones con su riesgo.
8. **Noche electoral**: recuento animado, hemiciclo, investidura, veredicto, portada del lunes, compartir.

Barra superior fija: día y fecha, partido, 💶 🔥 🕵️ y botón de la mano (🃏).
La partida se guarda en `localStorage` (`mini-games:elecciones:partida`) al acabar cada fase.

## 14. Arquitectura

```
elecciones/
  index.html
  style.css
  data/partidos.js     Partidos, candidatos, colores, IA, escenarios
  data/regiones.js     Comunidades: escaños, censo, voto 2023, gobierno autonómico
  data/mapa.js         Paths SVG (generado con dev/tools/build_map.py)
  data/cartas.js       Cartas de evento, sucesos, cartas de debate y de reflexión
  motor.js             Lógica pura (sin DOM): estado, mítines, efectos, IA, escaños, debate, final
  ui.js                Pantallas y eventos
dev/tools/simular.js   Simula cientos de partidas IA contra IA para equilibrar números
```

Scripts clásicos sin build, como el resto del repositorio. `motor.js` no toca el DOM y usa un generador
aleatorio con semilla guardada en el estado, así el simulador de Node puede cargarlo tal cual.

## 15. Equilibrio (resultados del simulador)

`node dev/tools/simular.js -n 40 --jugador <política> [--cartas oraculo]`, 40 partidas por partido y escenario.
Δ = escaños finales del jugador menos los del inicio.

| Jugador | PSOE | PP | Vox | FA |
|---------|-----:|---:|----:|---:|
| Mítines al azar, cartas al azar | −4 a −7 | −6 a −9 | −2 | +1 a +3 |
| Mítines como la IA, cartas al azar | +4 | −1 a +2 | +5 a +6 | +4 a +5 |
| Mítines "listos", cartas con oráculo | +16 | +12 | +16 a +19 | +12 |

- Jugar bien frente a jugar mal: unos **20-25 escaños**. Los mítines bien elegidos valen ~10 y las cartas ~10.
- Escenario independiente: PP+Vox empieza con ~180. Un PSOE que juega bien gobierna en ~85 % de partidas;
  uno que juega al azar, nunca. El PP gobierna en el 55 % jugando al azar y siempre jugando bien.
- Escenario CIS: la derecha empieza con ~140 y no llega a 176 ni jugando con oráculo. Es el modo difícil
  (o imposible) para PP y Vox; su objetivo realista es la medalla de plata.
- Nadie llega al escándalo eligiendo al azar; hace falta jugar sucio a menudo (5-8 opciones turbias).
- Sin el jugador, los partidos de la IA se mantienen cerca de la encuesta inicial (±4 escaños), salvo
  "Otros", que pierde ~5 porque no hace campaña.

## 16. Ideas para más adelante

Propuestas que encajan con la regla de oro (de más a menos prometedoras):

- **Voto por correo**: hasta el día 17 parte de tus votos se "bloquean" (ya no los mueven escándalos).
  Inspirado en la campaña real "No votes por correo".
- **Legislatura modo *Reigns***: tras ganar, gobernar a base de cartas hasta que caiga el gobierno.
- **Las encuestas mienten**: modo en el que el escenario elegido es lo que crees, pero la realidad es otra.
- **Logros**: "Ganar sin pisar Cataluña", "Sospecha 99 sin escándalo", "Cerrar campaña en Melilla".
- **Verificadores**: los bulos tienen probabilidad de ser desmentidos al día siguiente.
- **Debate a dos** (cara a cara) como minijuego de una ronda, en vez de carta.
- **Partida diaria** con la misma semilla para todos y clasificación por escaños.
- **Otros con vida propia**: Junts decide la investidura con una carta absurda.
- **Senado**: no.
