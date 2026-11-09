import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Building2, Plus, Pencil, Save } from 'lucide-react';
import { api } from '../api';
import { BotonesFormulario, Campo, ErrorFormulario, Modal, Seccion, claseInput } from './ui';
import SelectorUbicacion from './SelectorUbicacion';

interface Refugio {
  id: string; codigo: string; nombre: string; responsable: string; telefono: string; correo: string; sector: string; direccion: string;
  descripcion: string; capacidad: number; horario: string; lat: number | null; lng: number | null; estado: string; ocupacion: number;
}
const VACIO = { nombre: '', responsable: '', telefono: '', correo: '', sector: '', direccion: '', descripcion: '', capacidad: 30, horario: '', estado: 'verificado' };

/** Refugios institucionales: la plataforma arranca sin ninguno y la administración los crea aquí. */
export default function PanelRefugios() {
  const { addToast, recargar } = useTheme();
  const [lista, setLista] = useState<Refugio[]>([]);
  const [editando, setEditando] = useState<Refugio | 'nuevo' | null>(null);
  const cargar = useCallback(() => api.get<Refugio[]>('/admin/refugios').then(setLista).catch((e) => addToast('error', 'No se pudo cargar', e.message)), [addToast]);
  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-600 max-w-2xl">Los refugios aparecen en el mapa público con su dirección y horario. Los animales se publican a nombre de un refugio o de un hogar de paso verificado.</p>
        <button onClick={() => setEditando('nuevo')} className="text-sm font-bold text-white px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>
          <Plus className="w-4 h-4" /> Nuevo refugio
        </button>
      </div>
      {lista.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-10 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">Aún no hay refugios.</p>
          <p className="text-xs text-gray-500 mt-1">Crea el refugio o centro de bienestar animal del municipio para poder publicar mascotas.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-gray-500">{r.codigo}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${r.estado === 'verificado' ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>{r.estado === 'verificado' ? 'Publicado' : 'Oculto'}</span>
              </div>
              <h4 className="font-black text-gray-900 mt-1">{r.nombre}</h4>
              <p className="text-xs text-gray-600 mt-1">{r.direccion}</p>
              <p className="text-xs text-gray-500 mt-1">{r.ocupacion} / {r.capacidad} animales · {r.lat != null ? 'Ubicado en el mapa' : 'Sin ubicación en el mapa'}</p>
              <button onClick={() => setEditando(r)} className="mt-3 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Editar</button>
            </div>
          ))}
        </div>
      )}
      {editando && <FormRefugio refugio={editando === 'nuevo' ? null : editando} onClose={() => setEditando(null)} onGuardado={() => { cargar(); recargar(); }} />}
    </div>
  );
}

function FormRefugio({ refugio, onClose, onGuardado }: { refugio: Refugio | null; onClose: () => void; onGuardado: () => void }) {
  const { addToast } = useTheme();
  const [f, setF] = useState(refugio ? { nombre: refugio.nombre, responsable: refugio.responsable, telefono: refugio.telefono, correo: refugio.correo, sector: refugio.sector,
    direccion: refugio.direccion, descripcion: refugio.descripcion, capacidad: refugio.capacidad, horario: refugio.horario, estado: refugio.estado } : VACIO);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(refugio?.lat != null && refugio.lng != null ? { lat: refugio.lat, lng: refugio.lng } : null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setEnviando(true);
    const cuerpo = { ...f, capacidad: Number(f.capacidad), lat: punto?.lat ?? null, lng: punto?.lng ?? null };
    try {
      if (refugio) await api.put(`/admin/refugios/${refugio.id}`, cuerpo); else await api.post('/admin/refugios', cuerpo);
      addToast('success', 'Refugio guardado', f.nombre);
      onGuardado(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo={refugio ? `Editar ${refugio.codigo}` : 'Nuevo refugio'} sobretitulo="Refugios institucionales" icono={<Building2 className="w-6 h-6 text-emerald-200" />} onClose={onClose}>
      <form onSubmit={guardar} className="p-5 sm:p-8 space-y-5">
        <ErrorFormulario mensaje={error} />
        <Seccion titulo="Información pública">
          <Campo etiqueta="Nombre *" ancho><input required minLength={3} maxLength={120} value={f.nombre} onChange={set('nombre')} className={claseInput} /></Campo>
          <Campo etiqueta="Dirección *" ancho><input required minLength={5} maxLength={200} value={f.direccion} onChange={set('direccion')} className={claseInput} /></Campo>
          <Campo etiqueta="Teléfono"><input type="tel" maxLength={20} value={f.telefono} onChange={set('telefono')} className={claseInput} /></Campo>
          <Campo etiqueta="Correo"><input type="email" maxLength={160} value={f.correo} onChange={set('correo')} className={claseInput} /></Campo>
          <Campo etiqueta="Horario de atención"><input maxLength={160} value={f.horario} onChange={set('horario')} className={claseInput} /></Campo>
          <Campo etiqueta="Responsable"><input maxLength={120} value={f.responsable} onChange={set('responsable')} className={claseInput} /></Campo>
          <Campo etiqueta="Capacidad (animales) *"><input required type="number" min={1} max={500} value={f.capacidad} onChange={set('capacidad')} className={claseInput} /></Campo>
          <Campo etiqueta="Visibilidad"><select value={f.estado} onChange={set('estado')} className={claseInput}><option value="verificado">Publicado</option><option value="suspendido">Oculto</option></select></Campo>
          <Campo etiqueta="Descripción" ancho><textarea rows={2} maxLength={1000} value={f.descripcion} onChange={set('descripcion')} className={claseInput} /></Campo>
        </Seccion>
        <Seccion titulo="Ubicación en el mapa">
          <SelectorUbicacion valor={punto} onChange={setPunto} />
        </Seccion>
        <BotonesFormulario onCancelar={onClose} texto="Guardar refugio" enviando={enviando} icono={<Save className="w-4 h-4" />} />
      </form>
    </Modal>
  );
}
