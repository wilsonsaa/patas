import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Home, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, Radicado, Seccion, claseInput, SECTORES } from './ui';

export default function ModalRegistroHogar() {
  const { modalRegistroHogarAbierto, setModalRegistroHogarAbierto, usuarioActivo } = useTheme();
  const inicial = { nombre: '', responsable: usuarioActivo.nombre, telefono: usuarioActivo.telefono, sector: SECTORES[0], direccion: '', descripcion: '', capacidad: 2, horario: '' };
  const [f, setF] = useState(inicial);
  const [aceptaVisita, setAceptaVisita] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalRegistroHogarAbierto) return null;
  const cerrar = () => { setModalRegistroHogarAbierto(false); setCodigo(''); setF(inicial); setAceptaVisita(false); setError(''); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aceptaVisita) return setError('Debes aceptar la visita de verificación.');
    setError(''); setEnviando(true);
    try {
      const r = await api.post<{ codigo: string }>('/hogares', { ...f, capacidad: Number(f.capacidad), aceptaVisita: true });
      setCodigo(r.codigo);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo="Inscribir mi hogar de paso" sobretitulo="Red de hogares de paso" subtitulo="Brinda un techo seguro mientras encontramos su hogar definitivo"
      icono={<Home className="w-6 h-6 text-emerald-200" />} color="from-emerald-700 to-teal-800" ancho="max-w-xl" onClose={cerrar}>
      {codigo ? (
        <Radicado titulo="¡Inscripción recibida!" radicado={codigo} onClose={cerrar}>
          Tu hogar quedó identificado con el código <strong>{codigo}</strong>. La Dirección de Protección Animal te contactará para la
          visita de verificación; cuando sea aprobado podrás publicar mascotas. Públicamente solo se mostrará ese código.
        </Radicado>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
          <ErrorFormulario mensaje={error} />
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong>Tu ubicación es reservada.</strong> Por seguridad, tu hogar se identifica en la plataforma solo con un código
              (por ejemplo, HP-0012). La dirección, tu nombre y tu teléfono nunca se publican: únicamente los conoce la Dirección de
              Protección Animal para la visita de verificación.
            </span>
          </div>

          <Seccion titulo="Datos del hogar (reservados)">
            <Campo etiqueta="Nombre interno del hogar *" ancho ayuda="Solo lo ve la Dirección de Protección Animal."><input required minLength={3} maxLength={120} value={f.nombre} onChange={set('nombre')} className={claseInput} placeholder="Ej. Hogar familia Gómez" /></Campo>
            <Campo etiqueta="Persona responsable *"><input required minLength={3} maxLength={120} value={f.responsable} onChange={set('responsable')} className={claseInput} /></Campo>
            <Campo etiqueta="Teléfono / WhatsApp *"><input required type="tel" maxLength={20} value={f.telefono} onChange={set('telefono')} className={claseInput} /></Campo>
            <Campo etiqueta="Sector *">
              <select value={f.sector} onChange={set('sector')} className={claseInput}>{SECTORES.map((s) => <option key={s}>{s}</option>)}</select>
            </Campo>
            <Campo etiqueta="Dirección para la visita *"><input required minLength={5} maxLength={200} value={f.direccion} onChange={set('direccion')} className={claseInput} autoComplete="off" /></Campo>
          </Seccion>

          <Seccion titulo="Información que sí se publica">
            <Campo etiqueta="Animales que puedes acoger *"><input required type="number" min={1} max={50} value={f.capacidad} onChange={(e) => setF({ ...f, capacidad: Number(e.target.value) })} className={claseInput} /></Campo>
            <Campo etiqueta="Disponibilidad"><input maxLength={160} value={f.horario} onChange={set('horario')} className={claseInput} placeholder="Ej. Fines de semana" /></Campo>
            <Campo etiqueta="Descripción del espacio y cuidados" ancho ayuda="No incluyas direcciones, nombres ni teléfonos en este texto.">
              <textarea rows={3} maxLength={1000} value={f.descripcion} onChange={set('descripcion')} className={claseInput} placeholder="Patio amplio, experiencia con cachorros, tiempo para paseos…" />
            </Campo>
            <Casilla checked={aceptaVisita} onChange={setAceptaVisita}>
              Acepto que la Dirección de Protección Animal realice una <strong>visita de verificación</strong> antes de activar mi hogar,
              y autorizo el tratamiento de mis datos (Ley 1581 de 2012) para ese fin.
            </Casilla>
          </Seccion>

          <BotonesFormulario onCancelar={cerrar} texto="Enviar inscripción" enviando={enviando} icono={<CheckCircle2 className="w-4 h-4" />} />
        </form>
      )}
    </Modal>
  );
}
