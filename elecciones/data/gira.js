// La gira: caravana, tipos de acto, órdenes del nº2, sucesos del mapa y cartas tácticas.
// Reglas y números en dev/campana/DISENO.md §5.
window.DATOS = window.DATOS || {};

// Comunidades vecinas: moverse entre ellas es gratis (carretera o ferri). El resto, en avión.
window.DATOS.VECINAS = {
  gal: ['ast', 'cyl'],
  ast: ['gal', 'cnt', 'cyl'],
  cnt: ['ast', 'pvs', 'cyl'],
  pvs: ['cnt', 'nav', 'rio', 'cyl'],
  nav: ['pvs', 'rio', 'ara'],
  rio: ['pvs', 'nav', 'ara', 'cyl'],
  ara: ['nav', 'rio', 'cyl', 'clm', 'cat', 'val'],
  cat: ['ara', 'val', 'bal'],
  cyl: ['gal', 'ast', 'cnt', 'pvs', 'rio', 'ara', 'mad', 'clm', 'ext'],
  mad: ['cyl', 'clm'],
  clm: ['mad', 'cyl', 'ara', 'val', 'mur', 'and', 'ext'],
  ext: ['cyl', 'clm', 'and'],
  val: ['cat', 'ara', 'clm', 'mur', 'bal'],
  mur: ['val', 'clm', 'and'],
  and: ['ext', 'clm', 'mur', 'ceu', 'mel'],
  bal: ['val', 'cat'],
  ceu: ['and'],
  mel: ['and'],
  can: [],
};

// Qué puede hacer el candidato en la comunidad donde está.
window.DATOS.ACTOS = {
  mitin: { icono: '🎤', nombre: 'Mitin', corto: 'Mitin',
    txt: 'Convence a indecisos. Le afectan el hastío y los rivales que coincidan.' },
  puerta: { icono: '🚪', nombre: 'Puerta a puerta', corto: 'Puerta a puerta',
    txt: 'Roba votos a tus vecinos ideológicos. Rinde menos, pero no depende de indecisos ni de la tele.' },
  cena: { icono: '🍽️', nombre: 'Cena de recaudación', corto: 'Cena',
    txt: 'Llena la caja (más donde eres fuerte). Casi no da votos.' },
  masas: { icono: '🫂', nombre: 'Baño de masas', corto: 'Baño de masas',
    txt: 'Sube el ánimo de las bases (más donde eres fuerte). Pocos votos.' },
};
window.DATOS.ORDEN_ACTOS = ['mitin', 'puerta', 'cena', 'masas'];

// Orden permanente del nº2: se cumple sola cada día hasta que la cambies.
window.DATOS.ORDENES = {
  atacar: { icono: '⚔️', nombre: 'Al ataque', txt: 'Mitin donde más votos pueda rascar hoy.' },
  defender: { icono: '🛡️', nombre: 'Cuidar feudos', txt: 'Mitin donde tus votantes se están enfriando.' },
  recaudar: { icono: '💶', nombre: 'Pasar la gorra', txt: 'Sin mitin: +3 de caja al día.' },
};

// Sucesos del mapa: cada día aparecen dos. Solo te afectan a ti si tu candidato va (salvo «siempre»).
// mult: multiplicador por acto · cajaX: multiplica la caja de la cena · sinRuido: los rivales no te tapan
// riesgo: {acto, p, mult, mal} · voy: efectos si vas · siempre: efectos pase lo que pase · soloAvion
window.DATOS.FOCOS = {
  feria: { icono: '🎪', nombre: 'Fiestas patronales', peso: 3,
    txt: 'La plaza ya está llena: mitin ×1,6 y baño de masas ×1,5.', mult: { mitin: 1.6, masas: 1.5 },
    cronica: 'Tu candidato da el mitin entre la tómbola y los coches de choque. Gana un jamón en la rifa.' },
  mercado: { icono: '🧺', nombre: 'Día de mercado', peso: 3,
    txt: 'Todo el mundo en la calle: puerta a puerta ×1,7.', mult: { puerta: 1.7 },
    cronica: 'Tu candidato compra tres kilos de tomates que no necesita y estrecha 400 manos.' },
  tele: { icono: '📡', nombre: 'Especial de la tele autonómica', peso: 2,
    txt: 'Cualquier acto rinde ×1,4 y los rivales no te tapan.', mult: { mitin: 1.4, puerta: 1.4, cena: 1.4, masas: 1.4 }, sinRuido: true,
    cronica: 'La tele autonómica te dedica 40 minutos. El presentador te tutea desde 1996.' },
  fabrica: { icono: '🏭', nombre: 'Cierra una fábrica', peso: 2,
    txt: 'Puerta a puerta ×2. Una cena de recaudación aquí sienta fatal (−0,5).', mult: { puerta: 2, mitin: 1.2 }, castigo: { cena: -0.5 },
    cronica: 'Tu candidato escucha a la plantilla en la puerta de la fábrica. Promete «estar a su lado». De lado, sobre todo.' },
  derbi: { icono: '⚽', nombre: 'Derbi de fútbol', peso: 2,
    txt: 'Nadie va al mitin (×0,4). En el palco la cena recauda el doble.', mult: { mitin: 0.4, masas: 0.5, puerta: 0.6 }, cajaX: 2,
    cronica: 'Hay derbi. Tu candidato dice ser «de los dos equipos de toda la vida». Le pitan las dos aficiones.' },
  tractores: { icono: '🚜', nombre: 'Tractorada', peso: 2,
    txt: 'Mitin arriesgado: 60 % de ×1,9; si no, abucheo y −0,6 aquí.', riesgo: { acto: 'mitin', p: 0.6, mult: 1.9, mal: -0.6 },
    cronica: 'Tu candidato se sube a un tractor para la foto.', cronicaMal: 'Tu candidato se sube a un tractor para la foto. No sabe bajarse. Lo retransmiten en directo.' },
  trenes: { icono: '🚆', nombre: 'Trenes parados por una avería en las vías', peso: 2,
    txt: 'Solo se llega en avión. La avería desgasta al Gobierno aquí (−0,5); quien dé la cara en persona, +0,6.',
    soloAvion: true, siempre: [{ mov: 'gob', n: -0.5, ca: 'ca' }], voy: [{ mov: 'yo', n: 0.6, ca: 'ca' }],
    cronica: 'Tu candidato reparte bocadillos en el andén a los viajeros atrapados. Uno le pide también el wifi.' },
  temporal: { icono: '⛈️', nombre: 'Temporal de lluvia y viento', peso: 2,
    txt: 'Mitin y puerta a puerta a la mitad. Un baño de masas bajo el aguacero vale doble.', mult: { mitin: 0.5, puerta: 0.5, masas: 2 },
    cronica: 'Tu candidato abraza militantes bajo el diluvio. La foto es épica. La neumonía, también.' },
  congreso: { icono: '🏛️', nombre: 'Congreso regional de tu partido', peso: 2,
    txt: 'Los tuyos, reunidos: baño de masas ×2 y la cena recauda ×1,5.', mult: { masas: 2 }, cajaX: 1.5,
    cronica: 'Ovación de siete minutos en el congreso regional. Cronometrada por el aparato, como siempre.' },
  universidad: { icono: '🎓', nombre: 'Semana de la universidad', peso: 1,
    txt: 'Mitin ×1,5 si las bases están animadas (ánimo ≥ 60); si no, ×0,7.', multAnimo: { acto: 'mitin', min: 60, si: 1.5, no: 0.7 },
    cronica: 'Tu candidato dice «en plan» y «literal» en el campus. Los estudiantes aprecian el esfuerzo. Poco.' },
};

// Cartas tácticas (mano): se juegan en la agenda, una por día, sobre el acto del candidato.
// mult: por acto · duelo: multiplica tu fuerza en un duelo · sinHastio · sinRuido · vueloGratis
// plano: puntos extra en la comunidad · caja / animo / sospecha: medidores · espia: enseña la agenda de todos
window.DATOS.TACTICAS = {
  t_autobuses: { icono: '🚌', nombre: 'Autobuses de militantes', txt: 'Mitin ×1,5. Vienen de tres provincias y con bocadillo.', mult: { mitin: 1.5 } },
  t_telonero: { icono: '🎸', nombre: 'Telonero famoso', txt: 'Mitin ×1,3 y ganas casi cualquier duelo por la tele.', mult: { mitin: 1.3 }, duelo: 2.5 },
  t_lona: { icono: '🖼️', nombre: 'Lona gigante local', txt: '+0,5 en la comunidad, hagas lo que hagas.', plano: 0.5 },
  t_jet: { icono: '🛩️', nombre: 'El jet de un amigo', txt: 'Vuelo gratis hoy. Sospecha +6.', vueloGratis: true, sospecha: 6 },
  t_contra: { icono: '📺', nombre: 'Contraprogramación', txt: 'Los rivales no te tapan hoy y ganas los duelos.', sinRuido: true, duelo: 4 },
  t_baron: { icono: '🤝', nombre: 'El barón te presenta', txt: 'Hoy no hay hastío: aunque repitas, rinde como la primera vez.', sinHastio: true },
  t_drones: { icono: '✨', nombre: 'Espectáculo de drones', txt: 'Mitin o baño de masas ×1,3 y ánimo +5.', mult: { mitin: 1.3, masas: 1.3 }, animo: 5 },
  t_paella: { icono: '🥘', nombre: 'Paella popular gigante', txt: 'Puerta a puerta ×1,7. Para 2.000 personas; vienen 600.', mult: { puerta: 1.7 } },
  t_espia: { icono: '🕵️', nombre: 'Un topo en las otras sedes', txt: 'Se usa al momento: ves dónde van hoy TODOS los rivales.', espia: true },
  t_mecenas: { icono: '💼', nombre: 'Mesa de mecenas', txt: 'La cena de hoy recauda el doble. Sospecha +4.', cajaX: 2, sospecha: 4 },
  t_megafono: { icono: '📢', nombre: 'Coche con megafonía', txt: '+0,3 en la comunidad y puerta a puerta ×1,3.', plano: 0.3, mult: { puerta: 1.3 } },
  t_plato: { icono: '🎬', nombre: 'Conexión en directo', txt: 'Mitin ×1,4: tu acto abre el telediario nacional.', mult: { mitin: 1.4 }, sinRuido: true },
};
window.DATOS.TACTICAS_INICIO = ['t_autobuses', 't_baron', 't_paella', 't_megafono', 't_drones', 't_lona'];
