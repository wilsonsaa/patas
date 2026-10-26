import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { config } from './config.js';
import { migrar, pool, q } from './db.js';
import { ErrorHttp } from './auth.js';
import { sembrar } from './seed.js';
import { recaptchaActivo } from './recaptcha.js';
import rutasAuth from './routes/auth.js';
import rutasMascotas from './routes/mascotas.js';
import rutasTramites from './routes/tramites.js';
import rutasArchivos from './routes/archivos.js';
import rutasRecuperacion from './routes/recuperacion.js';
import rutasSeguimiento from './routes/seguimiento.js';
import { correoActivo } from './correo.js';

const app = Fastify({
  trustProxy: config.trustProxy as unknown as boolean, // número de saltos de proxy de confianza
  bodyLimit: 256 * 1024,
  logger: {
    level: config.esProduccion ? 'info' : 'debug',
    // nunca registrar cookies ni credenciales
    redact: ['req.headers.cookie', 'req.headers.authorization', 'req.body.password', 'req.body.actual', 'req.body.nueva'],
  },
});

await app.register(helmet, {
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'],
      frameSrc: ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://www.google.com/recaptcha/'], objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'none'"],
    },
  },
  // HSTS solo tiene sentido cuando el sitio ya se sirve por HTTPS
  strictTransportSecurity: config.cookieSegura,
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
app.addHook('onSend', async (req, reply) => {
  reply.header('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=()');
  if (req.url.startsWith('/api/')) reply.header('Cache-Control', 'no-store');
});
await app.register(cookie);
await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } });
await app.register(fastifyStatic, {
  root: path.resolve(config.uploadDir), prefix: '/uploads/', index: false, dotfiles: 'deny',
  maxAge: '30d', immutable: true,
});

// Defensa CSRF: toda petición que modifica datos debe traer una cabecera propia.
// Un formulario o sitio externo no puede enviarla sin permiso CORS, y la API no habilita CORS.
app.addHook('onRequest', async (req) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers['x-patas'] !== '1')
    throw new ErrorHttp(403, 'Petición no permitida.');
});

app.setErrorHandler((err: any, req, reply) => {
  if (err instanceof ErrorHttp) return reply.code(err.status).send({ error: err.message });
  if (err.code === 'FST_REQ_FILE_TOO_LARGE') return reply.code(413).send({ error: 'La imagen supera el límite de 5 MB.' });
  if (err.statusCode === 429) return reply.code(429).send({ error: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.' });
  if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: 'Solicitud no válida.' });
  req.log.error(err);
  return reply.code(500).send({ error: 'Ocurrió un error interno. Intenta de nuevo.' });
});

app.get('/api/salud', async () => { await q('SELECT 1'); return { ok: true }; });
// Configuración pública que necesita el navegador (la clave del sitio de reCAPTCHA no es secreta)
app.get('/api/config', async () => ({
  recaptchaSiteKey: recaptchaActivo() ? config.recaptchaSiteKey : '',
  whatsappBienestar: config.whatsappBienestar,
  recuperacionPorCorreo: correoActivo(),
}));
await app.register(rutasAuth);
await app.register(rutasMascotas);
await app.register(rutasTramites);
await app.register(rutasArchivos);
await app.register(rutasRecuperacion);
await app.register(rutasSeguimiento);

// Aplicación web compilada (imagen única): archivos estáticos + respaldo a index.html
if (config.staticDir) {
  await app.register(fastifyStatic, {
    root: path.resolve(config.staticDir), prefix: '/', decorateReply: false, index: ['index.html'],
    setHeaders(res, ruta) {
      res.setHeader('Cache-Control', ruta.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  });
  const { readFile } = await import('node:fs/promises');
  const indice = await readFile(path.join(path.resolve(config.staticDir), 'index.html'));
  app.setNotFoundHandler((req, reply) => {
    if (req.method !== 'GET' || req.url.startsWith('/api/') || req.url.startsWith('/uploads/'))
      return reply.code(404).send({ error: 'No encontrado.' });
    return reply.header('Cache-Control', 'no-cache').type('text/html; charset=utf-8').send(indice);
  });
}

if (!correoActivo()) app.log.warn('Correo DESACTIVADO: define SMTP_HOST, SMTP_FROM y APP_URL para la recuperación de contraseña por correo.');
if (!recaptchaActivo()) app.log.warn('reCAPTCHA DESACTIVADO: define RECAPTCHA_SECRET_KEY para proteger los formularios.');
await migrar();
await sembrar(app.log);
await app.listen({ host: '0.0.0.0', port: config.puerto });

for (const senal of ['SIGTERM', 'SIGINT'] as const)
  process.on(senal, async () => { await app.close(); await pool.end(); process.exit(0); });
