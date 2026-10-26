function requerido(nombre: string): string {
  const v = process.env[nombre];
  if (!v) throw new Error(`Falta la variable de entorno ${nombre}`);
  return v;
}

const esProduccion = process.env.NODE_ENV === 'production';
const jwtSecret = requerido('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');

export const config = {
  esProduccion,
  puerto: Number(process.env.PORT ?? 3000),
  // vacío = conexión por las variables PG* (en el contenedor: socket local de PostgreSQL)
  databaseUrl: process.env.DATABASE_URL ?? '',
  // carpeta con la aplicación web compilada; vacío = la API no sirve la web
  staticDir: process.env.STATIC_DIR ?? '',
  jwtSecret: new TextEncoder().encode(jwtSecret),
  // true cuando el sitio se sirve por HTTPS (obligatorio en producción real)
  cookieSegura: (process.env.COOKIE_SECURE ?? 'false') === 'true',
  sesionHoras: Number(process.env.SESION_HORAS ?? 8),
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  adminCorreo: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  // reCAPTCHA v3. La clave del sitio es pública; la secreta SOLO va en la variable de entorno.
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY ?? '6LfL6eEtAAAAAG908hiSX5ypoPwreHIw_EJAveqE',
  recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY ?? '',
  recaptchaMinimo: Number(process.env.RECAPTCHA_MIN_SCORE ?? 0.5),
  recaptchaUrl: process.env.RECAPTCHA_VERIFY_URL ?? 'https://www.google.com/recaptcha/api/siteverify',
  // Correo saliente (recuperación de contraseña). Sin SMTP_HOST el envío queda desactivado.
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    puerto: Number(process.env.SMTP_PORT ?? 587),
    seguro: (process.env.SMTP_SECURE ?? 'false') === 'true',
    usuario: process.env.SMTP_USER ?? '',
    clave: process.env.SMTP_PASS ?? '',
    remitente: process.env.SMTP_FROM ?? '',
  },
  // Dirección pública del sitio (https://...), usada en los enlaces que se envían por correo
  appUrl: (process.env.APP_URL ?? '').replace(/\/+$/, ''),
  // Número de WhatsApp de la línea de bienestar animal, con indicativo y solo dígitos (ej. 573001234567)
  whatsappBienestar: (process.env.WHATSAPP_BIENESTAR ?? '').replace(/\D/g, ''),
  seedDemo: (process.env.SEED_DEMO ?? 'false') === 'true',
  // número de proxies de confianza delante del contenedor (0 = ninguno)
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
};
