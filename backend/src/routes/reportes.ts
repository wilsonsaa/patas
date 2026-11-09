import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q, radicado } from '../db.js';
import { ErrorHttp, auditar, exigir, usuarioDe } from '../auth.js';
import { correo, fotoOpc, telefono, texto, uuid, validar } from '../validar.js';
import { captcha } from '../recaptcha.js';
import { avisarEntidad, escapar as e, notificar } from '../correo.js';

const CONDICIONES = ['Aparentemente sano', 'Herido', 'Desnutrido o enfermo', 'Cachorros o crías', 'Agresivo o asustado'] as const;
const ESTADOS = ['Nuevo', 'En atención', 'Rescatado', 'No encontrado', 'Cerrado'] as const;
const mapa = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

/**
 * Reporte de un animal abandonado, herido o en riesgo. Es público (no exige cuenta) para no frenar
 * a quien encuentra al animal; lo protegen reCAPTCHA y un límite de envíos por dirección IP.
 */
export default async function rutasReportes(app: FastifyInstance) {
  app.post('/api/reportes', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }, preHandler: captcha('reporte') }, async (req, reply) => {
    const u = await usuarioDe(req);
    const d = validar(z.object({
      especie: z.enum(['perro', 'gato', 'otro']), condicion: z.enum(CONDICIONES), cantidad: z.number().int().min(1).max(30).default(1),
      descripcion: texto(1000, 10), foto: fotoOpc,
      lat: z.number().min(4.3).max(5.1), lng: z.number().min(-74.6).max(-73.8), referencia: texto(200).default(''),
      nombre: texto(120, 3), telefono, correo: z.union([z.literal(''), correo]).default(''),
      aceptaDatos: z.literal(true, { errorMap: () => ({ message: 'Debes autorizar el tratamiento de datos personales' }) }),
    }), req.body);
    const [r] = await q(`INSERT INTO reportes (radicado, especie, condicion, cantidad, descripcion, foto, lat, lng, referencia, nombre, telefono, correo, usuario_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, radicado, lat, lng, estado, creado_en`,
      [await radicado('RAB'), d.especie, d.condicion, d.cantidad, d.descripcion, d.foto, d.lat, d.lng, d.referencia, d.nombre, d.telefono, d.correo || u?.correo || '', u?.id ?? null]);
    await auditar(req, u?.id ?? null, 'reporte_creado', 'reportes', r.id);
    const urgente = d.condicion === 'Herido' || d.condicion === 'Desnutrido o enfermo' || d.condicion === 'Cachorros o crías';
    avisarEntidad(req.log, `${urgente ? 'URGENTE · ' : ''}Reporte de animal ${r.radicado}`,
      [`<strong>${d.cantidad} ${e(d.especie)}${d.cantidad > 1 ? 's' : ''}</strong> · ${e(d.condicion)}`, e(d.descripcion),
        `Lugar: ${e(d.referencia || 'sin referencia')} · <a href="${mapa(d.lat, d.lng)}">ver en el mapa</a>`,
        `Reportó: ${e(d.nombre)} · ${e(d.telefono)}`], 'panel');
    const destino = d.correo || u?.correo;
    if (destino) notificar(req.log, destino, `Recibimos tu reporte ${r.radicado}`, 'Reporte recibido',
      ['Gracias por avisar. La Dirección de Protección Animal revisará el caso y podrá contactarte para más detalles.', `Radicado: <strong>${r.radicado}</strong>.`]);
    return reply.code(201).send({ ...r, mapa: mapa(d.lat, d.lng) });
  });

  app.get('/api/reportes/mios', async (req) => {
    const u = await exigir(req);
    return q('SELECT id, radicado, especie, condicion, referencia, lat, lng, estado, creado_en FROM reportes WHERE usuario_id = $1 ORDER BY creado_en DESC LIMIT 200', [u.id]);
  });

  app.get('/api/gestion/reportes', async (req) => {
    await exigir(req, 'admin', 'refugio_admin');
    return q(`SELECT r.*, us.nombre AS atendido_por_nombre FROM reportes r LEFT JOIN usuarios us ON us.id = r.atendido_por
      ORDER BY (r.estado IN ('Rescatado','No encontrado','Cerrado')), r.creado_en DESC LIMIT 2000`);
  });

  app.patch('/api/gestion/reportes/:id', async (req) => {
    const u = await exigir(req, 'admin', 'refugio_admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(z.object({ estado: z.enum(ESTADOS), notas: texto(2000).default('') }), req.body);
    const [r] = await q(`UPDATE reportes SET estado=$1, notas=$2, atendido_por=$3, actualizado_en=now() WHERE id=$4
      RETURNING radicado, correo, estado`, [d.estado, d.notas, u.id, id]);
    if (!r) throw new ErrorHttp(404, 'Reporte no encontrado.');
    await auditar(req, u.id, `reporte:${d.estado}`, 'reportes', id);
    const mensajes: Record<string, string> = {
      'En atención': 'El equipo de la Dirección de Protección Animal ya está atendiendo el caso.',
      Rescatado: '¡El animal fue rescatado! Gracias por avisar a tiempo.',
      'No encontrado': 'El equipo visitó el lugar pero no encontró al animal. Si lo vuelves a ver, haz un nuevo reporte.',
    };
    if (r.correo && mensajes[d.estado]) notificar(req.log, r.correo, `Tu reporte ${r.radicado}: ${d.estado}`, `Reporte ${d.estado.toLowerCase()}`, [mensajes[d.estado]]);
    return { ok: true };
  });
}
