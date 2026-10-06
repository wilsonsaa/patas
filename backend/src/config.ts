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
  seedDemo: (process.env.SEED_DEMO ?? 'false') === 'true',
  // número de proxies de confianza delante del contenedor (0 = ninguno)
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
};
