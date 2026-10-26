import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { q } from '../db.js';
import { ErrorHttp, auditar, cerrarSesion, exigir, hashPassword, iniciarSesion, usuarioDe, verificarPassword, type Usuario } from '../auth.js';
import { correo, telefono, texto, validar } from '../validar.js';
import { captcha } from '../recaptcha.js';

const publico = (u: Usuario, codigoLugar?: string | null) => ({
  id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono,
  rol: u.rol, municipio: u.barrio || 'Mosquera, Cundinamarca',
  lugarId: u.lugar_id, nombreOrganizacion: codigoLugar ?? undefined,
});

async function conLugar(u: Usuario) {
  if (!u.lugar_id) return publico(u);
  const l = await q('SELECT tipo, codigo, nombre FROM lugares WHERE id = $1', [u.lugar_id]);
  return publico(u, l[0] ? (l[0].tipo === 'hogar_paso' ? `Hogar de Paso ${l[0].codigo}` : l[0].nombre) : null);
}

const password = z.string().min(10, 'La contraseña debe tener al menos 10 caracteres').max(128);
// hash de relleno para que el tiempo de respuesta no revele si el correo existe
const HASH_FALSO = await hashPassword('relleno-para-tiempo-constante');

export default async function rutasAuth(app: FastifyInstance) {
  const limiteEstricto = { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } };

  app.post('/api/auth/registro', { ...limiteEstricto, preHandler: captcha('registro') }, async (req, reply) => {
    const d = validar(z.object({
      nombre: texto(120, 3), correo, telefono, barrio: texto(120).default(''), password,
      aceptaDatos: z.literal(true, { errorMap: () => ({ message: 'Debes autorizar el tratamiento de datos personales' }) }),
    }), req.body);
    const existe = await q('SELECT 1 FROM usuarios WHERE lower(correo) = $1', [d.correo]);
    if (existe.length) throw new ErrorHttp(409, 'Ya existe una cuenta con ese correo. Inicia sesión.');
    const [u] = await q<Usuario>(
      `INSERT INTO usuarios (nombre, correo, telefono, barrio, password_hash, acepta_datos_en)
       VALUES ($1,$2,$3,$4,$5, now()) RETURNING id, nombre, correo, telefono, barrio, rol, lugar_id`,
      [d.nombre, d.correo, d.telefono, d.barrio, await hashPassword(d.password)]);
    await iniciarSesion(reply, u.id);
    await auditar(req, u.id, 'registro');
    return reply.code(201).send(publico(u));
  });

  app.post('/api/auth/login', { ...limiteEstricto, preHandler: captcha('login') }, async (req, reply) => {
    const d = validar(z.object({ correo, password: z.string().min(1).max(128) }), req.body);
    const [fila] = await q<Usuario & { password_hash: string }>(
      'SELECT id, nombre, correo, telefono, barrio, rol, lugar_id, password_hash FROM usuarios WHERE lower(correo) = $1 AND activo', [d.correo]);
    const ok = await verificarPassword(d.password, fila?.password_hash ?? HASH_FALSO);
    if (!fila || !ok) {
      await auditar(req, fila?.id ?? null, 'login_fallido');
      throw new ErrorHttp(401, 'Correo o contraseña incorrectos.');
    }
    await iniciarSesion(reply, fila.id);
    await auditar(req, fila.id, 'login');
    return conLugar(fila);
  });

  app.post('/api/auth/logout', async (_req, reply) => { cerrarSesion(reply); return { ok: true }; });

  app.get('/api/auth/yo', async (req) => {
    const u = await usuarioDe(req);
    return u ? await conLugar(u) : null;
  });

  app.patch('/api/auth/perfil', async (req) => {
    const u = await exigir(req);
    const d = validar(z.object({ nombre: texto(120, 3), telefono, barrio: texto(120).default('') }), req.body);
    const [n] = await q<Usuario>(
      'UPDATE usuarios SET nombre=$1, telefono=$2, barrio=$3 WHERE id=$4 RETURNING id, nombre, correo, telefono, barrio, rol, lugar_id',
      [d.nombre, d.telefono, d.barrio, u.id]);
    return conLugar(n);
  });

  app.post('/api/auth/password', limiteEstricto, async (req, reply) => {
    const u = await exigir(req);
    const d = validar(z.object({ actual: z.string().max(128), nueva: password }), req.body);
    const [f] = await q('SELECT password_hash FROM usuarios WHERE id=$1', [u.id]);
    if (!(await verificarPassword(d.actual, f.password_hash))) throw new ErrorHttp(400, 'La contraseña actual no coincide.');
    // cierra las demás sesiones y mantiene abierta la actual
    await q('UPDATE usuarios SET password_hash=$1, sesion_version = sesion_version + 1 WHERE id=$2', [await hashPassword(d.nueva), u.id]);
    await iniciarSesion(reply, u.id);
    await auditar(req, u.id, 'cambio_password');
    return { ok: true };
  });
}
