import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PlusCircle, CheckCircle2, Stethoscope, MapPinned } from 'lucide-react';
import { PetSpecies, PetAgeCategory, PetSize } from '../types';
import { Campo, ErrorFormulario, Modal, BotonesFormulario, Seccion, SiNo, SubirFoto, claseInput } from './ui';
import SelectorUbicacion from './SelectorUbicacion';

export default function ModalSubirMascota() {
  const { modalSubirMascotaAbierto, setModalSubirMascotaAbierto, addPet, refugios, usuarioActivo, setVistaActiva } = useTheme();
  const inicial = {
    nombre: '', especie: 'perro' as PetSpecies, raza: '', edadCategoria: 'Joven' as PetAgeCategory, edadTexto: '',
    genero: 'Macho' as 'Macho' | 'Hembra', tamano: 'Mediano' as PetSize, foto: '', descripcion: '', temperamento: '',
    detallesMedicos: '', hogarId: '',
  };
  const [f, setF] = useState(inicial);
  const [salud, setSalud] = useState({ vacunado: false, esterilizado: false, desparasitado: false, microchip: false });
  const [conHallazgo, setConHallazgo] = useState<boolean | null>(null);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [hallazgoFecha, setHallazgoFecha] = useState('');
  const [hallazgoRef, setHallazgoRef] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalSubirMascotaAbierto) return null;
  const esHogar = usuarioActivo.rol === 'hogar_paso';
  const cerrar = () => { setModalSubirMascotaAbierto(false); setF(inicial); setSalud({ vacunado: false, esterilizado: false, desparasitado: false, microchip: false }); setError(''); setConHallazgo(null); setPunto(null); setHallazgoFecha(''); setHallazgoRef(''); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.foto) return setError('Sube al menos una foto de la mascota.');
    const hogarOrefugioId = esHogar ? undefined : (f.hogarId || refugios[0]?.id);
    if (!esHogar && !hogarOrefugioId) return setError('No hay refugios u hogares verificados donde publicar.');
    if (conHallazgo && !punto) return setError('Marca en el mapa dónde se encontró al animal, o responde «No» a esa pregunta.');
    setError(''); setEnviando(true);
    const ok = await addPet({
      hallazgo: conHallazgo && punto ? { ...punto, fecha: hallazgoFecha, referencia: hallazgoRef } : null,
      nombre: f.nombre, especie: f.especie, raza: f.raza, edadCategoria: f.edadCategoria, edadTexto: f.edadTexto, genero: f.genero,
      tamano: f.tamano, fotos: [f.foto], descripcion: f.descripcion,
      temperamento: f.temperamento.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
      salud: { ...salud, detallesMedicos: f.detallesMedicos }, hogarOrefugioId: hogarOrefugioId as string,
    });
    setEnviando(false);
    if (ok) { cerrar(); setVistaActiva('mascotas'); }
  };

  return (
    <Modal titulo="Publicar mascota en adopción" sobretitulo={usuarioActivo.nombreOrganizacion ?? 'Panel de gestión'} subtitulo="Crea una hoja de vida completa para encontrarle familia"
      icono={<PlusCircle className="w-6 h-6 text-emerald-200" />} onClose={cerrar}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
        <ErrorFormulario mensaje={error} />
        <Seccion titulo="Datos básicos">
          <Campo etiqueta="Nombre *"><input required maxLength={60} value={f.nombre} onChange={set('nombre')} className={claseInput} /></Campo>
          <Campo etiqueta="Especie *">
            <select value={f.especie} onChange={set('especie')} className={claseInput}><option value="perro">🐶 Perro</option><option value="gato">🐱 Gato</option><option value="otro">🐾 Otro</option></select>
          </Campo>
          <Campo etiqueta="Raza o cruce"><input maxLength={80} value={f.raza} onChange={set('raza')} className={claseInput} placeholder="Ej. Mestizo criollo" /></Campo>
          <Campo etiqueta="Edad aproximada *"><input required maxLength={40} value={f.edadTexto} onChange={set('edadTexto')} className={claseInput} placeholder="Ej. 6 meses, 2 años" /></Campo>
          <Campo etiqueta="Etapa de vida">
            <select value={f.edadCategoria} onChange={set('edadCategoria')} className={claseInput}>
              <option value="Cachorro">Cachorro (menos de 1 año)</option><option value="Joven">Joven (1 a 3 años)</option><option value="Adulto">Adulto (3 a 7 años)</option><option value="Senior">Senior (más de 7 años)</option>
            </select>
          </Campo>
          <Campo etiqueta="Sexo"><select value={f.genero} onChange={set('genero')} className={claseInput}><option>Macho</option><option>Hembra</option></select></Campo>
          <Campo etiqueta="Tamaño">
            <select value={f.tamano} onChange={set('tamano')} className={claseInput}><option value="Pequeño">Pequeño (menos de 10 kg)</option><option value="Mediano">Mediano (10 a 25 kg)</option><option value="Grande">Grande (más de 25 kg)</option></select>
          </Campo>
          {!esHogar && (
            <Campo etiqueta="Refugio u hogar a cargo *">
              <select value={f.hogarId || refugios[0]?.id || ''} onChange={set('hogarId')} className={claseInput}>
                {refugios.map((r) => <option key={r.id} value={r.id}>{r.tipo === 'hogar_paso' ? '🏠' : '🏢'} {r.nombre}</option>)}
              </select>
            </Campo>
          )}
          <SubirFoto valor={f.foto} onChange={(foto) => setF({ ...f, foto })} etiqueta="Fotografía *" />
        </Seccion>

        <Seccion titulo="Historia y personalidad">
          <Campo etiqueta="Historia y descripción *" ancho ayuda="No incluyas direcciones ni teléfonos: el contacto se hace por la plataforma.">
            <textarea required minLength={10} maxLength={2000} rows={3} value={f.descripcion} onChange={set('descripcion')} className={claseInput} placeholder="¿Cómo fue rescatado? ¿Cómo es su carácter y qué familia busca?" />
          </Campo>
          <Campo etiqueta="Rasgos de personalidad (separados por comas)" ancho><input maxLength={300} value={f.temperamento} onChange={set('temperamento')} className={claseInput} placeholder="Juguetón, tranquilo, sociable con gatos" /></Campo>
        </Seccion>

        <Seccion titulo="Estado veterinario" icono={<Stethoscope className="w-4 h-4 text-emerald-600" />}>
          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(Object.keys(salud) as (keyof typeof salud)[]).map((k) => (
              <label key={k} className="flex items-center gap-1.5 p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                <input type="checkbox" checked={salud[k]} onChange={(e) => setSalud({ ...salud, [k]: e.target.checked })} className="accent-emerald-600" />
                <span className="font-semibold capitalize">{k}</span>
              </label>
            ))}
          </div>
          <Campo etiqueta="Detalles médicos" ancho><input maxLength={500} value={f.detallesMedicos} onChange={set('detallesMedicos')} className={claseInput} /></Campo>
        </Seccion>

        <Seccion titulo="Lugar donde se encontró" icono={<MapPinned className="w-4 h-4 text-emerald-600" />}>
          <SiNo pregunta="¿Sabes dónde se encontró o recogió?" ayuda="Ayuda a identificar los puntos críticos de abandono. La coordenada no se publica." valor={conHallazgo} onChange={setConHallazgo} />
          {conHallazgo && (
            <>
              <SelectorUbicacion valor={punto} onChange={setPunto} />
              <Campo etiqueta="Fecha del hallazgo"><input type="date" max={new Date().toISOString().slice(0, 10)} value={hallazgoFecha} onChange={(e) => setHallazgoFecha(e.target.value)} className={claseInput} /></Campo>
              <Campo etiqueta="Referencia (se muestra en su hoja de vida)"><input maxLength={200} value={hallazgoRef} onChange={(e) => setHallazgoRef(e.target.value)} className={claseInput} placeholder="Ej. Parque principal, barrio El Trébol" /></Campo>
            </>
          )}
        </Seccion>

        <BotonesFormulario onCancelar={cerrar} texto="Publicar mascota" enviando={enviando} icono={<CheckCircle2 className="w-4 h-4" />} />
      </form>
    </Modal>
  );
}
