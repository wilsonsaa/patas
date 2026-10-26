import type { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { q, tx } from '../db.js';
import { ErrorHttp, auditar, exigir, hashPassword } from '../auth.js';
import { correo, telefono, texto, uuid, validar } from '../validar.js';
import { captcha } from '../recaptcha.js';
import { config } from '../config.js';
import { correoActivo, enviarCorreo, escapar } from '../correo.js';

const sha = (t: string) => createHash('sha256').update(t).digest('hex');
const RESPUESTA_GENERICA = { ok: true, mensaje: 'Si los datos corresponden a una cuenta, te enviamos un correo con las instrucciones. Revisa también la carpeta de spam.' };

/** Crea un enlace de un solo uso. Solo se guarda el hash: ni la base de datos permite reconstruirlo. */
async function crearEnlace(usuarioId: string, horas: number, creadoPor: string | null) {
  const token = randomBytes(32).toString('base64url');
  await q("UPDATE restablecimientos SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL", [usuarioId]);
  await q("INSERT INTO restablecimientos (usuario_id, token_hash, expira_en, creado_por) VALUES ($1, $2, now() + make_interval(hours => $3), $4)",
    [usuarioId, sha(token), horas, creadoPor]);
  return token;
}

export default async function rutasRecuperacion(app: FastifyInstance) {
  const limite = { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } };

  // 1. Olvidé mi contraseña: se envía un enlace válido por 1 hora
  app.post('/api/auth/olvide', { ...limite, preHandler: captcha('recuperar') }, async (req) => {
    const d = validar(z.object({ correo }), req.body);
    if (!correoActivo()) throw new ErrorHttp(503, 'La recuperación por correo no está habilitada. Comunícate con la línea de bienestar animal para restablecer tu acceso.');
    const [u] = await q('SELECT id, nombre, correo FROM usuarios WHERE lower(correo) = $1 AND activo', [d.correo]);
    if (u) {
      const token = await crearEnlace(u.id, 1, null);
      await enviarCorreo(req.log, u.correo, 'Restablece tu contraseña de PATAS', 'Restablece tu contraseña',
        [`Hola ${escapar(u.nombre.split(' ')[0])}, recibimos una solicitud para cambiar la contraseña de tu cuenta en PATAS.`,
          'El enlace funciona una sola vez y vence en <strong>1 hora</strong>.'],
        { texto: 'Crear nueva contraseña', url: `${config.appUrl}/#/restablecer?t=${token}` });
      await auditar(req, u.id, 'recuperacion_solicitada');
    }
    return RESPUESTA_GENERICA;
  });

  // 2. Olvidé con qué correo me registré: se busca por teléfono y se envía un recordatorio a ese correo
  app.post('/api/auth/olvide-correo', { ...limite, preHandler: captcha('recuperar') }, async (req) => {
    const d = validar(z.object({ telefono }), req.body);
    if (!correoActivo()) throw new ErrorHttp(503, 'La recuperación por correo no está habilitada. Comunícate con la línea de bienestar animal.');
    const digitos = d.telefono.replace(/\D/g, '').slice(-10);
    const filas = await q("SELECT id, nombre, correo FROM usuarios WHERE activo AND right(regexp_replace(telefono, '\\D', '', 'g'), 10) = $1 LIMIT 3", [digitos]);
    for (const u of filas) {
      await enviarCorreo(req.log, u.correo, 'Tu usuario de PATAS', 'Este es tu usuario',
        [`Hola ${escapar(u.nombre.split(' ')[0])}, para entrar a PATAS usa este correo como usuario:`, `<strong>${escapar(u.correo)}</strong>`,
          'Si tampoco recuerdas la contraseña, en la pantalla de ingreso elige «¿Olvidaste tu contraseña?».'],
        { texto: 'Ir a PATAS', url: `${config.appUrl}/` });
      await auditar(req, u.id, 'recordatorio_usuario');
    }
    return RESPUESTA_GENERICA;
  });

  // 3. Crear la nueva contraseña con el enlace
  app.post('/api/auth/restablecer', limite, async (req) => {
    const d = validar(z.object({
      token: z.string().min(20).max(100),
      password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres').max(128),
    }), req.body);
    const usuarioId = await tx(async (c) => {
      const r = await c.query('SELECT id, usuario_id FROM restablecimientos WHERE token_hash = $1 AND usado_en IS NULL AND expira_en > now() FOR UPDATE', [sha(d.token)]);
      if (!r.rowCount) throw new ErrorHttp(400, 'El enlace no es válido o ya venció. Solicita uno nuevo.');
      const { id, usuario_id } = r.rows[0];
      await c.query('UPDATE restablecimientos SET usado_en = now() WHERE id = $1', [id]);
      // cambiar la contraseña cierra todas las sesiones abiertas de la cuenta
      await c.query('UPDATE usuarios SET password_hash = $1, sesion_version = sesion_version + 1 WHERE id = $2', [await hashPassword(d.password), usuario_id]);
      return usuario_id as string;
    });
    await auditar(req, usuarioId, 'password_restablecida');
    return { ok: true };
  });

  // ---------- Administración de usuarios ----------
  app.get('/api/admin/usuarios', async (req) => {
    const u = await exigir(req, 'admin');
    const { buscar } = validar(z.object({ buscar: texto(80).default('') }), req.query);
    await auditar(req, u.id, 'consulta_usuarios');
    return q(`SELECT u.id, u.nombre, u.correo, u.telefono, u.rol, u.activo, u.creado_en, l.codigo AS lugar_codigo
      FROM usuarios u LEFT JOIN lugares l ON l.id = u.lugar_id
      WHERE $1 = '' OR u.nombre ILIKE '%' || $1 || '%' OR u.correo ILIKE '%' || $1 || '%' OR u.telefono ILIKE '%' || $1 || '%'
      ORDER BY u.creado_en DESC LIMIT 100`, [buscar]);
  });

  // Enlace de restablecimiento que el administrador entrega por WhatsApp (sirve aunque no haya correo configurado)
  app.post('/api/admin/usuarios/:id/enlace', async (req) => {
    const admin = await exigir(req, 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const [u] = await q('SELECT id FROM usuarios WHERE id = $1', [id]);
    if (!u) throw new ErrorHttp(404, 'Usuario no encontrado.');
    const token = await crearEnlace(id, 24, admin.id);
    await auditar(req, admin.id, 'enlace_restablecimiento_generado', 'usuarios', id);
    return { token, horas: 24 };
  });

  app.patch('/api/admin/usuarios/:id', async (req) => {
    const admin = await exigir(req, 'admin');
    const { id } = validar(z.object({ id: uuid }), req.params);
    const d = validar(z.object({ rol: z.enum(['adoptante', 'refugio_admin', 'admin']).optional(), activo: z.boolean().optional() }), req.body);
    if (id === admin.id) throw new ErrorHttp(400, 'No puedes cambiar tu propio rol ni desactivar tu propia cuenta.');
    const [u] = await q('SELECT rol FROM usuarios WHERE id = $1', [id]);
    if (!u) throw new ErrorHttp(404, 'Usuario no encontrado.');
    if (u.rol === 'hogar_paso' && d.rol) throw new ErrorHttp(400, 'El rol de un hogar de paso se gestiona desde la verificación del hogar.');
    await q(`UPDATE usuarios SET rol = COALESCE($1, rol), activo = COALESCE($2, activo),
      sesion_version = sesion_version + CASE WHEN $2 = false THEN 1 ELSE 0 END WHERE id = $3`, [d.rol ?? null, d.activo ?? null, id]);
    await auditar(req, admin.id, `usuario_actualizado:${d.rol ?? ''}:${d.activo ?? ''}`, 'usuarios', id);
    return { ok: true };
  });
}
