import React, { useState } from 'react';
import { Pet } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Heart, User, Home, Users, Scale } from 'lucide-react';
import { Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, Radicado, Seccion, SiNo, claseInput } from './ui';

interface ModalAdopcionProps {
  mascota: Pet;
  onClose: () => void;
}

export default function ModalAdopcion({ mascota, onClose }: ModalAdopcionProps) {
  const { usuarioActivo, submitSolicitud } = useTheme();

  const [f, setF] = useState({
    nombre: usuarioActivo.nombre, cedula: '', telefono: usuarioActivo.telefono, correo: usuarioActivo.correo,
    barrio: usuarioActivo.municipio === 'Mosquera, Cundinamarca' ? '' : usuarioActivo.municipio,
    tipoVivienda: 'Casa con patio', horasSoloAlDia: 4,
    detalleOtrasMascotas: '', edadesNinos: '', detalleAlergias: '', experienciaPrevia: '', motivoAdopcion: '',
  });
  // Las preguntas de Sí/No no vienen marcadas: la persona debe responder cada una.
  const [sn, setSn] = useState<Record<'todosEnCasaDeAcuerdo' | 'tieneOtrasMascotas' | 'hayNinos' | 'hayAlergias' | 'hayEmbarazo', boolean | null>>({
    todosEnCasaDeAcuerdo: null, tieneOtrasMascotas: null, hayNinos: null, hayAlergias: null, hayEmbarazo: null,
  });
  const [conoceLey, setConoceLey] = useState(false);
  const [radicado, setRadicado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(sn).some((v) => v === null)) return setError('Responde Sí o No en todas las preguntas sobre tu hogar.');
    if (!conoceLey) return setError('Debes declarar que conoces las responsabilidades de ley al adoptar una mascota.');
    setError(''); setEnviando(true);
    const creada = await submitSolicitud({ mascotaId: mascota.id, ...f, horasSoloAlDia: Number(f.horasSoloAlDia), ...sn, conoceResponsabilidadesLey: true });
    setEnviando(false);
    if (creada) setRadicado(creada.radicado);
  };

  return (
    <Modal titulo={`Postularme para adoptar a ${mascota.nombre}`} sobretitulo="Solicitud de adopción" subtitulo={`${mascota.hogarOrefugioNombre} • ${mascota.municipio}`}
      icono={<img src={mascota.fotos[0]} alt="" className="w-12 h-12 rounded-2xl object-cover" />} onClose={onClose}>
      {radicado ? (
        <Radicado titulo="¡Tu solicitud fue radicada!" radicado={radicado} onClose={onClose}>
          Recibimos tu postulación para adoptar a <strong>{mascota.nombre}</strong>. El equipo te contactará por teléfono o WhatsApp
          para agendar la entrevista o visita. Puedes seguir el estado en <strong>Mis solicitudes</strong>.
        </Radicado>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
          <ErrorFormulario mensaje={error} />

          <Seccion titulo="1. Datos personales" icono={<User className="w-4 h-4 text-emerald-600" />}>
            <Campo etiqueta="Nombre completo *"><input required minLength={3} maxLength={120} value={f.nombre} onChange={set('nombre')} className={claseInput} autoComplete="name" /></Campo>
            <Campo etiqueta="Número de cédula *"><input required inputMode="numeric" maxLength={20} value={f.cedula} onChange={set('cedula')} className={claseInput} placeholder="Ej. 1020345678" /></Campo>
            <Campo etiqueta="Teléfono / WhatsApp *"><input required type="tel" maxLength={20} value={f.telefono} onChange={set('telefono')} className={claseInput} placeholder="310 123 4567" autoComplete="tel" /></Campo>
            <Campo etiqueta="Correo electrónico *"><input required type="email" maxLength={160} value={f.correo} onChange={set('correo')} className={claseInput} autoComplete="email" /></Campo>
            <Campo etiqueta="Barrio o sector en Mosquera *" ancho><input required minLength={2} maxLength={120} value={f.barrio} onChange={set('barrio')} className={claseInput} placeholder="Ej. El Trébol, Porvenir Río, Ciudad Sabana…" /></Campo>
          </Seccion>

          <Seccion titulo="2. Tu vivienda" icono={<Home className="w-4 h-4 text-emerald-600" />}>
            <Campo etiqueta="Tipo de vivienda *">
              <select value={f.tipoVivienda} onChange={set('tipoVivienda')} className={claseInput}>
                <option value="Casa con patio">Casa con patio cerrado</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Finca">Finca o casa campestre</option>
                <option value="Casa sin patio">Casa sin patio</option>
              </select>
            </Campo>
            <Campo etiqueta="Horas al día que estaría solo(a)"><input type="number" min={0} max={24} value={f.horasSoloAlDia} onChange={(e) => setF({ ...f, horasSoloAlDia: Number(e.target.value) })} className={claseInput} /></Campo>
          </Seccion>

          <Seccion titulo="3. Tu núcleo familiar" icono={<Users className="w-4 h-4 text-emerald-600" />}>
            <SiNo pregunta="¿Hay niños o niñas en el hogar?" valor={sn.hayNinos} onChange={(v) => setSn({ ...sn, hayNinos: v })} />
            {sn.hayNinos && <Campo etiqueta="¿Qué edades tienen? *" ancho><input required maxLength={120} value={f.edadesNinos} onChange={set('edadesNinos')} className={claseInput} placeholder="Ej. 4 y 9 años" /></Campo>}

            <SiNo pregunta="¿Alguien del núcleo familiar tiene alergias?" ayuda="Al pelo de animales, asma u otras alergias respiratorias o de piel." valor={sn.hayAlergias} onChange={(v) => setSn({ ...sn, hayAlergias: v })} />
            {sn.hayAlergias && <Campo etiqueta="Cuéntanos cuál y quién la tiene *" ancho><input required maxLength={300} value={f.detalleAlergias} onChange={set('detalleAlergias')} className={claseInput} placeholder="Ej. Mi hijo tiene rinitis alérgica" /></Campo>}

            <SiNo pregunta="¿Hay mujeres en embarazo en el hogar?" valor={sn.hayEmbarazo} onChange={(v) => setSn({ ...sn, hayEmbarazo: v })} />

            <SiNo pregunta="¿Conviven otros animales en casa?" valor={sn.tieneOtrasMascotas} onChange={(v) => setSn({ ...sn, tieneOtrasMascotas: v })} />
            {sn.tieneOtrasMascotas && <Campo etiqueta="¿Cuáles? *" ancho><input required maxLength={300} value={f.detalleOtrasMascotas} onChange={set('detalleOtrasMascotas')} className={claseInput} placeholder="Ej. 1 perrita esterilizada de 4 años" /></Campo>}

            <SiNo pregunta="¿Todas las personas de la vivienda están de acuerdo con la adopción?" valor={sn.todosEnCasaDeAcuerdo} onChange={(v) => setSn({ ...sn, todosEnCasaDeAcuerdo: v })} />
          </Seccion>

          <Seccion titulo="4. Motivo" icono={<Heart className="w-4 h-4 text-emerald-600" />}>
            <Campo etiqueta={`¿Por qué deseas adoptar a ${mascota.nombre}? *`} ancho>
              <textarea required minLength={10} maxLength={1500} rows={3} value={f.motivoAdopcion} onChange={set('motivoAdopcion')} className={claseInput} placeholder="Cuéntanos sobre tu estilo de vida y qué te motivó a elegirlo(a)…" />
            </Campo>
            <Campo etiqueta="Experiencia previa con mascotas (opcional)" ancho><input maxLength={500} value={f.experienciaPrevia} onChange={set('experienciaPrevia')} className={claseInput} /></Campo>
          </Seccion>

          <Seccion titulo="5. Responsabilidades de ley" icono={<Scale className="w-4 h-4 text-emerald-600" />}>
            <div className="sm:col-span-2 text-xs text-gray-600 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
              <p>Al adoptar asumes obligaciones legales como tenedor responsable:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Ley 1774 de 2016:</strong> los animales son seres sintientes; el maltrato y el abandono se sancionan con multas y pueden constituir delito.</li>
                <li><strong>Ley 84 de 1989:</strong> debes garantizarle alimento, agua, abrigo, atención veterinaria y un espacio adecuado.</li>
                <li><strong>Ley 1801 de 2016</strong> (Código de Convivencia): llevarlo con correa en espacio público, recoger sus excrementos y mantener sus vacunas al día.</li>
              </ul>
            </div>
            <Casilla checked={conoceLey} onChange={setConoceLey}>
              <strong>Declaro que conozco y acepto las responsabilidades de ley</strong> que adquiero al adoptar una mascota, y acepto las visitas de seguimiento posteriores a la entrega.
            </Casilla>
          </Seccion>

          <BotonesFormulario onCancelar={onClose} texto="Enviar solicitud de adopción" enviando={enviando} icono={<Heart className="w-4 h-4 fill-white" />} />
        </form>
      )}
    </Modal>
  );
}
