import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q } from '../db.js';
import { ErrorHttp, auditar, exigir } from '../auth.js';
import { correo, telefono, texto, uuid, validar } from '../validar.js';

// Refugios institucionales: los crea y edita la administración. Su dirección y ubicación SÍ son públicas.
const cuerpoRefugio = z.object({
  nombre: texto(120, 3), responsable: texto(120).default(''), telefono: z.union([z.literal(''), telefono]).default(''),
  correo: z.union([z.literal(''), correo]).default(''), sector: texto(120).default(''), direccion: texto(200, 5),
  descripcion: texto(1000).default(''), capacidad: z.number().int().min(1).max(500), horario: texto(160).default(''),
  lat: z.number().min(4.3).max(5.1).nullable().default(null), lng: z.number().min(-74.6).max(-73.8).nullable().default(null),
  estado: z.enum(['verificado', 'suspendido']).default('verificado'),
}).refine((d) => (d.lat === null) === (d.lng === null), 'Marca la ubicación completa en el mapa o déjala vacía');

export default async function rutasRefugios(app: FastifyInstance) {
  app.get('/api/admin/refugios', async (req) => {
    await exigir(req, 'admin');
    return q(`SELECT l.*, (SELECT count(*)::int FROM mascotas m WHERE m.lugar_id = l.id AND m.estado <> 'Adoptado') AS ocupacion
      FROM lugares l WHERE l.tipo = 'refugio' ORDER BY l.codigo`);
  });

  app.post('/api/admin/refugios', async (req, reply) => {
    const u = await exigir(req, 'admin');
    const d = validar(cuerpoRefugio, req.body);
    const [r] = await q(`INSERT INTO lugares (tipo, codigo, nombre, responsable, telefono, correo, sector, direccion, descripcion, capacidad, horario, lat, lng, estado, usuario_id)
      VALUES ('refugio', 'REF-' || lpad(nextval('seq_refugio_codigo')::text, 4, '0'), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, codigo`,
      [d.nombre, d.responsable, d.telefono, d.correo, d.sector, d.direccion, d.descripcion, d.capacidad, d.horario, d.lat, d.lng, d.estado, u.id]);
    await auditar(req, u.id, 'refugio_creado', 'lugares', r.id);
    return reply.code(201).send(r);
  });

  app.put('/api/admin/refugios/:id', async (req) => {
    const u = await exigir(req, 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(cuerpoRefugio, req.body);
    const r = await q(`UPDATE lugares SET nombre=$1, responsable=$2, telefono=$3, correo=$4, sector=$5, direccion=$6, descripcion=$7,
      capacidad=$8, horario=$9, lat=$10, lng=$11, estado=$12 WHERE id=$13 AND tipo='refugio' RETURNING id`,
      [d.nombre, d.responsable, d.telefono, d.correo, d.sector, d.direccion, d.descripcion, d.capacidad, d.horario, d.lat, d.lng, d.estado, id]);
    if (!r.length) throw new ErrorHttp(404, 'Refugio no encontrado.');
    await auditar(req, u.id, 'refugio_actualizado', 'lugares', id);
    return { ok: true };
  });
}
