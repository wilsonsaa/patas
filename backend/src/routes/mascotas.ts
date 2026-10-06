import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q } from '../db.js';
import { ErrorHttp, auditar, exigir, usuarioDe } from '../auth.js';
import { foto, telefono, texto, uuid, validar } from '../validar.js';
import { captcha } from '../recaptcha.js';

const MUNICIPIO = 'Mosquera, Cundinamarca';
export const nombrePublico = (l: { tipo: string; codigo: string; nombre: string }) =>
  l.tipo === 'hogar_paso' ? `Hogar de Paso ${l.codigo}` : l.nombre;

const SQL_MASCOTA = `
  SELECT m.*, l.tipo AS l_tipo, l.codigo AS l_codigo, l.nombre AS l_nombre, l.telefono AS l_telefono
  FROM mascotas m JOIN lugares l ON l.id = m.lugar_id`;

function aMascota(m: any) {
  const esHogar = m.l_tipo === 'hogar_paso';
  return {
    id: m.id, nombre: m.nombre, especie: m.especie, raza: m.raza,
    edadCategoria: m.edad_categoria, edadTexto: m.edad_texto, genero: m.genero, tamano: m.tamano,
    fotos: m.fotos, estado: m.estado, descripcion: m.descripcion, temperamento: m.temperamento,
    salud: { vacunado: m.vacunado, esterilizado: m.esterilizado, desparasitado: m.desparasitado,
      microchip: m.microchip, detallesMedicos: m.detalles_medicos },
    hogarOrefugioId: m.lugar_id,
    hogarOrefugioNombre: nombrePublico({ tipo: m.l_tipo, codigo: m.l_codigo, nombre: m.l_nombre }),
    esHogarPaso: esHogar, municipio: MUNICIPIO,
    fechaPublicacion: new Date(m.creado_en).toISOString().slice(0, 10),
    // el teléfono de un hogar de paso nunca se publica: el contacto pasa por la plataforma
    contactoWhatsapp: esHogar ? undefined : String(m.l_telefono).replace(/\D/g, '').slice(0, 12) || undefined,
  };
}

/** Vista pública de un lugar. Para hogares de paso solo sale el código, cupos y descripción. */
function aLugarPublico(l: any) {
  const base = {
    id: l.id, codigo: l.codigo, tipo: l.tipo, nombre: nombrePublico(l), municipio: MUNICIPIO,
    descripcion: l.descripcion, capacidad: l.capacidad, mascotasActuales: Number(l.ocupacion),
    verificado: l.estado === 'verificado',
  };
  if (l.tipo === 'hogar_paso') return base;
  return { ...base, responsable: l.responsable, telefono: l.telefono, correo: l.correo,
    direccion: l.direccion, horario: l.horario, lat: l.lat, lng: l.lng };
}

const cuerpoMascota = z.object({
  nombre: texto(60, 1), especie: z.enum(['perro', 'gato', 'otro']), raza: texto(80).default(''),
  edadCategoria: z.enum(['Cachorro', 'Joven', 'Adulto', 'Senior']), edadTexto: texto(40).default(''),
  genero: z.enum(['Macho', 'Hembra']), tamano: z.enum(['Pequeño', 'Mediano', 'Grande']),
  fotos: z.array(foto).min(1, 'Agrega al menos una foto').max(6),
  descripcion: texto(2000, 10), temperamento: z.array(texto(40, 1)).max(10).default([]),
  salud: z.object({ vacunado: z.boolean(), esterilizado: z.boolean(), desparasitado: z.boolean(),
    microchip: z.boolean(), detallesMedicos: texto(500).default('') }),
  hogarOrefugioId: uuid.optional(),
});

export default async function rutasMascotas(app: FastifyInstance) {
  app.get('/api/mascotas', async () => (await q(`${SQL_MASCOTA} WHERE l.estado = 'verificado' ORDER BY m.creado_en DESC LIMIT 500`)).map(aMascota));

  app.get('/api/lugares', async () => (await q(
    `SELECT l.*, (SELECT count(*) FROM mascotas m WHERE m.lugar_id = l.id AND m.estado <> 'Adoptado') AS ocupacion
     FROM lugares l WHERE l.estado = 'verificado' ORDER BY l.tipo DESC, l.codigo`)).map(aLugarPublico));

  app.get('/api/adopciones', async () => (await q('SELECT * FROM adopciones ORDER BY fecha DESC LIMIT 100')).map((a) => ({
    id: a.id, mascotaNombre: a.mascota_nombre, mascotaFoto: a.mascota_foto,
    adoptanteNombre: String(a.adoptante_nombre).trim().split(/\s+/)[0], // solo el primer nombre
    municipio: MUNICIPIO, fechaAdopcion: a.fecha, refugioOHogar: a.lugar_nombre,
    testimonio: a.testimonio, estadoSeguimiento: a.seguimiento,
  })));

  app.post('/api/mascotas', async (req, reply) => {
    const u = await exigir(req, 'hogar_paso', 'refugio_admin', 'admin');
    const d = validar(cuerpoMascota, req.body);
    // un hogar de paso solo publica en su propio hogar; el gestor elige el lugar
    const lugarId = u.rol === 'hogar_paso' ? u.lugar_id : (d.hogarOrefugioId ?? u.lugar_id);
    const [lugar] = await q("SELECT id, capacidad FROM lugares WHERE id = $1 AND estado = 'verificado'", [lugarId]);
    if (!lugar) throw new ErrorHttp(400, 'El hogar o refugio no existe o aún no ha sido verificado.');
    const [{ n }] = await q("SELECT count(*)::int AS n FROM mascotas WHERE lugar_id=$1 AND estado <> 'Adoptado'", [lugar.id]);
    if (n >= lugar.capacidad) throw new ErrorHttp(409, 'Este lugar ya alcanzó su capacidad máxima de resguardo.');
    const [m] = await q(
      `INSERT INTO mascotas (nombre, especie, raza, edad_categoria, edad_texto, genero, tamano, fotos, descripcion, temperamento,
         vacunado, esterilizado, desparasitado, microchip, detalles_medicos, lugar_id, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
      [d.nombre, d.especie, d.raza, d.edadCategoria, d.edadTexto, d.genero, d.tamano, JSON.stringify(d.fotos), d.descripcion,
        JSON.stringify(d.temperamento), d.salud.vacunado, d.salud.esterilizado, d.salud.desparasitado, d.salud.microchip,
        d.salud.detallesMedicos, lugar.id, u.id]);
    await auditar(req, u.id, 'mascota_creada', 'mascotas', m.id);
    const [fila] = await q(`${SQL_MASCOTA} WHERE m.id = $1`, [m.id]);
    return reply.code(201).send(aMascota(fila));
  });

  async function mascotaGestionable(req: any) {
    const u = await exigir(req, 'hogar_paso', 'refugio_admin', 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const [m] = await q('SELECT id, lugar_id FROM mascotas WHERE id=$1', [id]);
    if (!m) throw new ErrorHttp(404, 'Mascota no encontrada.');
    if (u.rol === 'hogar_paso' && m.lugar_id !== u.lugar_id) throw new ErrorHttp(403, 'Esta mascota pertenece a otro hogar.');
    return { u, id };
  }

  app.patch('/api/mascotas/:id/estado', async (req) => {
    const { u, id } = await mascotaGestionable(req);
    const d = validar(z.object({ estado: z.enum(['Disponible', 'En proceso', 'Adoptado']) }), req.body);
    await q('UPDATE mascotas SET estado=$1 WHERE id=$2', [d.estado, id]);
    await auditar(req, u.id, `mascota_estado:${d.estado}`, 'mascotas', id);
    return { ok: true };
  });

  app.delete('/api/mascotas/:id', async (req) => {
    const { u, id } = await mascotaGestionable(req);
    await q('DELETE FROM mascotas WHERE id=$1', [id]);
    await auditar(req, u.id, 'mascota_eliminada', 'mascotas', id);
    return { ok: true };
  });

  // ---------- Hogares de paso ----------
  app.post('/api/hogares', { preHandler: captcha('hogar') }, async (req, reply) => {
    const u = await exigir(req);
    if (u.lugar_id) throw new ErrorHttp(409, 'Tu cuenta ya tiene un hogar o refugio asociado.');
    const pend = await q("SELECT 1 FROM lugares WHERE usuario_id=$1 AND estado='pendiente'", [u.id]);
    if (pend.length) throw new ErrorHttp(409, 'Ya tienes una inscripción de hogar de paso en revisión.');
    const d = validar(z.object({
      nombre: texto(120, 3), responsable: texto(120, 3), telefono, sector: texto(120, 2),
      direccion: texto(200, 5), descripcion: texto(1000).default(''),
      capacidad: z.number().int().min(1).max(50), horario: texto(160).default(''),
      aceptaVisita: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la visita de verificación' }) }),
    }), req.body);
    const [l] = await q(
      `INSERT INTO lugares (tipo, codigo, nombre, responsable, telefono, correo, sector, direccion, descripcion, capacidad, horario, usuario_id)
       VALUES ('hogar_paso', 'HP-' || lpad(nextval('seq_hogar_codigo')::text, 4, '0'), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, codigo, estado`,
      [d.nombre, d.responsable, d.telefono, u.correo, d.sector, d.direccion, d.descripcion, d.capacidad, d.horario, u.id]);
    await auditar(req, u.id, 'hogar_inscrito', 'lugares', l.id);
    return reply.code(201).send(l);
  });

  app.get('/api/hogares/mio', async (req) => {
    const u = await usuarioDe(req);
    if (!u) return null;
    const [l] = await q('SELECT id, codigo, estado, capacidad FROM lugares WHERE usuario_id=$1 ORDER BY creado_en DESC LIMIT 1', [u.id]);
    return l ?? null;
  });
}
