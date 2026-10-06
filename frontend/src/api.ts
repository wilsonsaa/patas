// Cliente de la API de PATAS. La sesión viaja en una cookie httpOnly: el navegador
// la envía sola y el código de la página nunca puede leerla.
export class ErrorApi extends Error {
  constructor(public status: number, mensaje: string) { super(mensaje); }
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const esArchivo = cuerpo instanceof FormData;
  let r: Response;
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: {
        ...(metodo !== 'GET' ? { 'X-Patas': '1' } : {}),
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
  del: <T>(ruta: string) => pedir<T>('DELETE', ruta),
  async subirFoto(archivo: File): Promise<string> {
    if (archivo.size > 5 * 1024 * 1024) throw new ErrorApi(413, 'La imagen supera el límite de 5 MB.');
    const f = new FormData();
    f.append('archivo', archivo);
    return (await pedir<{ url: string }>('POST', '/archivos', f)).url;
  },
};
