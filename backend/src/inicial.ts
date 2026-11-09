import type { FastifyBaseLogger } from 'fastify';
import { config } from './config.js';
import { q } from './db.js';
import { esHashValido, hashPassword } from './auth.js';

/**
 * Crea el administrador inicial (control total) si todavía no existe ninguno.
 * La plataforma arranca vacía: sin mascotas, refugios ni usuarios de ejemplo.
 */
export async function crearAdministradorInicial(log: FastifyBaseLogger): Promise<void> {
  const [{ n }] = await q("SELECT count(*)::int AS n FROM usuarios WHERE rol='admin' AND activo");
  if (n) return;
  const { correo, nombre, hash, password } = config.admin;
  if (!correo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    log.warn('No hay administrador. Define ADMIN_EMAIL y ADMIN_PASSWORD_HASH en el .env, o créalo con «node dist/cli.js crear-admin».');
    return;
  }
  let passwordHash = '';
  if (hash) {
    if (!esHashValido(hash)) { log.error('ADMIN_PASSWORD_HASH no tiene un formato válido. Genéralo con «node dist/cli.js hash».'); return; }
    passwordHash = hash;
  } else if (password.length >= 12) {
    passwordHash = await hashPassword(password);
  } else {
    log.warn('ADMIN_PASSWORD debe tener al menos 12 caracteres (o usa ADMIN_PASSWORD_HASH). No se creó el administrador.');
    return;
  }
  const existe = await q('SELECT id FROM usuarios WHERE lower(correo) = $1', [correo]);
  if (existe.length) {
    await q("UPDATE usuarios SET rol='admin', activo=true, password_hash=$1, sesion_version = sesion_version + 1 WHERE id=$2", [passwordHash, existe[0].id]);
  } else {
    await q("INSERT INTO usuarios (nombre, correo, password_hash, rol, acepta_datos_en) VALUES ($1, $2, $3, 'admin', now())", [nombre, correo, passwordHash]);
  }
  log.info(`Administrador inicial listo: ${correo}`);
}
