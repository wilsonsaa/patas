import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api';

interface Punto { id: string; nombre: string; especie: string; estado: string; foto: string | null; lat: number; lng: number; fecha: string | null; referencia: string; lugar_codigo: string; lugar_tipo: string; lugar_nombre: string }
const esc = (t: unknown) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Mapa de los lugares donde se encontraron los animales: ayuda a ubicar los puntos críticos de abandono. */
export default function PanelHallazgos() {
  const { addToast } = useTheme();
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [especie, setEspecie] = useState<'todas' | 'perro' | 'gato'>('todas');

  useEffect(() => {
    api.get<Punto[]>('/gestion/hallazgos').then(setPuntos).catch((e) => addToast('error', 'No se pudo cargar el mapa', e instanceof Error ? e.message : ''));
  }, [addToast]);

  useEffect(() => {
    if (!contenedor.current) return;
    mapa.current = L.map(contenedor.current).setView([4.706, -74.23], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; colaboradores de OpenStreetMap', maxZoom: 19 }).addTo(mapa.current);
    return () => { mapa.current?.remove(); mapa.current = null; };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const capa = L.layerGroup().addTo(m);
    const visibles = puntos.filter((p) => especie === 'todas' || p.especie === especie);
    for (const p of visibles) {
      L.circleMarker([p.lat, p.lng], { radius: 9, color: '#fff', weight: 2, fillColor: p.especie === 'gato' ? '#f59e0b' : '#e11d48', fillOpacity: 0.9 })
        .bindPopup(`<div style="min-width:170px">${p.foto ? `<img src="${esc(p.foto)}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px">` : ''}
          <strong>${esc(p.nombre)}</strong> · ${esc(p.estado)}<br><span style="color:#555">${esc(p.referencia || 'Sin referencia')}</span><br>
          <span style="color:#888;font-size:11px">${p.fecha ? esc(p.fecha) + ' · ' : ''}${esc(p.lugar_tipo === 'hogar_paso' ? 'Hogar ' + p.lugar_codigo : p.lugar_nombre)}</span></div>`)
        .addTo(capa);
    }
    if (visibles.length) m.fitBounds(L.latLngBounds(visibles.map((p) => [p.lat, p.lng] as [number, number])).pad(0.25), { maxZoom: 16 });
    return () => { capa.remove(); };
  }, [puntos, especie]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm text-gray-600">
          <strong>{puntos.length}</strong> animales con lugar de hallazgo registrado. Para registrar uno, abre la hoja de vida del animal y elige «Georreferenciar».
        </p>
        <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden text-xs font-bold">
          {([['todas', 'Todos'], ['perro', '🐶 Perros'], ['gato', '🐱 Gatos']] as const).map(([v, t]) => (
            <button key={v} onClick={() => setEspecie(v)} className={`px-3.5 py-2 cursor-pointer ${especie === v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div ref={contenedor} className="h-[65vh] min-h-[420px] w-full rounded-3xl overflow-hidden border border-gray-200 z-0" aria-label="Mapa de lugares de hallazgo" />
      <p className="text-[11px] text-gray-500 mt-2">Rojo: perros · Ámbar: gatos. Información reservada para el equipo autorizado.</p>
    </div>
  );
}
