import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from './config.js';
import { q } from './db.js';

const scryptAsync = promisify(scrypt) as (p: string, s: Buffer, n: number, o: object) => Promise<Buffer>;
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const COOKIE = 'patas_sesion';

export type Rol = 'adoptante' | 'hogar_paso' | 'refugio_admin' | 'admin';
export interface Usuario {
  id: string; nombre: string; correo: string; telefono: string; barrio: string;
  rol: Rol; lugar_id: string | null;
}

export class ErrorHttp extends Error {
  constructor(public status: number, mensaje: string) { super(mensaje); }
}

export async function hashPassword(password: string): Promise<string> {
  const sal = randomBytes(16);
  const h = await scryptAsync(password.normalize('NFKC'), sal, 64, SCRYPT);
  return `scrypt$${sal.toString('base64')}$${h.toString('base64')}`;
}

export async function verificarPassword(password: string, guardado: string): Promise<boolean> {
  const [alg, sal, hash] = guardado.split('$');
  if (alg !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64');
  const h = await scryptAsync(password.normalize('NFKC'), Buffer.from(sal, 'base64'), esperado.length, SCRYPT);
  return timingSafeEqual(h, esperado);
}

export async function iniciarSesion(reply: FastifyReply, usuarioId: string): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${config.sesionHoras}h`)
    .sign(config.jwtSecret);
  reply.setCookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: config.cookieSegura, path: '/',
    maxAge: config.sesionHoras * 3600,
  });
}

export function cerrarSesion(reply: FastifyReply): void {
  reply.clearCookie(COOKIE, { path: '/' });
}

/** Devuelve el usuario de la sesión o null. El rol se lee siempre de la base de datos. */
export async function usuarioDe(req: FastifyRequest): Promise<Usuario | null> {
  const token = req.cookies[COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, config.jwtSecret, { algorithms: ['HS256'] });
    const filas = await q<Usuario>(
      'SELECT id, nombre, correo, telefono, barrio, rol, lugar_id FROM usuarios WHERE id = $1 AND activo', [payload.sub]);
    return filas[0] ?? null;
  } catch {
    return null;
  }
}

export async function exigir(req: FastifyRequest, ...roles: Rol[]): Promise<Usuario> {
  const u = await usuarioDe(req);
  if (!u) throw new ErrorHttp(401, 'Debes iniciar sesión para continuar.');
  if (roles.length && !roles.includes(u.rol)) throw new ErrorHttp(403, 'No tienes permiso para esta acción.');
  return u;
}

export async function auditar(req: FastifyRequest, usuarioId: string | null, accion: string, entidad = '', entidadId = ''): Promise<void> {
  await q('INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, ip) VALUES ($1,$2,$3,$4,$5)',
    [usuarioId, accion, entidad, entidadId, req.ip]).catch(() => {});
}
