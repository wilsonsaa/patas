import type { FastifyBaseLogger } from 'fastify';
import { config } from './config.js';
import { q } from './db.js';
import { hashPassword } from './auth.js';

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

/** Crea el administrador inicial y, si SEED_DEMO=true, datos de demostración (solo en una base vacía). */
export async function sembrar(log: FastifyBaseLogger): Promise<void> {
  const [{ n: admins }] = await q("SELECT count(*)::int AS n FROM usuarios WHERE rol='admin'");
  if (!admins) {
    if (config.adminCorreo && config.adminPassword.length >= 10) {
      await q("INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES ('Dirección de Protección Animal', $1, $2, 'admin')",
        [config.adminCorreo.toLowerCase(), await hashPassword(config.adminPassword)]);
      log.info(`Administrador inicial creado: ${config.adminCorreo}`);
    } else {
      log.warn('No hay administrador. Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 10 caracteres) y reinicia.');
    }
  }

  const [{ n: lugares }] = await q('SELECT count(*)::int AS n FROM lugares');
  if (!config.seedDemo || lugares) return;

  const [ref] = await q(
    `INSERT INTO lugares (tipo, codigo, nombre, responsable, telefono, correo, sector, direccion, descripcion, capacidad, horario, lat, lng, estado)
     VALUES ('refugio','REF-0001','Refugio Animal Municipal de Mosquera','Dirección de Protección Animal','+57 601 000 0000',
       'proteccionanimal@ejemplo.gov.co','Las Brisas','Sector Las Brisas, Vía Cuatro Caminos, Mosquera',
       'Centro oficial de rescate, atención veterinaria y adopción. (Datos de demostración: reemplazar por los oficiales.)',
       60,'Lunes a Viernes 8:00 a. m. - 5:00 p. m. | Sábados 9:00 a. m. - 1:00 p. m.',4.7084,-74.2302,'verificado') RETURNING id`);
  const hogares: string[] = [];
  for (const [nombre, descripcion, capacidad] of [
    ['Hogar demostración A', 'Hogar voluntario especializado en perritas lactantes y cachorros.', 10],
    ['Hogar demostración B', 'Espacio adaptado para rescate, cuarentena y adopción de gatitos.', 12],
    ['Hogar demostración C', 'Espacio campestre para perros adultos y grandes en rehabilitación.', 25],
  ] as const) {
    const [h] = await q(
      `INSERT INTO lugares (tipo, codigo, nombre, descripcion, capacidad, estado)
       VALUES ('hogar_paso', 'HP-' || lpad(nextval('seq_hogar_codigo')::text, 4, '0'), $1, $2, $3, 'verificado') RETURNING id`,
      [nombre, descripcion, capacidad]);
    hogares.push(h.id);
  }

  const mascotas: any[] = [
    ['Canela', 'perro', 'Criolla mestiza', 'Joven', '1 año y 4 meses', 'Hembra', 'Mediano', ['/fotos/perro-labrador.webp'], 'Disponible',
      'Canela es sumamente cariñosa, juguetona y muy noble. Fue rescatada en Mosquera junto a sus hermanitos. Ya convive perfectamente con niños y otros perritos.',
      ['Cariñosa', 'Sociable', 'Juguetona', 'Aprende rápido'], [true, true, true, true], 'Esquema de vacunación séxtuple al día, control antiparasitario mensual.', ref.id],
    ['Simba', 'gato', 'Mestizo atigrado naranja', 'Cachorro', '7 meses', 'Macho', 'Pequeño', ['/fotos/gato-naranja.webp'], 'Disponible',
      'Simba es un gato ronroneador por excelencia. Le encanta dormir en las piernas de sus cuidadores. Ideal para apartamento con mallas de seguridad.',
      ['Tranquilo', 'Ronroneador', 'Curioso', 'Dormilón'], [true, true, true, false], 'Negativo a VIF y ViLeF (Leucemia e Inmunodeficiencia Felina).', hogares[1]],
    ['Rocky', 'perro', 'Mestizo Pastor', 'Adulto', '3 años', 'Macho', 'Grande', ['/fotos/perro-calle.webp'], 'Disponible',
      'Rocky es un perro leal, inteligente y protector. Ama los paseos por el parque y responde a comandos básicos.',
      ['Leal', 'Activo', 'Obediente', 'Protector'], [true, true, true, true], 'Excelente condición física, peso óptimo (24 kg).', hogares[0]],
    ['Luna', 'gato', 'Mestiza atigrada', 'Joven', '1 año', 'Hembra', 'Pequeño', ['/fotos/gato-atigrado.webp'], 'Disponible',
      'Ojos claros, curiosa y muy dulce. Resguardada por voluntarios. Busca una familia amorosa y comprometida.',
      ['Cariñosa', 'Vocal', 'Dulce', 'Independiente'], [true, true, true, true], 'Tratada de una dermatitis leve, ya 100% recuperada.', hogares[1]],
    ['Toby', 'perro', 'Criollo', 'Cachorro', '5 meses', 'Macho', 'Pequeño', ['/fotos/perro-cachorro.webp'], 'Disponible',
      'Pura ternura y alegría. Rescatado en el centro de Mosquera. Toby adora correr tras pelotas de tenis y convive alegremente con niños.',
      ['Alegre', 'Juguetón', 'Sociable', 'Tierno'], [true, false, true, false], 'Compromiso de esterilización gratuita a los 6 meses en el refugio municipal.', ref.id],
    ['Bruno', 'perro', 'Criollo de pelo duro', 'Senior', '7 años', 'Macho', 'Grande', ['/fotos/perro-panoleta.webp'], 'Disponible',
      'Un caballero sabio, paciente y tranquilo. Ideal para una familia que busque un compañero sereno.',
      ['Tranquilo', 'Noble', 'Paciente', 'Cariñoso'], [true, true, true, true], 'Chequeo geriátrico perfecto, articulaciones sanas.', hogares[2]],
  ];
  for (const m of mascotas) {
    await q(
      `INSERT INTO mascotas (nombre, especie, raza, edad_categoria, edad_texto, genero, tamano, fotos, estado, descripcion, temperamento,
         vacunado, esterilizado, desparasitado, microchip, detalles_medicos, lugar_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [m[0], m[1], m[2], m[3], m[4], m[5], m[6], JSON.stringify(m[7]), m[8], m[9], JSON.stringify(m[10]), ...m[11], m[12], m[13]]);
  }
  // Lugares de hallazgo de ejemplo (alrededor de Mosquera)
  for (const [nombre, lat, lng, ref] of [
    ['Rocky', 4.7065, -74.2289, 'Parque principal, Centro'], ['Simba', 4.7118, -74.2361, 'Barrio Porvenir Río'],
    ['Toby', 4.7041, -74.2232, 'Sector El Trébol'], ['Bruno', 4.6992, -74.2428, 'Vereda San José, vía Serrezuela'],
  ] as const) {
    await q("UPDATE mascotas SET hallazgo_lat=$1, hallazgo_lng=$2, hallazgo_referencia=$3, hallazgo_fecha = current_date - 30 WHERE nombre=$4", [lat, lng, ref, nombre]);
  }
  for (const a of [
    ['Max', '1561037404-61cd46aa615b', 'Familia Ramírez', 'Refugio Animal Municipal de Mosquera', 'Max llegó a llenar nuestra casa de alegría. Ahora no podemos imaginar un fin de semana sin ir al parque con él.', 'Excelente'],
    ['Mía', '1574158622682-e40e69881006', 'Valeria', 'Hogar de Paso HP-0002', 'Mía era muy tímida al inicio, pero con paciencia y su rascador nuevo es la reina del apartamento.', 'Excelente'],
    ['Zeus', '1534361960057-19889db98a1e', 'Andrés', 'Hogar de Paso HP-0003', 'Adoptar a un perrito adulto fue la mejor decisión. Ya venía educado y es el guardián más amoroso.', 'Visita completada'],
  ]) {
    await q('INSERT INTO adopciones (mascota_nombre, mascota_foto, adoptante_nombre, lugar_nombre, testimonio, seguimiento) VALUES ($1,$2,$3,$4,$5,$6)',
      [a[0], U(a[1]), a[2], a[3], a[4], a[5]]);
  }
  log.info('Datos de demostración cargados.');
}
