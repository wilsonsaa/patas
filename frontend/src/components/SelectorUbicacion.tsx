import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';
import { useCapasMapa } from '../mapa';

const MOSQUERA: [number, number] = [4.7060, -74.2300];
// Límites aceptados por el servidor (zona de la Sabana alrededor de Mosquera)
const LIMITES = { latMin: 4.3, latMax: 5.1, lngMin: -74.6, lngMax: -73.8 };
const icono = L.divIcon({
  className: '',
  html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:#e11d48;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:15px">🐾</span></div>',
  iconSize: [34, 34], iconAnchor: [17, 34],
});

export const dentroDeLimites = (lat: number, lng: number) =>
  lat >= LIMITES.latMin && lat <= LIMITES.latMax && lng >= LIMITES.lngMin && lng <= LIMITES.lngMax;

/** Mapa para marcar el punto exacto: clic o arrastrar el marcador, o usar la ubicación del celular. */
export default function SelectorUbicacion({ valor, onChange, alto = 'h-72' }: {
  valor: { lat: number; lng: number } | null; onChange: (p: { lat: number; lng: number }) => void; alto?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcador = useRef<L.Marker | null>(null);
  const capa = useRef<L.TileLayer | null>(null);
  const alCambiar = useRef(onChange);
  alCambiar.current = onChange;
  const [tipo, setTipo] = useState<'calles' | 'satelite'>('calles');
  const capas = useCapasMapa();
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState('');

  const poner = (lat: number, lng: number, centrar = false) => {
    if (!mapa.current) return;
    if (!dentroDeLimites(lat, lng)) { setAviso('Ese punto está fuera de la zona de Mosquera y alrededores.'); return; }
    setAviso('');
    if (!marcador.current) {
      marcador.current = L.marker([lat, lng], { icon: icono, draggable: true, keyboard: true }).addTo(mapa.current);
      marcador.current.on('dragend', () => { const p = marcador.current!.getLatLng(); poner(p.lat, p.lng); });
    } else marcador.current.setLatLng([lat, lng]);
    if (centrar) mapa.current.setView([lat, lng], 17);
    alCambiar.current({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
  };

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    mapa.current = L.map(contenedor.current, { zoomControl: true, attributionControl: true }).setView(valor ? [valor.lat, valor.lng] : MOSQUERA, valor ? 16 : 14);
    mapa.current.on('click', (e: L.LeafletMouseEvent) => poner(e.latlng.lat, e.latlng.lng));
    if (valor) poner(valor.lat, valor.lng);
    // el mapa vive dentro de una ventana emergente: recalcula su tamaño cuando termina de abrirse
    setTimeout(() => mapa.current?.invalidateSize(), 250);
    return () => { mapa.current?.remove(); mapa.current = null; marcador.current = null; capa.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapa.current) return;
    if (capa.current) mapa.current.removeLayer(capa.current);
    const c = (tipo === 'satelite' && capas.satelite) || capas.calles;
    capa.current = L.tileLayer(c.url, { attribution: c.attribution, maxZoom: 19 }).addTo(mapa.current);
  }, [tipo, capas]);

  const miUbicacion = () => {
    if (!navigator.geolocation) { setAviso('Este navegador no permite obtener la ubicación.'); return; }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBuscando(false); poner(p.coords.latitude, p.coords.longitude, true); },
      () => { setBuscando(false); setAviso('No pudimos obtener tu ubicación. Revisa el permiso del navegador o marca el punto en el mapa.'); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <button type="button" onClick={miUbicacion} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg cursor-pointer">
          {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} Usar mi ubicación actual
        </button>
        {capas.satelite && <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden text-xs font-bold">
          {(['calles', 'satelite'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTipo(t)} className={`px-3 py-2 cursor-pointer ${tipo === t ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'}`}>
              {t === 'calles' ? 'Calles' : 'Satélite'}
            </button>
          ))}
        </div>}
      </div>
      <div ref={contenedor} className={`${alto} w-full rounded-2xl overflow-hidden border border-gray-300 z-0`} aria-label="Mapa para marcar el lugar del hallazgo" />
      <p className="text-[11px] text-gray-500 mt-1.5">
        {valor ? `Punto marcado: ${valor.lat.toFixed(5)}, ${valor.lng.toFixed(5)}. Puedes arrastrar el marcador para ajustarlo.` : 'Toca el mapa en el lugar donde se encontró al animal.'}
      </p>
      {aviso && <p className="text-[11px] text-red-600 mt-1">{aviso}</p>}
    </div>
  );
}
