# Campaña 29-N · Cartas

Cómo están hechas las cartas, cómo escribir nuevas sin romper el equilibrio y qué hay ahora.
Los datos están en `elecciones/data/cartas.js`.

Catálogo completo, siempre actualizado:

```sh
node dev/tools/simular.js --catalogo
```

Hoy: **92 cartas** (7 fijas, 3 encadenadas, 55 generales, 6 de bloque, 21 de partido), **14 sucesos**,
**10 cartas de debate** y **6 de reflexión**.

## Formato

```js
{
  id: 'karaoke',                 // único, en minúsculas
  icono: '🎤',                   // un emoji grande
  quien: 'El Fontanero',         // personaje que la trae (ver "Personajes")
  titulo: 'El vídeo del karaoke',
  texto: 'El Fontanero tiene un vídeo del nº2 de {OBJ}...',
  obj: 'rival',                  // a quién se refiere {OBJ}: 'rival' (por defecto), 'ant' (antagonista), 'gob', o un partido
  ca: 'azar',                    // comunidad de {CA}: 'azar' (pondera escaños), 'gobpp', un id o una lista de ids
  solo: ['pp', 'vox'],           // solo si el jugador es uno de estos
  no: ['psoe'],                  // nunca si el jugador es uno de estos
  dias: [3, 19],                 // solo entre estos días
  dia: 6,                        // carta fija de ese día (siempre sale)
  encadenada: true,              // solo sale si otra carta la pide con {sigue: id}
  peso: 1,                       // probabilidad relativa en el mazo
  a: { txt: 'Filtrarlo ya', azar: 0.75,            // opción izquierda, con riesgo
       si: { ef: [...], res: '...', tit: '...' },  // tit: titular para la portada de mañana
       no: { ef: [...], res: '...' } },
  b: { txt: 'Guardarlo para el debate', ef: [{ mano: 'd_karaoke' }], res: '...' },
}
```

`azar` puede ser un número o una probabilidad por partido: `{ psoe: 0.65, pp: 0.45, ... }` (útil cuando un
plató o un público no trata igual a todos).

### Efectos

| Efecto | Qué hace |
|--------|----------|
| `{ mov: 'yo', n: 0.5 }` | Moviliza (+) o desmoviliza (−) a un partido en todo el país. |
| `{ mov: 'yo', n: 0.8, ca: 'ca' }` | Lo mismo, solo en la comunidad de la carta (o `ca: 'mad'`). |
| `{ tras: ['obj', 'yo'], n: 0.3 }` | Trasvase de votos de un partido a otro. |
| `{ bloque: 'der', n: 0.3 }` | Moviliza a todo un bloque, más donde ese bloque es fuerte. |
| `{ caja: -10 }`, `{ animo: 5 }`, `{ sospecha: 12 }` | Medidores. Un coste de caja bloquea la opción si no llega. |
| `{ promesa: 5000 }` | Suma millones al contador de promesas. |
| `{ mano: 'd_karaoke' }` | Añade una carta de debate (`d_*`) o de reflexión (`r_*`) a la mano. |
| `{ campana: { nombre, dias, ef } }` | Repite `ef` cada noche durante `dias`. |
| `{ prog: { en, ef, titular } }` | Aplica `ef` dentro de `en` días. |
| `{ huelga: { nombre, en, ca, obj, postura, ia } }` | Convoca una huelga (ver DISENO §8). |
| `{ flag: 'andorra' }` | Activa una marca de estado (`andorra`, `concierto`). |
| `{ sigue: 'id' }` | Mete una carta encadenada en el mazo de mañana. |

Quién: `yo`, `obj`, `ant` (antagonista), `gob` (PSOE), `gobca` (gobierno de la comunidad de la carta),
`rivales`, `todos` o un id de partido.

### Marcadores de texto

`{YO}`, `{OBJ}`, `{ANT}` se escriben **con artículo** ("el PSOE", "Vox", "el Frente Amplio"); delante de
"de" y "a" se contraen solos ("del PP", "al PSOE", "de Vox"). `{YON}` y `{OBJN}` dan el nombre pelado
(para vocativos: "¿De verdad, {OBJN}?"). `{CAND}`, `{OBJCAND}`, `{ANTCAND}`: apellido del candidato.
`{CA}`: comunidad. `{GOBCA}`: "el gobierno autonómico del PP". `{OTROSCA}`: los "otros" de esa comunidad.

## Guía de tono

- **Humor negro y mala baba contra los políticos, nunca contra las víctimas.** Se puede reír del candidato
  que llega a la riada con botas nuevas; no de la riada. Lo mismo con migrantes, enfermos o fallecidos.
- **Sin nombres propios en las bromas fuertes.** Los candidatos solo aparecen como `{CAND}`/`{OBJCAND}`
  y en situaciones inventadas e inofensivas (caerse, cocinar, bailar). Los casos judiciales reales se citan
  como los cuenta la prensa, sin inventar hechos ni delitos.
- **Personajes recurrentes** (estilo *Reigns*): El Gurú (jefe de campaña cínico), Vane (becaria de redes),
  El Tesorero (siempre sudando), El Fontanero (juego sucio), Paco (militante desde 1977), la periodista
  incómoda, tu nº2. Les da continuidad a las cartas.
- **Frases cortas**. El texto de la carta, 2-3 líneas en móvil. El resultado, una línea con remate.
- Cada resultado tiene que tener **gracia por sí solo**, porque sale también en la portada de mañana.

## Reglas de equilibrio

1. **Simetría**: cada partido tiene el mismo número de cartas propias (5), con al menos una judicial o de
   escándalo y efectos del mismo tamaño. Si se añade una carta de partido, se añade una a cada uno.
2. **Las cartas de bloque van por parejas**: `milei_der`/`milei_izq`, `trump`/`aranceles`, `meloni`/`lula`.
3. **Tamaños** (puntos para un partido del 25 %; el motor los escala por tamaño):
   pequeño 0,1-0,3 · medio 0,4-0,7 · grande 0,8-1,5 · reflexión 1-2. En una comunidad, el doble.
4. **Ninguna opción es gratis**: la opción "buena" en votos cuesta caja, sospecha, ánimo o tiene riesgo.
   La opción "segura" da poco.
5. **El juego sucio sube la sospecha** (6-25) y suele tener un 25-40 % de salir mal.
6. Las cartas que ayudan a un rival (`mov: 'obj', n > 0`) existen: rechazar algo turbio a veces se lo
   regala a otro.
7. Después de tocar cartas: `node dev/tools/simular.js -n 40` y comparar con la tabla de DISENO §15.

## Sucesos (rivales)

Sin decisión, para los partidos de la IA. Deben sumar cero: la suma de los positivos ≈ la de los negativos.
`{P}` (partido con artículo), `{PC}` (candidato), `{CA}`; `n` nacional y `nca` extra en la comunidad.

## Cartas de mano

- **Debate** (`d_*`): `tipo` ataque/replica/propuesta, `fuerza` 1-3, `tema` eco/cor/esp o `null`.
  Se consiguen guardando cosas en las cartas de evento.
- **Reflexión** (`r_*`): `riesgo` (probabilidad de salir mal), `ef`, `efMal`, `txtBien`, `txtMal` e `ia`
  (tamaño cuando la usa un rival). `r_paella` y `r_descanso` están siempre disponibles (`basica`).

## Ideas de cartas pendientes

- Debate en lenguas cooficiales con pinganillo que falla.
- Cumbre Iberoamericana (4-5 de noviembre, Milei no confirma).
- Fact-checkers: un bulo tuyo desmentido al día siguiente (carta encadenada).
- El voto CERA (españoles en el extranjero) que no llega a tiempo.
- Eurovisión / fútbol: final de Champions la noche del debate.
- Una carta por partido de "buena noticia" de gestión autonómica.
