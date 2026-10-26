import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, tx } from '../db.js';
import { ErrorHttp, auditar, exigir, type Usuario } from '../auth.js';
import { fechaOpc, texto, uuid, validar } from '../validar.js';

const ESTADOS = ['En adaptación', 'Visita completada', 'Excelente', 'Requiere atención', 'Sin contacto', 'Cerrado'] as const;

/** Un hogar de paso solo hace seguimiento a las adopciones de los animales que tuvo a cargo. */
async function adopcionVisible(u: Usuario, id: string) {
  const [a] = await q('SELECT id, lugar_id FROM adopciones WHERE id = $1', [id]);
  if (!a) throw new ErrorHttp(404, 'Adopción no encontrada.');
  if (u.rol === 'hogar_paso' && a.lugar_id !== u.lugar_id) throw new ErrorHttp(403, 'Esta adopción corresponde a otro hogar.');
  return a;
}

export default async function rutasSeguimiento(app: FastifyInstance) {
  app.get('/api/gestion/adopciones', async (req) => {
    const u = await exigir(req, 'admin', 'refugio_admin', 'hogar_paso');
    const filtro = u.rol === 'hogar_paso' ? 'WHERE a.lugar_id = $1' : '';
    return q(`SELECT a.id, a.mascota_nombre, a.mascota_foto, a.adoptante_nombre, a.lugar_nombre, a.fecha, a.seguimiento, a.proxima_visita,
        s.radicado, s.telefono, s.correo, s.barrio,
        (SELECT count(*)::int FROM seguimientos g WHERE g.adopcion_id = a.id) AS total_seguimientos,
        (SELECT max(g.fecha) FROM seguimientos g WHERE g.adopcion_id = a.id) AS ultimo_seguimiento
      FROM adopciones a LEFT JOIN solicitudes s ON s.id = a.solicitud_id
      ${filtro}
      ORDER BY (a.seguimiento = 'Cerrado'), a.proxima_visita NULLS LAST, a.fecha DESC LIMIT 1000`, u.rol === 'hogar_paso' ? [u.lugar_id] : []);
  });

  app.get('/api/gestion/adopciones/:id/seguimientos', async (req) => {
    const u = await exigir(req, 'admin', 'refugio_admin', 'hogar_paso');
    const { id } = validar(z.object({ id: uuid }), req.params);
    await adopcionVisible(u, id);
    return q(`SELECT g.id, g.fecha, g.tipo, g.estado, g.notas, g.proxima_visita, g.creado_en, us.nombre AS registrado_por
      FROM seguimientos g LEFT JOIN usuarios us ON us.id = g.usuario_id WHERE g.adopcion_id = $1 ORDER BY g.fecha DESC, g.creado_en DESC`, [id]);
  });

  app.post('/api/gestion/adopciones/:id/seguimientos', async (req, reply) => {
    const u = await exigir(req, 'admin', 'refugio_admin', 'hogar_paso');
    const { id } = validar(z.object({ id: uuid }), req.params);
    await adopcionVisible(u, id);
    const d = validar(z.object({
      fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida'),
      tipo: z.enum(['Visita', 'Llamada', 'Mensaje', 'Fotos o video']),
      estado: z.enum(ESTADOS), notas: texto(2000, 3), proximaVisita: fechaOpc,
    }), req.body);
    if (d.fecha > new Date(Date.now() + 86400000).toISOString().slice(0, 10)) throw new ErrorHttp(400, 'La fecha del seguimiento no puede ser futura.');
    if (d.proximaVisita && d.proximaVisita <= d.fecha) throw new ErrorHttp(400, 'La próxima visita debe ser posterior a este seguimiento.');
    const r = await tx(async (c) => {
      const g = await c.query(`INSERT INTO seguimientos (adopcion_id, fecha, tipo, estado, notas, proxima_visita, usuario_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [id, d.fecha, d.tipo, d.estado, d.notas, d.proximaVisita, u.id]);
      await c.query('UPDATE adopciones SET seguimiento = $1, proxima_visita = $2 WHERE id = $3',
        [d.estado, d.estado === 'Cerrado' ? null : d.proximaVisita, id]);
      return g.rows[0];
    });
    await auditar(req, u.id, `seguimiento:${d.estado}`, 'adopciones', id);
    return reply.code(201).send(r);
  });

  // ---------- Mapa de hallazgos: dónde se encontraron los animales (solo personal autorizado) ----------
  app.get('/api/gestion/hallazgos', async (req) => {
    const u = await exigir(req, 'admin', 'refugio_admin', 'hogar_paso');
    const filtro = u.rol === 'hogar_paso' ? 'AND m.lugar_id = $1' : '';
    return q(`SELECT m.id, m.nombre, m.especie, m.estado, m.fotos->>0 AS foto, m.hallazgo_lat AS lat, m.hallazgo_lng AS lng,
        m.hallazgo_fecha AS fecha, m.hallazgo_referencia AS referencia, l.codigo AS lugar_codigo, l.tipo AS lugar_tipo, l.nombre AS lugar_nombre
      FROM mascotas m JOIN lugares l ON l.id = m.lugar_id
      WHERE m.hallazgo_lat IS NOT NULL ${filtro} ORDER BY m.hallazgo_fecha DESC NULLS LAST LIMIT 2000`, u.rol === 'hogar_paso' ? [u.lugar_id] : []);
  });
}
