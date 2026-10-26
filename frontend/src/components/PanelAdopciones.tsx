import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { HeartHandshake, Phone, CalendarClock, AlertTriangle, Plus, X, History, Search } from 'lucide-react';
import { api } from '../api';
import { BotonesFormulario, Campo, ErrorFormulario, Modal, Seccion, claseInput } from './ui';

interface Adopcion {
  id: string; mascota_nombre: string; mascota_foto: string; adoptante_nombre: string; lugar_nombre: string; fecha: string;
  seguimiento: string; proxima_visita: string | null; radicado: string | null; telefono: string | null; correo: string | null;
  barrio: string | null; total_seguimientos: number; ultimo_seguimiento: string | null;
}
interface Seguimiento { id: string; fecha: string; tipo: string; estado: string; notas: string; proxima_visita: string | null; registrado_por: string | null }

const ESTADOS = ['En adaptación', 'Visita completada', 'Excelente', 'Requiere atención', 'Sin contacto', 'Cerrado'];
const COLOR: Record<string, string> = {
  'En adaptación': 'bg-sky-50 text-sky-800 border-sky-200', 'Visita completada': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Excelente: 'bg-emerald-100 text-emerald-900 border-emerald-300', 'Requiere atención': 'bg-rose-50 text-rose-800 border-rose-200',
  'Sin contacto': 'bg-amber-50 text-amber-800 border-amber-200', Cerrado: 'bg-gray-100 text-gray-600 border-gray-200',
};
const hoy = () => new Date().toISOString().slice(0, 10);
const fmt = (f?: string | null) => (f ? new Date(f.length === 10 ? f + 'T12:00:00' : f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const sumarDias = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

/** Seguimiento posterior a la adopción: quién adoptó, cuándo se le visitó y cuándo toca la próxima visita. */
export default function PanelAdopciones() {
  const { addToast } = useTheme();
  const [lista, setLista] = useState<Adopcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'pendientes' | 'activas' | 'todas'>('activas');
  const [buscar, setBuscar] = useState('');
  const [abierta, setAbierta] = useState<Adopcion | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setLista(await api.get<Adopcion[]>('/gestion/adopciones')); }
    catch (e) { addToast('error', 'No se pudieron cargar las adopciones', e instanceof Error ? e.message : ''); }
    finally { setCargando(false); }
  }, [addToast]);
  useEffect(() => { cargar(); }, [cargar]);

  const vencida = (a: Adopcion) => a.seguimiento !== 'Cerrado' && !!a.proxima_visita && a.proxima_visita <= hoy();
  const visibles = useMemo(() => lista.filter((a) =>
    (filtro === 'todas' || (filtro === 'activas' ? a.seguimiento !== 'Cerrado' : vencida(a) || a.seguimiento === 'Requiere atención')) &&
    `${a.mascota_nombre} ${a.adoptante_nombre} ${a.radicado ?? ''} ${a.telefono ?? ''}`.toLowerCase().includes(buscar.toLowerCase())), [lista, filtro, buscar]);
  const cifras = {
    activas: lista.filter((a) => a.seguimiento !== 'Cerrado').length,
    vencidas: lista.filter(vencida).length,
    atencion: lista.filter((a) => a.seguimiento === 'Requiere atención').length,
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['En seguimiento', cifras.activas, 'text-emerald-700'], ['Visitas vencidas', cifras.vencidas, 'text-amber-600'], ['Requieren atención', cifras.atencion, 'text-rose-600']].map(([t, n, c]) => (
          <div key={t as string} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className={`text-2xl sm:text-3xl font-black font-heading ${c}`}>{n}</p>
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500">{t}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por mascota, adoptante, radicado o teléfono" className={`${claseInput} pl-9`} />
        </div>
        <div className="inline-flex rounded-xl border border-gray-300 overflow-hidden text-xs font-bold self-start">
          {([['pendientes', 'Por atender'], ['activas', 'Activas'], ['todas', 'Todas']] as const).map(([v, t]) => (
            <button key={v} onClick={() => setFiltro(v)} className={`px-3.5 py-2.5 cursor-pointer ${filtro === v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>

      {cargando ? <p className="p-8 text-sm text-gray-500">Cargando…</p> : visibles.length === 0 ? (
        <p className="bg-white rounded-3xl border border-gray-200 p-8 text-sm text-gray-500 text-center">No hay adopciones en esta vista.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((a) => (
            <li key={a.id} className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${vencida(a) ? 'border-amber-300' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {a.mascota_foto ? <img src={a.mascota_foto} alt="" className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0" /> : <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0">🐾</div>}
                <div className="min-w-0">
                  <p className="font-black text-gray-900">{a.mascota_nombre} <span className="font-normal text-gray-500 text-sm">con</span> {a.adoptante_nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{a.radicado ?? 'Sin radicado'} · Adoptado el {fmt(a.fecha)} · {a.lugar_nombre}</p>
                  {a.telefono && <a href={`https://wa.me/57${a.telefono.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{a.telefono}{a.barrio ? ` · ${a.barrio}` : ''}</a>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${COLOR[a.seguimiento] ?? COLOR.Cerrado}`}>{a.seguimiento}</span>
                {a.seguimiento !== 'Cerrado' && (
                  <span className={`text-[11px] font-bold inline-flex items-center gap-1 ${vencida(a) ? 'text-amber-700' : 'text-gray-500'}`}>
                    {vencida(a) ? <AlertTriangle className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
                    {a.proxima_visita ? `Próxima: ${fmt(a.proxima_visita)}` : 'Sin próxima visita'}
                  </span>
                )}
                <button onClick={() => setAbierta(a)} className="text-xs font-bold text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>
                  <History className="w-4 h-4" /> Seguimiento ({a.total_seguimientos})
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {abierta && <ModalSeguimiento adopcion={abierta} onClose={() => setAbierta(null)} onGuardado={cargar} />}
    </div>
  );
}

function ModalSeguimiento({ adopcion, onClose, onGuardado }: { adopcion: Adopcion; onClose: () => void; onGuardado: () => void }) {
  const { addToast } = useTheme();
  const [historial, setHistorial] = useState<Seguimiento[]>([]);
  const [formulario, setFormulario] = useState(false);
  const [f, setF] = useState({ fecha: hoy(), tipo: 'Visita', estado: 'Visita completada', notas: '', proximaVisita: sumarDias(30) });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const cargar = useCallback(() => api.get<Seguimiento[]>(`/gestion/adopciones/${adopcion.id}/seguimientos`).then(setHistorial).catch(() => {}), [adopcion.id]);
  useEffect(() => { cargar(); }, [cargar]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      await api.post(`/gestion/adopciones/${adopcion.id}/seguimientos`, { ...f, proximaVisita: f.estado === 'Cerrado' ? '' : f.proximaVisita });
      addToast('success', 'Seguimiento registrado', `Quedó en el historial de ${adopcion.mascota_nombre}.`);
      setFormulario(false); setF({ ...f, notas: '' });
      await cargar(); onGuardado();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo={`${adopcion.mascota_nombre} y ${adopcion.adoptante_nombre.split(' ')[0]}`} sobretitulo={`Seguimiento post-adopción · ${adopcion.radicado ?? ''}`}
      subtitulo={`Adoptado el ${fmt(adopcion.fecha)}`} icono={<HeartHandshake className="w-6 h-6 text-emerald-200" />} onClose={onClose}>
      <div className="p-5 sm:p-8 space-y-5">
        {!formulario ? (
          <button onClick={() => setFormulario(true)} className="w-full py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 cursor-pointer">
            <Plus className="w-4 h-4" /> Registrar visita, llamada o reporte
          </button>
        ) : (
          <form onSubmit={guardar} className="space-y-4 bg-gray-50 rounded-2xl border border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-black text-gray-900">Nuevo seguimiento</p>
              <button type="button" onClick={() => setFormulario(false)} aria-label="Cancelar" className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <ErrorFormulario mensaje={error} />
            <Seccion titulo="Detalle">
              <Campo etiqueta="Fecha *"><input required type="date" max={hoy()} value={f.fecha} onChange={set('fecha')} className={claseInput} /></Campo>
              <Campo etiqueta="Tipo *"><select value={f.tipo} onChange={set('tipo')} className={claseInput}>{['Visita', 'Llamada', 'Mensaje', 'Fotos o video'].map((t) => <option key={t}>{t}</option>)}</select></Campo>
              <Campo etiqueta="¿Cómo está? *"><select value={f.estado} onChange={set('estado')} className={claseInput}>{ESTADOS.map((t) => <option key={t}>{t}</option>)}</select></Campo>
              {f.estado !== 'Cerrado' && <Campo etiqueta="Próxima visita"><input type="date" min={sumarDias(1)} value={f.proximaVisita} onChange={set('proximaVisita')} className={claseInput} /></Campo>}
              <Campo etiqueta="Observaciones *" ancho><textarea required minLength={3} maxLength={2000} rows={3} value={f.notas} onChange={set('notas')} className={claseInput} placeholder="Estado de salud, adaptación, condiciones del hogar, compromisos…" /></Campo>
            </Seccion>
            <BotonesFormulario onCancelar={() => setFormulario(false)} texto="Guardar seguimiento" enviando={enviando} icono={<Plus className="w-4 h-4" />} />
          </form>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Historial</p>
          {historial.length === 0 ? <p className="text-sm text-gray-500">Aún no hay seguimientos registrados.</p> : (
            <ol className="relative border-l-2 border-emerald-100 ml-2 space-y-4">
              {historial.map((g) => (
                <li key={g.id} className="pl-5 relative">
                  <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{g.tipo} · {fmt(g.fecha)}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${COLOR[g.estado] ?? COLOR.Cerrado}`}>{g.estado}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{g.notas}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{g.registrado_por ?? ''}{g.proxima_visita ? ` · Próxima visita: ${fmt(g.proxima_visita)}` : ''}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  );
}
