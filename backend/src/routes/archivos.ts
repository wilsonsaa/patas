import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { ErrorHttp, exigir } from '../auth.js';

/** Identifica el tipo real del archivo por sus primeros bytes (no por el nombre ni el Content-Type). */
function tipoReal(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length > 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

export default async function rutasArchivos(app: FastifyInstance) {
  await mkdir(config.uploadDir, { recursive: true });

  app.post('/api/archivos', { config: { rateLimit: { max: 30, timeWindow: '10 minutes' } } }, async (req, reply) => {
    await exigir(req);
    const archivo = await req.file();
    if (!archivo) throw new ErrorHttp(400, 'No se recibió ningún archivo.');
    const datos = await archivo.toBuffer(); // lanza error si supera el límite configurado
    const ext = tipoReal(datos);
    if (!ext) throw new ErrorHttp(415, 'Solo se permiten imágenes JPG, PNG o WebP.');
    const nombre = `${randomBytes(16).toString('hex')}.${ext}`;
    await writeFile(path.join(config.uploadDir, nombre), datos, { mode: 0o640 });
    return reply.code(201).send({ url: `/uploads/${nombre}` });
  });
}
