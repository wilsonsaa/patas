import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Building2,
  Users,
  Heart,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  MessageCircle,
  ExternalLink,
  Award
} from 'lucide-react';

export default function RefugiosYPersonas() {
  const { refugios: lugares, adopcionesExitosas, solicitudes: todasSolicitudes, pets, usuarioActivo } = useTheme();
  // Solo refugios institucionales: los hogares de paso no publican ubicación ni contacto.
  const refugios = lugares.filter((l) => l.tipo === 'refugio');
  // El listado de personas interesadas contiene datos personales: solo lo ve el equipo gestor.
  const verInteresados = usuarioActivo.rol === 'admin' || usuarioActivo.rol === 'refugio_admin';
  const solicitudes = verInteresados ? todasSolicitudes : [];

  const [tabActiva, setTabActiva] = useState<'refugios' | 'adoptaron' | 'interesadas'>('refugios');
  const [busqueda, setBusqueda] = useState('');

  // Refugios municipales y centros oficiales
  const refugiosFiltrados = refugios.filter(r =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.municipio.toLowerCase().includes(busqueda.toLowerCase()) ||
    (r.responsable ?? '').toLowerCase().includes(busqueda.toLowerCase())
  );

  // Personas que han adoptado
  const adopcionesFiltradas = adopcionesExitosas.filter(a =>
    a.adoptanteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.mascotaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.municipio.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Personas interesadas (extraídas de solicitudes activas y pendientes)
  const personasInteresadas = solicitudes.map(s => ({
    id: s.id,
    nombre: s.solicitanteNombre,
    municipio: s.solicitanteMunicipio,
    telefono: s.solicitanteTelefono,
    mascotaInteres: s.mascotaNombre,
    tipoVivienda: s.tipoVivienda,
    estado: s.estado,
    fecha: s.fechaSolicitud
  })).filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.municipio.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.mascotaInteres.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <section id="refugios-personas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
            <Building2 className="w-3.5 h-3.5" /> Comunidad & Transparencia
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight">
            Refugios y familias adoptantes
          </h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
            Información oficial de los refugios y testimonios de quienes ya adoptaron.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => setTabActiva('refugios')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tabActiva === 'refugios' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Refugios ({refugios.length})
          </button>
          <button
            onClick={() => setTabActiva('adoptaron')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tabActiva === 'adoptaron' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Han Adoptado ({adopcionesExitosas.length})
          </button>
          {verInteresados && (<button
            onClick={() => setTabActiva('interesadas')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tabActiva === 'interesadas' ? 'bg-white text-blue-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Interesados ({personasInteresadas.length})
          </button>)}
        </div>
      </div>

      {/* Search Filter */}
      <div className="mb-8">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, municipio o institución..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {/* TAB 1: INFORMACIÓN DE REFUGIOS */}
      {tabActiva === 'refugios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {refugiosFiltrados.map((refugio) => {
            const mascotasActivas = pets.filter(p => p.hogarOrefugioId === refugio.id).length;

            return (
              <div
                key={refugio.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-md shadow-gray-200/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                      refugio.tipo === 'refugio'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {refugio.tipo === 'refugio' ? <ShieldCheck className="w-3.5 h-3.5" /> : '🏠'}
                      {refugio.tipo === 'refugio' ? 'Refugio Oficial Municipal' : 'Hogar de Paso Comunitario'}
                    </span>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                      {mascotasActivas} mascotas en resguardo
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 font-heading">
                    {refugio.nombre}
                  </h3>

                  <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5 mt-1.5 mb-4">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    {refugio.municipio} • {refugio.direccion}
                  </p>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100 mb-4">
                    {refugio.descripcion}
                  </p>

                  <div className="space-y-2 text-xs text-gray-700 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 mb-4">
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Responsable: <strong>{refugio.responsable}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Línea Telefónica: <strong>{refugio.telefono}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate">{refugio.correo}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Horario de Atención: {refugio.horario}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                  <a
                    href={`https://wa.me/${(refugio.telefono ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, me comunico desde la plataforma PATAS (Plataforma de Acogida Temporal y Adopción Segura) para solicitar información sobre ${refugio.nombre}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contactar Institución
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PERSONAS QUE HAN ADOPTADO */}
      {tabActiva === 'adoptaron' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-gray-900 font-heading">
                Muro de Familias Adoptantes y Casos de Éxito
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                Cada adopción cuenta con acompañamiento post-entrega. Conoce el testimonio de quienes cambiaron una vida.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {adopcionesFiltradas.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-md shadow-gray-200/40 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={item.mascotaFoto}
                      alt={item.mascotaNombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-white font-extrabold text-lg flex items-center gap-1">
                      {item.mascotaNombre} 🐾
                    </span>
                    <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                      {item.estadoSeguimiento}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-900 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.adoptanteNombre}</span>
                    </div>

                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {item.municipio} • Adopción el {item.fechaAdopcion}
                    </p>

                    <p className="text-xs text-gray-600 italic bg-amber-50/50 p-3 rounded-2xl border border-amber-100/60 leading-relaxed">
                      "{item.testimonio}"
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <span className="text-[11px] font-semibold text-emerald-700 block text-center bg-emerald-50 py-1.5 rounded-xl border border-emerald-100">
                    ✓ Verificación de bienestar al día
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAS INTERESADAS (BASE COMUNITARIA) */}
      {verInteresados && tabActiva === 'interesadas' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900 font-heading">
                Personas Interesadas en Adoptar
              </h3>
              <p className="text-xs text-gray-500">
                Familias con postulación en curso o esperando vinculación con un peludito
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
              {personasInteresadas.length} ciudadanos postulados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-y border-gray-200 text-gray-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Municipio</th>
                  <th className="py-3 px-4">Mascota de Interés</th>
                  <th className="py-3 px-4">Vivienda</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {personasInteresadas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                        {p.nombre[0]}
                      </div>
                      <div>
                        <p>{p.nombre}</p>
                        <span className="text-[10px] text-gray-400 font-normal">Registrado el {p.fecha}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{p.municipio}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{p.mascotaInteres}</td>
                    <td className="py-3.5 px-4 text-gray-600">{p.tipoVivienda}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`https://wa.me/${p.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${p.nombre}, nos comunicamos desde la plataforma PATAS de Mosquera para dar seguimiento a tu postulación.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Llamar / Chat
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
