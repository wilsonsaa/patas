import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
  MessageCircle,
  Search,
  User,
  Home,
  Phone,
  Mail,
  MapPin,
  Filter,
  Check,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { SolicitudEstado, SolicitudAdopcion } from '../types';

export default function SolicitudesManager() {
  const {
    solicitudes,
    updateSolicitudEstado,
    usuarioActivo,
    autenticado,
    esGestor,
    setModalRegistroAdoptanteAbierto
  } = useTheme();
  // quien gestiona no puede tramitar su propia postulación
  const gestionable = (s: SolicitudAdopcion) => esGestor && s.solicitanteCorreo !== usuarioActivo.correo;

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [solicitudEnEdicion, setSolicitudEnEdicion] = useState<SolicitudAdopcion | null>(null);
  const [notaTexto, setNotaTexto] = useState('');
  const [fechaEntrevistaInput, setFechaEntrevistaInput] = useState('');

  // Metrics
  const stats = useMemo(() => {
    return {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => s.estado === 'Pendiente').length,
      enEvaluacion: solicitudes.filter(s => s.estado === 'En evaluación' || s.estado === 'Entrevista agendada').length,
      aprobadas: solicitudes.filter(s => s.estado === 'Aprobada').length
    };
  }, [solicitudes]);

  // Filtered applications
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(sol => {
      const matchEstado = filtroEstado === 'todos' || sol.estado === filtroEstado;
      const matchBusqueda =
        sol.solicitanteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        sol.mascotaNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        sol.solicitanteMunicipio.toLowerCase().includes(busqueda.toLowerCase()) ||
        sol.solicitanteTelefono.includes(busqueda);

      return matchEstado && matchBusqueda;
    });
  }, [solicitudes, filtroEstado, busqueda]);

  const handleOpenEdit = (sol: SolicitudAdopcion) => {
    setSolicitudEnEdicion(sol);
    setNotaTexto(sol.notasGestor || '');
    setFechaEntrevistaInput(sol.fechaEntrevista || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudEnEdicion) return;

    updateSolicitudEstado(
      solicitudEnEdicion.id,
      solicitudEnEdicion.estado,
      notaTexto,
      fechaEntrevistaInput
    );
    setSolicitudEnEdicion(null);
  };

  const getEstadoBadge = (estado: SolicitudEstado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'En evaluación':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Entrevista agendada':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Aprobada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Rechazada':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!autenticado) {
    return (
      <section className="max-w-xl mx-auto px-4 py-20 text-center">
        <ClipboardList className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-2xl font-black text-gray-900 font-heading">Sigue tus solicitudes de adopción</h2>
        <p className="text-sm text-gray-600 mt-2">Inicia sesión para ver el estado de tus postulaciones y las citas de entrevista.</p>
        <button onClick={() => setModalRegistroAdoptanteAbierto(true)} className="mt-5 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>
          Ingresar o crear cuenta
        </button>
      </section>
    );
  }

  return (
    <section id="gestion-solicitudes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
            <ClipboardList className="w-3.5 h-3.5" /> Coordinación y Adopciones
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight">
            {esGestor ? 'Gestión de solicitudes de adopción' : 'Mis solicitudes de adopción'}
          </h2>
          <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
            {esGestor ? 'Evalúa el entorno familiar, agenda entrevistas y aprueba entregas responsables.' : 'Consulta el estado de tus postulaciones y las citas programadas.'}
          </p>
        </div>

      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Radicadas</span>
          <p className="text-3xl font-black text-gray-900 mt-1 font-heading">{stats.total}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">Postulaciones en sistema</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Por Evaluar</span>
          <p className="text-3xl font-black text-amber-600 mt-1 font-heading">{stats.pendientes}</p>
          <span className="text-[11px] text-amber-800 mt-1 block">Esperando primer contacto</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">En Trámite / Cita</span>
          <p className="text-3xl font-black text-blue-600 mt-1 font-heading">{stats.enEvaluacion}</p>
          <span className="text-[11px] text-blue-800 mt-1 block">Entrevistas y visitas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Aprobadas Oficiales</span>
          <p className="text-3xl font-black text-emerald-600 mt-1 font-heading">{stats.aprobadas}</p>
          <span className="text-[11px] text-emerald-800 mt-1 block">Peluditos con nuevo hogar</span>
        </div>
      </div>

      {/* Control Bar: Search and Status Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-md shadow-gray-200/50 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por solicitante, mascota o teléfono..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['todos', 'Pendiente', 'En evaluación', 'Entrevista agendada', 'Aprobada', 'Rechazada'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'todos' ? 'Todas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Solicitudes List */}
      <div className="space-y-4">
        {solicitudesFiltradas.length > 0 ? (
          solicitudesFiltradas.map((sol) => {
            return (
              <div
                key={sol.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center"
              >
                {/* Left side: Pet & Applicant summary */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-3/5">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img
                      src={sol.mascotaFoto}
                      alt={sol.mascotaNombre}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 text-xs">
                      {sol.mascotaEspecie === 'gato' ? '🐱' : '🐶'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getEstadoBadge(sol.estado)}`}>
                        {sol.estado}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">{sol.radicado} · {sol.fechaSolicitud}</span>
                    </div>

                    <h4 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <span>{sol.solicitanteNombre}</span>
                      <span className="text-xs font-normal text-gray-500">desea adoptar a</span>
                      <span className="text-emerald-700 font-extrabold">{sol.mascotaNombre}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
                      <p className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {sol.solicitanteMunicipio}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {sol.solicitanteTelefono}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <Home className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        Vivienda: {sol.tipoVivienda}
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        Otras mascotas: {sol.tieneOtrasMascotas ? `Sí${sol.detalleOtrasMascotas ? ` (${sol.detalleOtrasMascotas})` : ''}` : 'No'}
                      </p>
                    </div>

                    {/* Núcleo familiar: preguntas de la Dirección de Protección Animal */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {[
                        ['Niños en el hogar', sol.hayNinos, sol.edadesNinos],
                        ['Alergias', sol.hayAlergias, sol.detalleAlergias],
                        ['Embarazo', sol.hayEmbarazo, ''],
                        ['Todos de acuerdo', sol.todosEnCasaDeAcuerdo, ''],
                        ['Conoce la ley', sol.conoceResponsabilidadesLey, ''],
                      ].map(([etiqueta, valor, detalle]) => (
                        <span key={etiqueta as string} className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${valor ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {etiqueta}: {valor ? 'Sí' : 'No'}{valor && detalle ? ` · ${detalle}` : ''}
                        </span>
                      ))}
                    </div>

                    {/* Motivation excerpt */}
                    <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-2.5 line-clamp-2">
                      "{sol.motivoAdopcion}"
                    </p>

                    {/* Reviewer notes if any */}
                    {sol.notasGestor && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 mt-2">
                        <strong>Nota del gestor:</strong> {sol.notasGestor}
                      </p>
                    )}

                    {sol.fechaEntrevista && (
                      <p className="text-xs text-purple-800 bg-purple-50 p-2 rounded-xl border border-purple-200 mt-1 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        Entrevista / Visita agendada: {sol.fechaEntrevista}
                      </p>
                    )}
                  </div>
                </div>

                {gestionable(sol) && (
                <div className="flex flex-wrap lg:flex-col gap-2 w-full lg:w-auto shrink-0 justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                  {/* WhatsApp direct contact button */}
                  <a
                    href={`https://wa.me/${sol.solicitanteTelefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola ${sol.solicitanteNombre}, te saludamos desde PATAS (Plataforma de Acogida Temporal y Adopción Segura) respecto a tu solicitud para adoptar a ${sol.mascotaNombre}. Nos gustaría continuar con tu proceso de adopción en Mosquera.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 lg:flex-none text-xs font-bold py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    WhatsApp
                  </a>

                  {/* Quick state transitions */}
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    {sol.estado !== 'Aprobada' && (
                      <button
                        onClick={() => updateSolicitudEstado(sol.id, 'Aprobada', 'Adoptante verificado y apto.')}
                        className="flex-1 text-xs font-bold py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Aprobar adopción y marcar mascota como adoptada"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprobar
                      </button>
                    )}

                    {sol.estado === 'Pendiente' && (
                      <button
                        onClick={() => updateSolicitudEstado(sol.id, 'En evaluación')}
                        className="flex-1 text-xs font-bold py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Pasar a evaluación"
                      >
                        Evaluar
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(sol)}
                      className="flex-1 text-xs font-bold py-2 px-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Gestionar notas y fechas"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Gestionar
                    </button>

                    {sol.estado !== 'Rechazada' && (
                      <button
                        onClick={() => updateSolicitudEstado(sol.id, 'Rechazada', 'No cumple con los requisitos del espacio.')}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
                        title="Rechazar solicitud"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-14 bg-white rounded-3xl border border-gray-200 p-6">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No hay solicitudes con este filtro</h3>
            <p className="text-xs text-gray-500 mt-1">
              Prueba cambiando el estado seleccionado o limpiando la búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* Modal para Gestionar Detalle y Agendar Entrevista */}
      {solicitudEnEdicion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 overscroll-contain">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative my-auto">
            <button
              onClick={() => setSolicitudEnEdicion(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-gray-900 font-heading mb-1">
              Gestionar solicitud {solicitudEnEdicion.radicado}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Postulación de <strong>{solicitudEnEdicion.solicitanteNombre}</strong> para <strong>{solicitudEnEdicion.mascotaNombre}</strong>
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cambiar Estado de la Solicitud
                </label>
                <select
                  value={solicitudEnEdicion.estado}
                  onChange={(e) => setSolicitudEnEdicion({ ...solicitudEnEdicion, estado: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En evaluación">En evaluación</option>
                  <option value="Entrevista agendada">Entrevista agendada</option>
                  <option value="Aprobada">Aprobada (Finalizar entrega)</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Agendar Fecha / Hora de Entrevista o Visita
                </label>
                <input
                  type="text"
                  value={fechaEntrevistaInput}
                  onChange={(e) => setFechaEntrevistaInput(e.target.value)}
                  placeholder="Ej. Sábado 12 de Septiembre a las 2:30 PM en el refugio"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observaciones internas del Hogar de Paso / Refugio
                </label>
                <textarea
                  rows={3}
                  value={notaTexto}
                  onChange={(e) => setNotaTexto(e.target.value)}
                  placeholder="Anotaciones sobre videollamada, verificación de mallas, experiencia previa..."
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSolicitudEnEdicion(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
