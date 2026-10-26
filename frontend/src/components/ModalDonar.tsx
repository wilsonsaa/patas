import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { HandHeart } from 'lucide-react';
import { api } from '../api';
import { AvisoDatos, Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, Radicado, Seccion, claseInput } from './ui';

const TIPOS = [
  ['Alimento', '🥫'], ['Medicamentos e insumos', '💊'], ['Cobijas y accesorios', '🧣'],
  ['Elementos de aseo', '🧴'], ['Tiempo o voluntariado', '🤝'], ['Otro', '🎁'],
] as const;

export default function ModalDonar() {
  const { modalDonarAbierto, setModalDonarAbierto, usuarioActivo, autenticado } = useTheme();
  const inicial = { nombre: autenticado ? usuarioActivo.nombre : '', telefono: usuarioActivo.telefono, correo: usuarioActivo.correo, tipo: 'Alimento', descripcion: '' };
  const [f, setF] = useState(inicial);
  const [acepta, setAcepta] = useState(false);
  const [radicado, setRadicado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalDonarAbierto) return null;
  const cerrar = () => { setModalDonarAbierto(false); setRadicado(''); setF(inicial); setAcepta(false); setError(''); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acepta) return setError('Debes autorizar el tratamiento de datos para que podamos contactarte.');
    setError(''); setEnviando(true);
    try { setRadicado((await api.post<{ radicado: string }>('/donaciones', { ...f, aceptaDatos: true })).radicado); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo="Quiero donar" sobretitulo="Apoya a los animales rescatados" subtitulo="Cuéntanos cómo quieres ayudar y te contactamos"
      icono={<HandHeart className="w-6 h-6 text-rose-100" />} color="from-rose-600 to-orange-500" ancho="max-w-xl" onClose={cerrar}>
      {radicado ? (
        <Radicado titulo="¡Gracias por tu generosidad!" radicado={radicado} onClose={cerrar}>
          Registramos tu intención de donar. La Dirección de Protección Animal te contactará para coordinar la entrega.
          <strong> La plataforma no recibe dinero: solo donaciones en especie y voluntariado.</strong>
        </Radicado>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
          <ErrorFormulario mensaje={error} />
          <Seccion titulo="¿Qué quieres donar?">
            <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de donación">
              {TIPOS.map(([tipo, emoji]) => (
                <button key={tipo} type="button" role="radio" aria-checked={f.tipo === tipo} onClick={() => setF({ ...f, tipo })}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer ${f.tipo === tipo ? 'bg-rose-600 border-rose-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                  <span className="block text-lg mb-0.5" aria-hidden="true">{emoji}</span>{tipo}
                </button>
              ))}
            </div>
            <Campo etiqueta="Describe tu donación *" ancho>
              <textarea required minLength={5} maxLength={1000} rows={3} value={f.descripcion} onChange={set('descripcion')} className={claseInput} placeholder="Ej. 2 bultos de concentrado para adulto, puedo llevarlos el sábado" />
            </Campo>
          </Seccion>
          <Seccion titulo="¿Cómo te contactamos?">
            <Campo etiqueta="Nombre *"><input required minLength={3} maxLength={120} value={f.nombre} onChange={set('nombre')} className={claseInput} autoComplete="name" /></Campo>
            <Campo etiqueta="Teléfono / WhatsApp *"><input required type="tel" maxLength={20} value={f.telefono} onChange={set('telefono')} className={claseInput} autoComplete="tel" /></Campo>
            <Campo etiqueta="Correo (opcional)" ancho><input type="email" maxLength={160} value={f.correo} onChange={set('correo')} className={claseInput} autoComplete="email" /></Campo>
            <Casilla checked={acepta} onChange={setAcepta}><AvisoDatos /></Casilla>
          </Seccion>
          <BotonesFormulario onCancelar={cerrar} texto="Registrar mi donación" enviando={enviando} icono={<HandHeart className="w-4 h-4" />} />
        </form>
      )}
    </Modal>
  );
}
