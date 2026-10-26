import React, { useEffect, useState } from 'react';
import { MapPinned, Save } from 'lucide-react';
import { Pet } from '../types';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Campo, ErrorFormulario, Modal, BotonesFormulario, Seccion, claseInput } from './ui';
import SelectorUbicacion from './SelectorUbicacion';

/** Registrar o corregir el lugar donde se encontró un animal ya publicado. */
export default function ModalHallazgo({ mascota, onClose }: { mascota: Pet; onClose: () => void }) {
  const { addToast, recargar } = useTheme();
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [fecha, setFecha] = useState('');
  const [referencia, setReferencia] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ lat: number; lng: number; fecha: string | null; referencia: string } | null>(`/mascotas/${mascota.id}/hallazgo`)
      .then((h) => { if (h) { setPunto({ lat: h.lat, lng: h.lng }); setFecha(h.fecha ?? ''); setReferencia(h.referencia ?? ''); } })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar.'))
      .finally(() => setCargando(false));
  }, [mascota.id]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punto) return setError('Marca en el mapa el lugar donde se encontró.');
    setError(''); setEnviando(true);
    try {
      await api.put(`/mascotas/${mascota.id}/hallazgo`, { ...punto, fecha, referencia });
      await recargar();
      addToast('success', 'Lugar de hallazgo guardado', `Quedó registrado dónde se encontró a ${mascota.nombre}.`);
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo={`¿Dónde se encontró a ${mascota.nombre}?`} sobretitulo="Georreferenciación del rescate" subtitulo="La coordenada exacta solo la ve el equipo autorizado"
      icono={<MapPinned className="w-6 h-6 text-emerald-200" />} onClose={onClose}>
      <form onSubmit={guardar} className="p-5 sm:p-8 space-y-5">
        <ErrorFormulario mensaje={error} />
        {cargando ? <p className="text-sm text-gray-500">Cargando…</p> : (
          <Seccion titulo="Lugar del hallazgo">
            <SelectorUbicacion valor={punto} onChange={setPunto} />
            <Campo etiqueta="Fecha en que se encontró"><input type="date" max={new Date().toISOString().slice(0, 10)} value={fecha} onChange={(e) => setFecha(e.target.value)} className={claseInput} /></Campo>
            <Campo etiqueta="Referencia del lugar" ayuda="Esto sí se muestra en su hoja de vida (sin la coordenada)."><input maxLength={200} value={referencia} onChange={(e) => setReferencia(e.target.value)} className={claseInput} placeholder="Ej. Parque principal, barrio El Trébol" /></Campo>
          </Seccion>
        )}
        <BotonesFormulario onCancelar={onClose} texto="Guardar lugar" enviando={enviando} icono={<Save className="w-4 h-4" />} />
      </form>
    </Modal>
  );
}
