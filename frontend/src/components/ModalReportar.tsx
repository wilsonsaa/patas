import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Siren, MapPin, PawPrint, User, Send, Phone, ExternalLink } from 'lucide-react';
import { api } from '../api';
import { useEntidad } from '../legal';
import { AvisoDatos, Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, Seccion, SubirFoto, claseInput } from './ui';
import SelectorUbicacion from './SelectorUbicacion';
import { IconoWhatsApp } from './BotonWhatsApp';

const CONDICIONES = ['Aparentemente sano', 'Herido', 'Desnutrido o enfermo', 'Cachorros o crías', 'Agresivo o asustado'];

/** Reporte ciudadano de un animal abandonado, herido o en riesgo, con su ubicación exacta. */
export default function ModalReportar() {
  const { modalReportarAbierto, setModalReportarAbierto, usuarioActivo, autenticado, whatsappBienestar } = useTheme();
  const ent = useEntidad();
  const inicial = { especie: 'perro', condicion: CONDICIONES[0], cantidad: 1, descripcion: '', foto: '', referencia: '',
    nombre: autenticado ? usuarioActivo.nombre : '', telefono: usuarioActivo.telefono, correo: usuarioActivo.correo };
  const [f, setF] = useState(inicial);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [enviado, setEnviado] = useState<{ radicado: string; lat: number; lng: number; mapa: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalReportarAbierto) return null;
  const cerrar = () => { setModalReportarAbierto(false); setEnviado(null); setF(inicial); setPunto(null); setAcepta(false); setError(''); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punto) return setError('Marca en el mapa dónde está el animal, o usa tu ubicación actual.');
    if (!acepta) return setError('Debes autorizar el tratamiento de datos para que podamos contactarte.');
    setError(''); setEnviando(true);
    try {
      const r = await api.post<{ radicado: string; lat: number; lng: number; mapa: string }>('/reportes', { ...f, cantidad: Number(f.cantidad), ...punto, aceptaDatos: true });
      setEnviado(r);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.'); }
    finally { setEnviando(false); }
  };

  const mensaje = enviado ? `Hola, hice el reporte ${enviado.radicado} en PATAS de ${f.cantidad > 1 ? `${f.cantidad} animales` : 'un animal'} (${f.especie}, ${f.condicion.toLowerCase()}). Ubicación: ${enviado.mapa}` : '';

  return (
    <Modal titulo="Reportar un animal abandonado" sobretitulo="Animal en riesgo" subtitulo="Marca dónde está y avisamos de inmediato a la Dirección de Protección Animal"
      icono={<Siren className="w-6 h-6 text-amber-100" />} color="from-amber-600 to-rose-600" onClose={cerrar}>
      {enviado ? (
        <div className="p-5 sm:p-8 space-y-5">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-gray-900 font-heading">¡Gracias por avisar!</h3>
            <p className="inline-block font-mono text-sm font-bold bg-gray-100 border border-gray-200 rounded-xl px-4 py-2">Radicado {enviado.radicado}</p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">El reporte ya llegó a la Dirección de Protección Animal. Esta es la ubicación que enviaste:</p>
          </div>
          <SelectorUbicacion valor={{ lat: enviado.lat, lng: enviado.lng }} onChange={() => {}} alto="h-56" soloLectura />
          <a href={enviado.mapa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700"><ExternalLink className="w-3.5 h-3.5" /> Abrir en Google Maps</a>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-900">Comunícate con la Dirección de Protección Animal</p>
            <p className="text-xs text-gray-600">Si el animal está herido o en peligro, escríbeles ahora para agilizar la atención. El mensaje ya lleva tu radicado y la ubicación.</p>
            {whatsappBienestar && (
              <a href={`https://wa.me/${whatsappBienestar}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm">
                <IconoWhatsApp className="w-5 h-5" /> Escribir por WhatsApp
              </a>
            )}
            {ent.telefono && <p className="text-sm text-gray-700 flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> {ent.telefono}</p>}
            {ent.direccion && <p className="text-xs text-gray-500">{ent.direccion}{ent.horario ? ` · ${ent.horario}` : ''}</p>}
          </div>
          <button onClick={cerrar} className="w-full py-3 rounded-xl font-bold text-sm text-white cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>Listo</button>
        </div>
      ) : (
        <form onSubmit={enviar} className="p-5 sm:p-8 space-y-5">
          <ErrorFormulario mensaje={error} />
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 leading-relaxed">
            Si presencias un caso de <strong>maltrato animal</strong> en curso, llama también a la Policía (línea 123). Este reporte es para animales abandonados, perdidos, heridos o en riesgo en Mosquera.
          </div>
          <Seccion titulo="1. ¿Dónde está?" icono={<MapPin className="w-4 h-4 text-rose-600" />}>
            <SelectorUbicacion valor={punto} onChange={setPunto} />
            <Campo etiqueta="Referencia del lugar" ancho ayuda="Barrio, calle, un negocio cercano… ayuda a encontrarlo más rápido.">
              <input maxLength={200} value={f.referencia} onChange={set('referencia')} className={claseInput} placeholder="Ej. Frente al parque principal, Cra 4 con Calle 3" />
            </Campo>
          </Seccion>
          <Seccion titulo="2. ¿Cómo está?" icono={<PawPrint className="w-4 h-4 text-rose-600" />}>
            <Campo etiqueta="Especie *"><select value={f.especie} onChange={set('especie')} className={claseInput}><option value="perro">Perro</option><option value="gato">Gato</option><option value="otro">Otro</option></select></Campo>
            <Campo etiqueta="Estado aparente *"><select value={f.condicion} onChange={set('condicion')} className={claseInput}>{CONDICIONES.map((c) => <option key={c}>{c}</option>)}</select></Campo>
            <Campo etiqueta="¿Cuántos animales?"><input type="number" min={1} max={30} value={f.cantidad} onChange={set('cantidad')} className={claseInput} /></Campo>
            <Campo etiqueta="Describe lo que viste *" ancho><textarea required minLength={10} maxLength={1000} rows={3} value={f.descripcion} onChange={set('descripcion')} className={claseInput} placeholder="Color, tamaño, si tiene collar, desde cuándo está ahí, si está herido…" /></Campo>
            <SubirFoto valor={f.foto} onChange={(foto) => setF({ ...f, foto })} etiqueta="Foto (opcional, ayuda mucho)" />
          </Seccion>
          <Seccion titulo="3. ¿Cómo te contactamos?" icono={<User className="w-4 h-4 text-rose-600" />}>
            <Campo etiqueta="Nombre *"><input required minLength={3} maxLength={120} value={f.nombre} onChange={set('nombre')} className={claseInput} autoComplete="name" /></Campo>
            <Campo etiqueta="Teléfono / WhatsApp *"><input required type="tel" maxLength={20} value={f.telefono} onChange={set('telefono')} className={claseInput} autoComplete="tel" /></Campo>
            <Campo etiqueta="Correo (opcional)" ancho ayuda="Te avisamos por correo cuando el caso cambie de estado."><input type="email" maxLength={160} value={f.correo} onChange={set('correo')} className={claseInput} autoComplete="email" /></Campo>
            <Casilla checked={acepta} onChange={setAcepta}><AvisoDatos /></Casilla>
          </Seccion>
          <BotonesFormulario onCancelar={cerrar} texto="Enviar reporte" enviando={enviando} icono={<Send className="w-4 h-4" />} />
        </form>
      )}
    </Modal>
  );
}
