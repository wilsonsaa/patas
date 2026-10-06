import { z } from 'zod';
import { ErrorHttp } from './auth.js';

export const texto = (max: number, min = 0) => z.string().trim().min(min).max(max);
export const telefono = z.string().trim().regex(/^[0-9+()\s-]{7,20}$/, 'Teléfono no válido');
export const correo = z.string().trim().toLowerCase().email('Correo no válido').max(160);
export const documento = z.string().trim().regex(/^[0-9A-Za-z.\- ]{4,20}$/, 'Documento no válido');
export const tipoDoc = z.enum(['CC', 'CE', 'TI', 'PPT', 'Pasaporte']);
export const fechaOpc = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional()
  .transform((v) => (v ? v : null));
export const foto = z.string().max(400).refine(
  (v) => /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(v) || /^https:\/\/[^\s"'<>\\]+$/.test(v),
  'La foto debe subirse desde el dispositivo o ser un enlace https');
export const fotoOpc = z.union([z.literal(''), foto]).default('');
export const uuid = z.string().uuid();

export function validar<T extends z.ZodTypeAny>(esquema: T, datos: unknown): z.infer<T> {
  const r = esquema.safeParse(datos);
  if (!r.success) {
    const i = r.error.issues[0];
    const campo = i.path.join('.');
    throw new ErrorHttp(400, `${campo ? campo + ': ' : ''}${i.message}`);
  }
  return r.data;
}
