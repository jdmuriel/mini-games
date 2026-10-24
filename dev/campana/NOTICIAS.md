# Campaña 29-N · Noticias de base

Noticias reales de la precampaña (octubre de 2026) en las que se inspiran las cartas. Al juego llegan
deformadas, exageradas y sin nombres propios cuando la broma es fuerte (ver la guía de tono en `CARTAS.md`).
La columna "Carta" indica el `id` en `elecciones/data/cartas.js`.

Añadir aquí cada noticia nueva antes de convertirla en carta, con fuente y fecha.

## Calendario y contexto

| Fecha | Noticia | Carta / mecánica | Fuente |
|-------|---------|------------------|--------|
| 2-oct | El Congreso tumba los dos decretos de vivienda del Gobierno con los votos de PP, Vox y Junts (172-178). | `psoe_vivienda`, huelga 11-N | [montevideo.com.uy](https://www.montevideo.com.uy/Noticias/Crisis-de-vivienda-en-Espana-PP-Vox-y-Junts-tumbaron-los-decretos-de-Sanchez-uc977300), [rtvc.es](https://rtvc.es/congreso-vota-decretos-vivienda-2-octubre-2026/) |
| 5-oct | Sánchez adelanta las elecciones al 29 de noviembre tras el revés de la vivienda. | Premisa del juego | [France 24](https://www.france24.com/es/europa/20261005-pedro-s%C3%A1nchez-adelanta-las-elecciones-en-espa%C3%B1a-al-29-de-noviembre-tras-el-rev%C3%A9s-parlamentario-por-la-vivienda) |
| 6-oct | BOE: Madrid gana un diputado (38), Cádiz pierde uno (8). Formentera elige senador propio. | Datos de escaños | [Estrella Digital](https://www.estrelladigital.es/articulo/espana/escanos-provincias-elecciones-29-noviembre-congreso-diputados/20261020131814452348.html) |
| 7-oct | CCOO y UGT convocan **huelga general el 11 de noviembre** por la vivienda y los salarios. | `fija_huelga_general` (día 1 → día 4) | [Euronews](https://es.euronews.com/2026/10/07/huelga-general-vivienda-espana-11-noviembre-ccoo-ugt) |
| 7-oct | El PP de Madrid lanza la campaña "No votes por correo" y provoca un choque interno. | `voto_correo` | [Mundiario](https://www.mundiario.com/articulo/politica/pp-ayuso-lanza-polemica-campana-voto-correo-provoca-choque-dentro-partido/20261007133014445370.html) |
| 9-oct | Feijóo activa a Ayuso y Moreno con caravanas propias. | `pp_ayuso` | [Moncloa.com](https://www.moncloa.com/2026/10/09/campana-territorial-pp-ayuso-moreno-3445227/) |
| 11-oct | Spot del PP sobre el "sacrificio" de los españoles; burla del PSOE. | `promesa` (tono) | [Libertad Digital](https://www.libertaddigital.com/espana/2026-10-11/feijoo-presume-de-espana-en-un-video-en-redes-sociales-y-enfada-al-psoe-7473990/) |
| 12/17-oct | Sumar, IU, Más Madrid y Comuns lanzan el **Frente Amplio** con Ada Colau de candidata. Podemos va por libre con Irene Montero. | `fa_podemos`, `fa_asamblea`, `fa_logo` | [Euronews](https://es.euronews.com/2026/10/05/sumar-muta-en-frente-amplio-se-abren-las-quinielas-para-el-sucesor-de-diaz) |
| 13-oct | "Los 9 casos que rodean al PSOE": Ábalos y Koldo condenados, Cerdán, Begoña Gómez, David Sánchez, fiscal general. | `psoe_sumario`, `psoe_familia` | [Artículo 14](https://www.articulo14.es/politica/los-9-casos-de-corrupcion-que-rodean-al-psoe-y-a-sanchez-antes-de-las-elecciones-del-29n-20261013.html) |
| 14-oct | El CIS de Tezanos da al PSOE el 34 % y 12 puntos de ventaja. | Escenario "CIS", `psoe_cis` | [Vozpópuli](https://www.vozpopuli.com/espana/politica/el-cis-de-tezanos-dispara-al-psoe-en-intencion-de-voto-y-le-da-12-puntos-de-ventaja-sobre-el-pp-tras-convocar-elecciones.html) |
| 21-oct | **Milei** en Madrid: llama "impresentable dictador" a Sánchez y pide sacarlo "a patadas". PP y Vox evitan la foto; Sánchez responde orgulloso de ser "zurdo". | `milei_der`, `milei_izq` | [Mundiario](https://www.mundiario.com/articulo/politica/milei-irrumpe-precampana-29-n-llama-impresentable-dictador-sanchez/20261021124214448146.html), [Infobae](https://www.infobae.com/america/agencias/2026/10/21/milei-irrumpe-en-precampana-insultando-a-sanchez-y-no-dice-si-ira-a-cumbre-iberoamericana/) |
| 22-oct | Sánchez en **La Revuelta**: "se han traspasado líneas rojas con mi mujer y mi hermano". | `revuelta`, `psoe_familia` | [Menorca.info](https://menorca.info/actualidad/elecciones-29n/2026/10/22/2734683/sanchez-admite-revuelta-quedo-helado-descubrir-otra-cara-abalos.html) |
| 22-oct | El PSOE acepta un **cara a cara** con Feijóo el 16 de noviembre. | `fija_cara_a_cara` (día 9) | [Infobae](https://www.infobae.com/espana/2026/10/22/elecciones-generales-29-n-en-directo-ultima-hora-de-los-sondeos-propuestas-de-los-partidos-y-actos-de-los-candidatos/) |
| 23-oct | Colau a Montero: "¿Juego de Tronos o Friends?" | `fa_podemos` | [Público](https://www.publico.es/politica/partidos/colau-pide-montero-elija-dos-formas-entender-poder-juego-tronos-friends.html) |
| 23-oct | Feijóo, tras un "lapsus" en la SER, aclara que quiere subir el salario mínimo y el medio. | `pp_salario` | [Infobae/EFE](https://www.infobae.com/espana/agencias/2026/10/23/feijoo-precisa-que-su-objetivo-es-subir-tanto-el-salario-minimo-como-el-medio/) |
| 23-oct | Feijóo: España necesita "un servidor y no un impostor". Promete rebajas fiscales. | `pp_impuestos` | [Infobae](https://www.infobae.com/espana/2026/10/23/elecciones-generales-en-espana-29-n-en-directo-ultima-hora-de-los-sondeos-los-debates-y-las-entrevistas-a-pedro-sanchez-y-feijoo/) |
| oct | Abascal: "remigración", "prioridad nacional", expulsiones "por la vía rápida" en Ceuta. | `vox_remigracion` | [Euronews](https://es.euronews.com/2026/10/22/29n-listas-candidatos-partidos-generales) |
| 2025-26 | Crédito de 6,5 M€ de un banco húngaro (MBH) a Vox; el Tribunal de Cuentas pide explicaciones. Orbán pierde las elecciones en 2026. | `vox_hungria` | [elDiario.es](https://www.eldiario.es/politica/tribunal-cuentas-denuncia-falta-colaboracion-banco-hungaro-mbh-prestamo-6-5-millones-vox_1_12174490.html), [El Constitucional](https://www.elconstitucional.es/es/internacional/abascal-lamenta-derrota-orban-vox-recibio-7-millones-euros-entidad-hungara-vinculada-gobierno-ultra_3468_102.html) |
| 2025-26 | Caso Montoro: el exministro de Hacienda y el despacho que asesoraba a empresas. | `pp_montoro` | (prensa nacional, 2025) |
| 2025 | Gran apagón del 28 de abril. | `apagon` | (prensa nacional, 2025) |
| 2024-25 | DANA de Valencia y la gestión del gobierno autonómico. | `gota_fria` (genérica, sin nombres) | (prensa nacional) |

## Temas de campaña (para cartas futuras)

- **Vivienda**: decretos tumbados, alquileres, desahucios, okupas, "un piso por cada joven".
- **Corrupción**: casos del PSOE, caso Montoro, financiación de Vox. Siempre una carta por partido.
- **Inmigración**: Ceuta, remigración, regularización. Cuidado: el humor va contra los políticos, nunca
  contra los migrantes.
- **Salarios y SMI**, pensiones, reducción de jornada.
- **Política exterior**: Milei, Trump y aranceles, gasto en la OTAN, Orbán.
- **Trenes**: retrasos, Rodalies, accidentes. Humor sobre la espera, nunca sobre víctimas.
- **Unidad de la izquierda**: Frente Amplio contra Podemos.
- **Voto por correo**: colapso de Correos, campaña "No votes por correo".
- **Encuestas**: el CIS de Tezanos, la prensa andorrana y la prohibición de los últimos cinco días.
