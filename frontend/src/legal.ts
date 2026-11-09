import { useEffect, useState } from 'react';
import { obtenerConfig } from './api';

// Versión de la política. Los datos de contacto de la entidad NO están en el código:
// se configuran en el servidor con las variables ENTIDAD_* (ver DESPLIEGUE.md).
export const LEGAL = {
  encargado: 'HostAddrees (desarrollo y soporte técnico de la plataforma)',
  vigencia: '9 de noviembre de 2026',
  version: '1.1',
};

const PENDIENTE = '(pendiente de configurar)';
export interface Entidad { nombre: string; dependencia: string; direccion: string; correo: string; telefono: string; horario: string; lat?: number | null; lng?: number | null }

export function useEntidad(): Entidad {
  const [e, setE] = useState<Entidad>({ nombre: '', dependencia: '', direccion: '', correo: '', telefono: '', horario: '' });
  useEffect(() => { obtenerConfig().then((c) => c.entidad && setE(c.entidad)); }, []);
  return e;
}
export const o = (v: string) => v || PENDIENTE;
