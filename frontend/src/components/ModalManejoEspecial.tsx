import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, Dog, FileCheck2 } from 'lucide-react';
import { api } from '../api';
import { Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, Radicado, Seccion, SiNo, SubirFoto, claseInput } from './ui';
import Propietario from './Propietario';

// Art. 126 de la Ley 1801 de 2016 (Código Nacional de Seguridad y Convivencia Ciudadana)
export const RAZAS_MANEJO_ESPECIAL = [
  'American Staffordshire Terrier', 'Bullmastiff', 'Dóberman', 'Dogo Argentino', 'Dogo de Burdeos', 'Fila Brasileiro',
  'Mastín Napolitano', 'Bull Terrier', 'Pit Bull Terrier', 'American Pit Bull Terrier', 'De Presa Canario', 'Rottweiler',
  'Staffordshire Terrier', 'Tosa Japonés',
];

const CATEGORIAS = [
  ['raza', 'Pertenece a una de las razas de manejo especial'],
  ['cruce', 'Es cruce o híbrido de una de esas razas'],
  ['antecedente_agresion', 'Ha tenido episodios de agresión a personas o ha causado la muerte a otros perros'],
  ['adiestrado_ataque', 'Fue adiestrado para ataque y defensa'],
] as const;

export default function ModalManejoEspecial() {
  const { modalManejoEspecialAbierto, setModalManejoEspecialAbierto, usuarioActivo } = useTheme();
  const inicial = {
    propNombre: usuarioActivo.nombre, propTipoDoc: 'CC', propNumDoc: '', propTelefono: usuarioActivo.telefono, propCorreo: usuarioActivo.correo,
    propDireccion: '', propBarrio: '',
    nombre: '', categoria: 'raza', raza: RAZAS_MANEJO_ESPECIAL[0], sexo: 'Macho', edadTexto: '', color: '', senas: '', microchipNumero: '', foto: '',
    residencia: '', destino: 'convivencia', polizaAseguradora: '', polizaNumero: '', polizaVigencia: '', antirrabicaFecha: '',
  };
  const [f, setF] = useState(inicial);
  const [polizaTiene, setPolizaTiene] = useState<boolean | null>(null);
  const [vacunasVigentes, setVacunasVigentes] = useState<boolean | null>(null);
  const [mayorEdad, setMayorEdad] = useState(false);
  const [veraz, setVeraz] = useState(false);
  const [radicado, setRadicado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalManejoEspecialAbierto) return null;
  const cerrar = () => { setModalManejoEspecialAbierto(false); setRadicado(''); setF(inicial); setPolizaTiene(null); setVacunasVigentes(null); setMayorEdad(false); setVeraz(false); setError(''); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const porRaza = f.categoria === 'raza' || f.categoria === 'cruce';
  const hoy = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (polizaTiene === null || vacunasVigentes === null) return setError('Responde Sí o No sobre la póliza y las vacunas.');
    if (!mayorEdad) return setError('El registro debe hacerlo una persona mayor de edad.');
    if (!veraz) return setError('Debes declarar que la información es veraz.');
    setError(''); setEnviando(true);
    try {
      const r = await api.post<{ radicado: string }>('/manejo-especial', { ...f, polizaTiene, vacunasVigentes, propMayorEdad: true, declaraVeracidad: true });
      setRadicado(r.radicado);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo="Registro de caninos de manejo especial" sobretitulo="Ley 1801 de 2016 · artículos 126 a 128" subtitulo="Inscripción en el censo municipal de ejemplares de manejo especial"
      icono={<ShieldAlert className="w-6 h-6 text-amber-100" />} color="from-amber-600 to-orange-700" onClose={cerrar}>
      {radicado ? (
        <Radicado titulo="¡Solicitud de registro radicada!" radicado={radicado} onClose={cerrar}>
          La Dirección de Protección Animal revisará la información de <strong>{f.nombre}</strong> y te contactará para validar los
          soportes (póliza y carné de vacunación){polizaTiene ? '' : '. Recuerda que debes constituir la póliza de responsabilidad civil para completar el registro'}.
        </Radicado>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
          <ErrorFormulario mensaje={error} />
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            Quien tenga un canino de manejo especial debe <strong>registrarlo en el censo de la alcaldía</strong>, contar con póliza de
            responsabilidad civil extracontractual y llevarlo en espacio público con <strong>traílla y bozal</strong>, conducido por una
            persona mayor de edad.
          </div>

          <Propietario f={f} setF={setF} />

          <Seccion titulo="2. Datos del ejemplar" icono={<Dog className="w-4 h-4 text-amber-600" />}>
            <Campo etiqueta="¿Por qué es de manejo especial? *" ancho>
              <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value, raza: e.target.value === 'raza' || e.target.value === 'cruce' ? RAZAS_MANEJO_ESPECIAL[0] : '' })} className={claseInput}>
                {CATEGORIAS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Nombre del ejemplar *"><input required maxLength={60} value={f.nombre} onChange={set('nombre')} className={claseInput} /></Campo>
            <Campo etiqueta={f.categoria === 'cruce' ? 'Raza predominante del cruce *' : 'Raza *'}>
              {porRaza ? (
                <select value={f.raza} onChange={set('raza')} className={claseInput}>{RAZAS_MANEJO_ESPECIAL.map((r) => <option key={r}>{r}</option>)}</select>
              ) : (
                <input required minLength={2} maxLength={80} value={f.raza} onChange={set('raza')} className={claseInput} placeholder="Ej. Criollo, Pastor Alemán…" />
              )}
            </Campo>
            <Campo etiqueta="Sexo *"><select value={f.sexo} onChange={set('sexo')} className={claseInput}><option>Macho</option><option>Hembra</option></select></Campo>
            <Campo etiqueta="Edad"><input maxLength={40} value={f.edadTexto} onChange={set('edadTexto')} className={claseInput} placeholder="Ej. 3 años" /></Campo>
            <Campo etiqueta="Color"><input maxLength={60} value={f.color} onChange={set('color')} className={claseInput} /></Campo>
            <Campo etiqueta="Número de microchip (si tiene)"><input maxLength={30} value={f.microchipNumero} onChange={set('microchipNumero')} className={claseInput} /></Campo>
            <Campo etiqueta="Características físicas que lo identifican" ancho><input maxLength={300} value={f.senas} onChange={set('senas')} className={claseInput} placeholder="Manchas, cicatrices, orejas, cola…" /></Campo>
            <SubirFoto valor={f.foto} onChange={(foto) => setF({ ...f, foto })} etiqueta="Foto del ejemplar" />
          </Seccion>

          <Seccion titulo="3. Residencia y soportes" icono={<FileCheck2 className="w-4 h-4 text-amber-600" />}>
            <Campo etiqueta="Lugar habitual de residencia del animal *" ancho><input required minLength={5} maxLength={200} value={f.residencia} onChange={set('residencia')} className={claseInput} placeholder="Dirección donde vive el ejemplar" /></Campo>
            <Campo etiqueta="Destinación *" ancho>
              <select value={f.destino} onChange={set('destino')} className={claseInput}>
                <option value="convivencia">Convive con personas (animal de compañía)</option>
                <option value="guarda">Guarda, protección u otra tarea específica</option>
              </select>
            </Campo>
            <SiNo pregunta="¿Tiene póliza de responsabilidad civil extracontractual vigente?" valor={polizaTiene} onChange={setPolizaTiene} />
            {polizaTiene && (
              <>
                <Campo etiqueta="Aseguradora *"><input required maxLength={120} value={f.polizaAseguradora} onChange={set('polizaAseguradora')} className={claseInput} /></Campo>
                <Campo etiqueta="Número de póliza *"><input required maxLength={60} value={f.polizaNumero} onChange={set('polizaNumero')} className={claseInput} /></Campo>
                <Campo etiqueta="Vigente hasta *"><input required type="date" min={hoy} value={f.polizaVigencia} onChange={set('polizaVigencia')} className={claseInput} /></Campo>
              </>
            )}
            <SiNo pregunta="¿Tiene el esquema de vacunación vigente?" valor={vacunasVigentes} onChange={setVacunasVigentes} />
            <Campo etiqueta="Fecha de la última vacuna antirrábica"><input type="date" max={hoy} value={f.antirrabicaFecha} onChange={set('antirrabicaFecha')} className={claseInput} /></Campo>
            <Casilla checked={mayorEdad} onChange={setMayorEdad}>Declaro que soy <strong>mayor de edad</strong> y propietario o tenedor del ejemplar.</Casilla>
            <Casilla checked={veraz} onChange={setVeraz}>
              Declaro que la información es veraz y autorizo el tratamiento de mis datos personales (Ley 1581 de 2012) para el censo de caninos de manejo especial.
            </Casilla>
          </Seccion>

          <BotonesFormulario onCancelar={cerrar} texto="Radicar registro" enviando={enviando} icono={<FileCheck2 className="w-4 h-4" />} />
        </form>
      )}
    </Modal>
  );
}
