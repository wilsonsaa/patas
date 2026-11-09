// Consola de administración de PATAS.
// Dentro del contenedor:  docker compose exec patas node dist/cli.js <comando>
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { hashPassword } from './auth.js';
import { config } from './config.js';

const AYUDA = `Comandos:
  hash                         Genera el hash de una contraseña para ADMIN_PASSWORD_HASH (la pide sin mostrarla)
  crear-admin <correo> [nombre]  Crea un administrador o restablece la contraseña de uno existente
  probar-correo <destino>      Envía un correo de prueba con la configuración SMTP actual
  estado                       Muestra qué funciones están configuradas (sin revelar secretos)`;

/** Pide una contraseña por la terminal sin mostrarla. También acepta la contraseña por entrada estándar. */
async function pedirClave(texto: string): Promise<string> {
  if (!process.stdin.isTTY) {
    const datos: Buffer[] = [];
    for await (const c of process.stdin) datos.push(c as Buffer);
    return Buffer.concat(datos).toString('utf8').split(/\r?\n/)[0];
  }
  let silenciar = false;
  const salida = new Writable({ write(chunk, _e, cb) { if (!silenciar) process.stdout.write(chunk); cb(); } });
  const rl = createInterface({ input: process.stdin, output: salida, terminal: true });
  return new Promise((ok) => {
    rl.question(texto, (r) => { rl.close(); process.stdout.write('\n'); ok(r); });
    silenciar = true;
  });
}

async function nuevaClave(): Promise<string> {
  const a = await pedirClave('Contraseña (mínimo 12 caracteres): ');
  if (a.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  if (process.stdin.isTTY) {
    const b = await pedirClave('Repítela: ');
    if (a !== b) throw new Error('Las contraseñas no coinciden.');
  }
  return a;
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case 'hash': {
      const h = await hashPassword(await nuevaClave());
      console.log('\nCopia esta línea en tu archivo .env:\n');
      console.log(`ADMIN_PASSWORD_HASH=${h}\n`);
      return;
    }
    case 'crear-admin': {
      const correo = (args[0] ?? '').toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error('Uso: crear-admin <correo> [nombre]');
      const nombre = args.slice(1).join(' ') || 'Administrador PATAS';
      const h = await hashPassword(await nuevaClave());
      const { q, pool } = await import('./db.js');
      const existe = await q('SELECT id FROM usuarios WHERE lower(correo) = $1', [correo]);
      if (existe.length) {
        await q("UPDATE usuarios SET rol='admin', activo=true, password_hash=$1, sesion_version = sesion_version + 1 WHERE id=$2", [h, existe[0].id]);
        console.log(`Listo: ${correo} ahora es administrador y su contraseña fue cambiada.`);
      } else {
        await q("INSERT INTO usuarios (nombre, correo, password_hash, rol, acepta_datos_en) VALUES ($1,$2,$3,'admin', now())", [nombre, correo, h]);
        console.log(`Listo: administrador ${correo} creado.`);
      }
      await q("INSERT INTO auditoria (accion, entidad, entidad_id, ip) VALUES ('admin_creado_por_consola', 'usuarios', $1, 'consola')", [correo]);
      await pool.end();
      return;
    }
    case 'probar-correo': {
      const destino = args[0];
      if (!destino) throw new Error('Uso: probar-correo <destino>');
      const { correoActivo, probarCorreo } = await import('./correo.js');
      if (!correoActivo()) throw new Error('Falta configurar SMTP_HOST, SMTP_FROM y APP_URL.');
      await probarCorreo(destino);
      console.log(`Correo de prueba enviado a ${destino}. Revisa también la carpeta de spam.`);
      return;
    }
    case 'estado': {
      const si = (v: unknown) => (v ? 'sí' : 'NO');
      console.log(`Administrador inicial definido en .env: ${si(config.admin.correo)} (${config.admin.hash ? 'con hash' : config.admin.password ? 'con contraseña en texto' : 'sin contraseña'})
reCAPTCHA: clave del sitio ${si(config.recaptchaSiteKey)} · clave secreta ${si(config.recaptchaSecret)}
Correo SMTP: ${si(config.smtp.host && config.smtp.remitente)} · APP_URL: ${config.appUrl || 'NO'} · avisos a: ${config.notificaciones.join(', ') || 'nadie'}
Cookies seguras (HTTPS): ${si(config.cookieSegura)} · WhatsApp: ${si(config.whatsappBienestar)}
Entidad: ${config.entidad.nombre} · correo ${config.entidad.correo || 'NO'} · teléfono ${config.entidad.telefono || 'NO'}
Mapa: ${config.mapa.tilesUrl || 'OpenStreetMap (por defecto)'} · satélite ${si(config.mapa.sateliteUrl)}`);
      return;
    }
    default:
      console.log(AYUDA);
  }
}

main().catch((e) => { console.error('Error:', e instanceof Error ? e.message : e); process.exit(1); });
