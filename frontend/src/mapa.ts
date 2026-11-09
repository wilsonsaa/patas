import { useEffect, useState } from 'react';
import { obtenerConfig } from './api';

// Mapas con Leaflet (licencia BSD-2) y teselas de OpenStreetMap (datos abiertos ODbL).
// No requieren clave ni pago. La capa satelital es opcional y se activa por variable de entorno.
export interface Capa { url: string; attribution: string }
export interface CapasMapa { calles: Capa; satelite: Capa | null }

export const CAPAS_POR_DEFECTO: CapasMapa = {
  calles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a>',
  },
  satelite: null,
};

export async function obtenerCapas(): Promise<CapasMapa> {
  const c = await obtenerConfig();
  return {
    calles: c.mapaTilesUrl ? { url: c.mapaTilesUrl, attribution: c.mapaAtribucion || '' } : CAPAS_POR_DEFECTO.calles,
    satelite: c.mapaSateliteUrl ? { url: c.mapaSateliteUrl, attribution: c.mapaSateliteAtribucion || '' } : null,
  };
}

export function useCapasMapa(): CapasMapa {
  const [capas, setCapas] = useState<CapasMapa>(CAPAS_POR_DEFECTO);
  useEffect(() => { obtenerCapas().then(setCapas); }, []);
  return capas;
}
