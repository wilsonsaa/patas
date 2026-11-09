import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { Siren, Phone, ExternalLink, Save } from 'lucide-react';
import { api } from '../api';
import { obtenerCapas } from '../mapa';
import { claseInput } from './ui';

interface Reporte {
  id: string; radicado: string; especie: string; condicion: string; cantidad: number; descripcion: string; foto: string;
  lat: number; lng: number; referencia: string; nombre: string; telefono: string; correo: string; estado: string; notas: string;
  creado_en: string; atendido_por_nombre: string | null;
}
const ESTADOS = ['Nuevo', 'En atención', 'Rescatado', 'No encontrado', 'Cerrado'];
const COLOR: Record<string, string> = { Nuevo: '#e11d48', 'En atención': '#f59e0b', Rescatado: '#059669', 'No encontrado': '#6b7280', Cerrado: '#9ca3af' };
const URGENTE = ['Herido', 'Desnutrido o enfermo', 'Cachorros o crías'];
const esc = (t: unknown) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const fecha = (f: string) => new Date(f).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Reportes ciudadanos de animales abandonados: mapa + lista para atenderlos. */
export default function PanelReportes() {
  const { addToast } = useTheme();
  const [lista, setLista] = useState<Reporte[]>([]);
  const [filtro, setFiltro] = useState<'abiertos' | 'todos'>('abiertos');
  const [sel, setSel] = useState<string | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);

  const cargar = useCallback(() => api.get<Reporte[]>('/gestion/reportes').then(setLista).catch((e) => addToast('error', 'No se pudieron cargar los reportes', e.message)), [addToast]);
  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current).setView([4.706, -74.23], 14);
    mapa.current = m;
    obtenerCapas().then((c) => { if (mapa.current === m) L.tileLayer(c.calles.url, { attribution: c.calles.attribution, maxZoom: 19 }).addTo(m); });
    return () => { m.remove(); mapa.current = null; };
  }, []);

  const visibles = lista.filter((r) => filtro === 'todos' || ['Nuevo', 'En atención'].includes(r.estado));

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const capa = L.layerGroup().addTo(m);
    for (const r of visibles) {
      L.circleMarker([r.lat, r.lng], { radius: URGENTE.includes(r.condicion) ? 11 : 8, color: '#fff', weight: 2, fillColor: COLOR[r.estado], fillOpacity: 0.95 })
        .bindPopup(`<strong>${esc(r.radicado)}</strong> · ${esc(r.estado)}<br>${esc(r.cantidad)} ${esc(r.especie)} · ${esc(r.condicion)}<br><span style="color:#666">${esc(r.referencia || 'Sin referencia')}</span>`)
        .on('click', () => { setSel(r.id); document.getElementById(`rep-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); })
        .addTo(capa);
    }
    if (visibles.length) m.fitBounds(L.latLngBounds(visibles.map((r) => [r.lat, r.lng] as [number, number])).pad(0.25), { maxZoom: 16 });
    return () => { capa.remove(); };
  }, [visibles.map((r) => r.id + r.estado).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const nuevos = lista.filter((r) => r.estado === 'Nuevo').length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm text-gray-600"><strong className="text-rose-700">{nuevos} sin atender</strong> · {lista.length} reportes en total. Los puntos grandes son casos urgentes (heridos, enfermos o con crías).</p>
        <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden text-xs font-bold">
          {([['abiertos', 'Por atender'], ['todos', 'Todos']] as const).map(([v, t]) => (
            <button key={v} onClick={() => setFiltro(v)} className={`px-3.5 py-2 cursor-pointer ${filtro === v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div ref={contenedor} className="h-[45vh] min-h-[320px] w-full rounded-3xl overflow-hidden border border-gray-200 z-0 mb-4" aria-label="Mapa de reportes" />
      {visibles.length === 0 ? <p className="bg-white rounded-3xl border border-gray-200 p-8 text-sm text-gray-500 text-center">No hay reportes en esta vista.</p> : (
        <ul className="space-y-3">{visibles.map((r) => <Tarjeta key={r.id} r={r} activa={sel === r.id} onGuardado={cargar} />)}</ul>
      )}
    </div>
  );
}

function Tarjeta({ r, activa, onGuardado }: { r: Reporte; activa: boolean; onGuardado: () => void }) {
  const { addToast } = useTheme();
  const [estado, setEstado] = useState(r.estado);
  const [notas, setNotas] = useState(r.notas);
  const [guardando, setGuardando] = useState(false);
  const cambio = estado !== r.estado || notas !== r.notas;
  const guardar = async () => {
    setGuardando(true);
    try { await api.patch(`/gestion/reportes/${r.id}`, { estado, notas }); addToast('success', 'Reporte actualizado', `${r.radicado}: ${estado}`); onGuardado(); }
    catch (e) { addToast('error', 'No se pudo guardar', e instanceof Error ? e.message : ''); }
    finally { setGuardando(false); }
  };
  const tel = r.telefono.replace(/\D/g, '').slice(-10);
  return (
    <li id={`rep-${r.id}`} className={`bg-white rounded-2xl border p-4 grid sm:grid-cols-[96px_minmax(0,1fr)_240px] gap-4 ${activa ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'}`}>
      {r.foto ? <img src={r.foto} alt="" className="w-24 h-24 rounded-xl object-cover bg-gray-100" /> : <div className="w-24 h-24 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center"><Siren className="w-8 h-8" /></div>}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-gray-500">{r.radicado}</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: COLOR[r.estado] }}>{r.estado}</span>
          {URGENTE.includes(r.condicion) && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Urgente</span>}
          <span className="text-[11px] text-gray-400">{fecha(r.creado_en)}</span>
        </div>
        <p className="font-black text-gray-900 mt-1">{r.cantidad} {r.especie}{r.cantidad > 1 ? 's' : ''} · {r.condicion}</p>
        <p className="text-sm text-gray-700 mt-0.5">{r.descripcion}</p>
        <p className="text-xs text-gray-500 mt-1">{r.referencia || 'Sin referencia'} · <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 inline-flex items-center gap-0.5">Cómo llegar <ExternalLink className="w-3 h-3" /></a></p>
        <p className="text-xs text-gray-600 mt-1">Reportó <strong>{r.nombre}</strong> · <a href={`https://wa.me/57${tel}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 inline-flex items-center gap-1"><Phone className="w-3 h-3" />{r.telefono}</a>{r.correo ? ` · ${r.correo}` : ''}</p>
        {r.atendido_por_nombre && <p className="text-[11px] text-gray-400 mt-1">Última gestión: {r.atendido_por_nombre}</p>}
      </div>
      <div className="space-y-2">
        <select aria-label={`Estado de ${r.radicado}`} value={estado} onChange={(e) => setEstado(e.target.value)} className={claseInput}>{ESTADOS.map((s) => <option key={s}>{s}</option>)}</select>
        <textarea aria-label={`Notas de ${r.radicado}`} rows={2} maxLength={2000} value={notas} onChange={(e) => setNotas(e.target.value)} className={claseInput} placeholder="Notas de la atención" />
        <button disabled={!cambio || guardando} onClick={guardar} className="w-full text-xs font-bold text-white py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>
    </li>
  );
}
