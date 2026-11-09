import type { FastifyRequest } from 'fastify';
import { config } from './config.js';
import { ErrorHttp } from './auth.js';

// Activo solo con las dos claves: con una sola, el navegador no podría generar tokens válidos
export const recaptchaActivo = () => config.recaptchaSecret.length > 0 && config.recaptchaSiteKey.length > 0;

/**
 * Verifica con Google el token de reCAPTCHA v3 que envía el navegador en la cabecera X-Recaptcha-Token.
 * Se exige en el acceso y en todos los formularios. Sin RECAPTCHA_SECRET_KEY la verificación queda desactivada.
 */
export function captcha(accion: string) {
  return async (req: FastifyRequest) => {
    if (!recaptchaActivo()) return;
    const token = req.headers['x-recaptcha-token'];
    if (typeof token !== 'string' || token.length < 20 || token.length > 4096)
      throw new ErrorHttp(400, 'No se pudo validar la protección anti-robots. Recarga la página e intenta de nuevo.');
    let r: { success?: boolean; score?: number; action?: string; 'error-codes'?: string[] };
    try {
      const resp = await fetch(config.recaptchaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: config.recaptchaSecret, response: token, remoteip: req.ip }),
        signal: AbortSignal.timeout(6000),
      });
      r = (await resp.json()) as typeof r;
    } catch (e) {
      req.log.error({ err: e }, 'reCAPTCHA: no se pudo contactar a Google');
      throw new ErrorHttp(503, 'No se pudo validar la protección anti-robots. Intenta de nuevo en un momento.');
    }
    const ok = r.success === true && r.action === accion && (r.score ?? 0) >= config.recaptchaMinimo;
    if (!ok) {
      req.log.warn({ accion, score: r.score, action: r.action, errores: r['error-codes'] }, 'reCAPTCHA rechazado');
      throw new ErrorHttp(403, 'No pudimos confirmar que eres una persona. Recarga la página e intenta de nuevo.');
    }
  };
}
