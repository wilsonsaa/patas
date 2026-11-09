// Toda la configuración sensible llega por variables de entorno. El código no contiene claves ni datos de la entidad.
const env = (n: string, d = '') => (process.env[n] ?? d).trim();
const esProduccion = process.env.NODE_ENV === 'production';

let jwtCache: Uint8Array | null = null;

export const config = {
  esProduccion,
  puerto: Number(env('PORT', '3000')),
  // vacío = conexión por las variables PG* (en el contenedor: socket local de PostgreSQL)
  databaseUrl: env('DATABASE_URL'),
  staticDir: env('STATIC_DIR'),
  /** Secreto para firmar sesiones. Se valida al usarlo, para que la consola de administración no lo necesite. */
  get jwtSecret(): Uint8Array {
    if (jwtCache) return jwtCache;
    const s = env('JWT_SECRET');
    if (s.length < 32) throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres');
    return (jwtCache = new TextEncoder().encode(s));
  },
  cookieSegura: env('COOKIE_SECURE', 'false') === 'true',
  sesionHoras: Number(env('SESION_HORAS', '8')),
  uploadDir: env('UPLOAD_DIR', './uploads'),
  trustProxy: Number(env('TRUST_PROXY', '0')),

  // Administrador inicial: se crea solo si no existe ningún administrador
  admin: {
    correo: env('ADMIN_EMAIL').toLowerCase(),
    nombre: env('ADMIN_NOMBRE', 'Administrador PATAS'),
    hash: env('ADMIN_PASSWORD_HASH'), // recomendado: generado con «node dist/cli.js hash»
    password: env('ADMIN_PASSWORD'),  // alternativa: en texto plano (bórrala del .env después del primer arranque)
  },

  // reCAPTCHA v3 de la entidad: las dos claves se crean en https://www.google.com/recaptcha/admin
  recaptchaSiteKey: env('RECAPTCHA_SITE_KEY'),
  recaptchaSecret: env('RECAPTCHA_SECRET_KEY'),
  recaptchaMinimo: Number(env('RECAPTCHA_MIN_SCORE', '0.5')),
  recaptchaUrl: env('RECAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify'),

  // Correo saliente: recuperación de contraseña y notificaciones
  smtp: {
    host: env('SMTP_HOST'),
    puerto: Number(env('SMTP_PORT', '587')),
    seguro: env('SMTP_SECURE', 'false') === 'true',
    usuario: env('SMTP_USER'),
    clave: env('SMTP_PASS'),
    remitente: env('SMTP_FROM'),
  },
  // Correos de la entidad que reciben avisos (separados por coma)
  notificaciones: env('NOTIFICACIONES_CORREO').split(',').map((c) => c.trim()).filter(Boolean),
  // Dirección pública del sitio (https://...), usada en los enlaces de los correos
  appUrl: env('APP_URL').replace(/\/+$/, ''),

  whatsappBienestar: env('WHATSAPP_BIENESTAR').replace(/\D/g, ''),

  // Datos de la entidad responsable (pie de página y política de privacidad)
  entidad: {
    nombre: env('ENTIDAD_NOMBRE', 'Alcaldía Municipal de Mosquera'),
    dependencia: env('ENTIDAD_DEPENDENCIA', 'Secretaría de Ambiente – Dirección de Protección Animal'),
    direccion: env('ENTIDAD_DIRECCION'),
    correo: env('ENTIDAD_CORREO'),
    telefono: env('ENTIDAD_TELEFONO'),
    horario: env('ENTIDAD_HORARIO'),
  },

  // Mapas: Leaflet + OpenStreetMap por defecto (gratuito, sin clave). Satélite opcional.
  mapa: {
    tilesUrl: env('MAPA_TILES_URL'),
    atribucion: env('MAPA_ATRIBUCION'),
    sateliteUrl: env('MAPA_SATELITE_URL'),
    sateliteAtribucion: env('MAPA_SATELITE_ATRIBUCION'),
  },
};
