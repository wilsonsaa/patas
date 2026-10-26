// Cliente de la API de PATAS. La sesión viaja en una cookie httpOnly: el navegador
// la envía sola y el código de la página nunca puede leerla.
export class ErrorApi extends Error {
  constructor(public status: number, mensaje: string) { super(mensaje); }
}

// ---------- reCAPTCHA v3 ----------
// Formularios protegidos y el nombre de acción que el servidor espera para cada uno.
const ACCIONES: Record<string, string> = {
  '/auth/registro': 'registro', '/auth/login': 'login', '/solicitudes': 'adopcion', '/mascotas-propias': 'mascota_propia',
  '/manejo-especial': 'manejo_especial', '/donaciones': 'donacion', '/hogares': 'hogar',
  '/auth/olvide': 'recuperar', '/auth/olvide-correo': 'recuperar',
};
declare global {
  interface Window { grecaptcha?: { ready(cb: () => void): void; execute(clave: string, o: { action: string }): Promise<string> } }
}
export interface ConfigPublica { recaptchaSiteKey: string; whatsappBienestar: string; recuperacionPorCorreo: boolean }
let configPublica: Promise<ConfigPublica> | null = null;
/** Configuración pública del servidor (se pide una sola vez). */
export function obtenerConfig(): Promise<ConfigPublica> {
  configPublica ??= fetch('/api/config').then((r) => r.json())
    .catch(() => ({ recaptchaSiteKey: '', whatsappBienestar: '', recuperacionPorCorreo: false }));
  return configPublica;
}
let claveSitio: Promise<string> | null = null;

/** Carga el script de Google una sola vez (muestra la insignia "protegido por reCAPTCHA"). */
export function iniciarRecaptcha(): Promise<string> {
  claveSitio ??= obtenerConfig().then(({ recaptchaSiteKey }) => new Promise<string>((resolver) => {
    if (!recaptchaSiteKey) return resolver('');
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}&hl=es`;
    s.async = true;
    s.onload = () => resolver(recaptchaSiteKey);
    s.onerror = () => resolver('');
    document.head.appendChild(s);
  })).catch(() => '');
  return claveSitio;
}

async function tokenRecaptcha(accion: string): Promise<string> {
  const clave = await iniciarRecaptcha();
  if (!clave || !window.grecaptcha) return '';
  try {
    await new Promise<void>((ok) => window.grecaptcha!.ready(ok));
    return await window.grecaptcha.execute(clave, { action: accion });
  } catch { return ''; }
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const esArchivo = cuerpo instanceof FormData;
  const accion = metodo === 'POST' ? ACCIONES[ruta] : undefined;
  const token = accion ? await tokenRecaptcha(accion) : '';
  let r: Response;
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        ...(metodo !== 'GET' ? { 'X-Patas': '1' } : {}),
        ...(token ? { 'X-Recaptcha-Token': token } : {}),
        ...(cuerpo !== undefined && !esArchivo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: cuerpo === undefined ? undefined : esArchivo ? cuerpo : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
  }
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new ErrorApi(r.status, datos?.error ?? 'Ocurrió un error. Intenta de nuevo.');
  return datos as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>('POST', ruta, cuerpo ?? {}),
  patch: <T>(ruta: string, cuerpo: unknown) => pedir<T>('PATCH', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo: unknown) => pedir<T>('PUT', ruta, cuerpo),
  del: <T>(ruta: string) => pedir<T>('DELETE', ruta),
  async subirFoto(archivo: File): Promise<string> {
    if (archivo.size > 5 * 1024 * 1024) throw new ErrorApi(413, 'La imagen supera el límite de 5 MB.');
    const f = new FormData();
    f.append('archivo', archivo);
    return (await pedir<{ url: string }>('POST', '/archivos', f)).url;
  },
};
