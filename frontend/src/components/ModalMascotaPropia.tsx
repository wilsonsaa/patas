import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PawPrint, Syringe, ClipboardCheck } from 'lucide-react';
import { api } from '../api';
import { AvisoDatos, Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, Radicado, Seccion, SiNo, SubirFoto, claseInput } from './ui';
import Propietario from './Propietario';

export default function ModalMascotaPropia() {
  const { modalMascotaPropiaAbierto, setModalMascotaPropiaAbierto, usuarioActivo } = useTheme();
  const inicial = {
    propNombre: usuarioActivo.nombre, propTipoDoc: 'CC', propNumDoc: '', propTelefono: usuarioActivo.telefono, propCorreo: usuarioActivo.correo,
    propDireccion: '', propBarrio: '', propZona: 'Urbana',
    nombre: '', especie: 'perro', raza: '', sexo: 'Macho', edadAnios: 0, edadMeses: 0, color: '', tamano: '', pesoKg: '', senas: '',
    microchipNumero: '', foto: '',
    antirrabicaFecha: '', antirrabicaLote: '', antirrabicaLaboratorio: '', otrasVacunas: '', desparasitacionFecha: '', veterinaria: '', observaciones: '',
  };
  const [f, setF] = useState(inicial);
  const [esterilizado, setEsterilizado] = useState<boolean | null>(null);
  const [antirrabica, setAntirrabica] = useState<boolean | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [radicado, setRadicado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalMascotaPropiaAbierto) return null;
  const cerrar = () => { setModalMascotaPropiaAbierto(false); setRadicado(''); setF(inicial); setEsterilizado(null); setAntirrabica(null); setAcepta(false); setError(''); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const hoy = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (esterilizado === null || antirrabica === null) return setError('Responde Sí o No en esterilización y vacuna antirrábica.');
    if (!acepta) return setError('Debes autorizar el tratamiento de datos personales.');
    setError(''); setEnviando(true);
    try {
      const r = await api.post<{ radicado: string }>('/mascotas-propias', {
        ...f, edadAnios: Number(f.edadAnios), edadMeses: Number(f.edadMeses), pesoKg: f.pesoKg === '' ? null : Number(f.pesoKg),
        esterilizado, antirrabica, aceptaDatos: true,
      });
      setRadicado(r.radicado);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo="Registrar mi mascota" sobretitulo="Censo municipal de animales de compañía" subtitulo="Los mismos datos de la jornada de vacunación, para que no tengas que repetirlos"
      icono={<PawPrint className="w-6 h-6 text-emerald-200" />} onClose={cerrar}>
      {radicado ? (
        <Radicado titulo="¡Mascota registrada!" radicado={radicado} onClose={cerrar}>
          <strong>{f.nombre}</strong> quedó en el registro municipal. Presenta este radicado en las jornadas de vacunación y esterilización para agilizar tu atención.
        </Radicado>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
          <ErrorFormulario mensaje={error} />
          <Propietario f={f} setF={setF}>
            <Campo etiqueta="Zona *">
              <select value={f.propZona} onChange={set('propZona')} className={claseInput}><option>Urbana</option><option>Rural</option></select>
            </Campo>
          </Propietario>

          <Seccion titulo="2. Datos de la mascota" icono={<PawPrint className="w-4 h-4 text-emerald-600" />}>
            <Campo etiqueta="Nombre *"><input required maxLength={60} value={f.nombre} onChange={set('nombre')} className={claseInput} /></Campo>
            <Campo etiqueta="Especie *">
              <select value={f.especie} onChange={set('especie')} className={claseInput}><option value="perro">Canino</option><option value="gato">Felino</option><option value="otro">Otro</option></select>
            </Campo>
            <Campo etiqueta="Raza *"><input required minLength={2} maxLength={80} value={f.raza} onChange={set('raza')} className={claseInput} placeholder="Ej. Criollo, Labrador…" /></Campo>
            <Campo etiqueta="Sexo *">
              <select value={f.sexo} onChange={set('sexo')} className={claseInput}><option>Macho</option><option>Hembra</option></select>
            </Campo>
            <Campo etiqueta="Edad: años"><input type="number" min={0} max={40} value={f.edadAnios} onChange={set('edadAnios')} className={claseInput} /></Campo>
            <Campo etiqueta="Edad: meses"><input type="number" min={0} max={11} value={f.edadMeses} onChange={set('edadMeses')} className={claseInput} /></Campo>
            <Campo etiqueta="Color"><input maxLength={60} value={f.color} onChange={set('color')} className={claseInput} /></Campo>
            <Campo etiqueta="Tamaño">
              <select value={f.tamano} onChange={set('tamano')} className={claseInput}><option value="">Sin especificar</option><option>Pequeño</option><option>Mediano</option><option>Grande</option></select>
            </Campo>
            <Campo etiqueta="Peso (kg)"><input type="number" min={0} max={150} step="0.1" value={f.pesoKg} onChange={set('pesoKg')} className={claseInput} /></Campo>
            <Campo etiqueta="Número de microchip (si tiene)"><input maxLength={30} value={f.microchipNumero} onChange={set('microchipNumero')} className={claseInput} /></Campo>
            <Campo etiqueta="Señas particulares" ancho><input maxLength={300} value={f.senas} onChange={set('senas')} className={claseInput} placeholder="Manchas, cicatrices, cola corta…" /></Campo>
            <SiNo pregunta="¿Está esterilizado(a)?" valor={esterilizado} onChange={setEsterilizado} />
            <SubirFoto valor={f.foto} onChange={(foto) => setF({ ...f, foto })} etiqueta="Foto de la mascota (opcional)" />
          </Seccion>

          <Seccion titulo="3. Vacunación y salud" icono={<Syringe className="w-4 h-4 text-emerald-600" />}>
            <SiNo pregunta="¿Tiene vacuna antirrábica?" valor={antirrabica} onChange={setAntirrabica} />
            {antirrabica && (
              <>
                <Campo etiqueta="Fecha de la última dosis *"><input required type="date" max={hoy} value={f.antirrabicaFecha} onChange={set('antirrabicaFecha')} className={claseInput} /></Campo>
                <Campo etiqueta="Laboratorio"><input maxLength={80} value={f.antirrabicaLaboratorio} onChange={set('antirrabicaLaboratorio')} className={claseInput} /></Campo>
                <Campo etiqueta="Lote" ayuda="Aparece en el carné de vacunación."><input maxLength={40} value={f.antirrabicaLote} onChange={set('antirrabicaLote')} className={claseInput} /></Campo>
              </>
            )}
            <Campo etiqueta="Otras vacunas aplicadas"><input maxLength={300} value={f.otrasVacunas} onChange={set('otrasVacunas')} className={claseInput} placeholder="Ej. Séxtuple, triple felina" /></Campo>
            <Campo etiqueta="Última desparasitación"><input type="date" max={hoy} value={f.desparasitacionFecha} onChange={set('desparasitacionFecha')} className={claseInput} /></Campo>
            <Campo etiqueta="Veterinaria de confianza"><input maxLength={120} value={f.veterinaria} onChange={set('veterinaria')} className={claseInput} /></Campo>
            <Campo etiqueta="Observaciones de salud" ancho><textarea rows={2} maxLength={500} value={f.observaciones} onChange={set('observaciones')} className={claseInput} /></Campo>
            <Casilla checked={acepta} onChange={setAcepta}><AvisoDatos /></Casilla>
          </Seccion>

          <BotonesFormulario onCancelar={cerrar} texto="Registrar mi mascota" enviando={enviando} icono={<ClipboardCheck className="w-4 h-4" />} />
        </form>
      )}
    </Modal>
  );
}
