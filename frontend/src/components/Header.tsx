import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PawPrint, Home, ClipboardList, Building2, MapPin, User, PlusCircle, Menu, X, HandHeart, LayoutGrid, LayoutDashboard, LogIn } from 'lucide-react';
import LogosAliados from './LogosAliados';

export default function Header() {
  const {
    config,
    vistaActiva,
    setVistaActiva,
    usuarioActivo,
    autenticado,
    esGestor,
    setModalDonarAbierto,
    setModalRegistroHogarAbierto,
    setModalSubirMascotaAbierto,
    setModalRegistroAdoptanteAbierto,
    solicitudes
  } = useTheme();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const verPanel = usuarioActivo.rol === 'admin' || usuarioActivo.rol === 'refugio_admin';

  // Count pending applications
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;

  const handleNav = (vista: typeof vistaActiva) => {
    setVistaActiva(vista);
    setMenuAbierto(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        id="header-principal"
        className="w-full shadow-md border-b-4 sticky top-0 z-40 transition-colors duration-500 bg-white"
        style={{ borderColor: 'var(--color-acento)' }}
      >
        {/* Barra Institucional Superior con Logos de la Alcaldía, Gobernación, Harry Salamanca, Hostaddrees */}
        <div className="hidden md:block bg-slate-50 border-b border-gray-200/80 py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-gray-700 font-semibold">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Oficial
              </span>
              <span>Iniciativa de Adopción y Bienestar Animal • <strong>Municipio de Mosquera, Cundinamarca</strong></span>
            </div>

            {/* Institutional Logos in Header */}
            <LogosAliados variant="header" />
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3.5 flex items-center justify-between">
          {/* Logo Principal PATAS */}
          <div
            id="brand-logo"
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => handleNav('inicio')}
          >
            <img
              src="/logos/logoapp.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logos/logo-patitas.png')) {
                  target.src = '/logos/logo-patitas.png';
                }
              }}
              alt="PATAS (Plataforma de Acogida Temporal y Adopción Segura) - Mosquera"
              className="h-10 sm:h-11 max-w-[150px] sm:max-w-none w-auto object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl lg:text-2xl tracking-tight text-gray-900 font-heading">
                  PATAS
                </span>
                <span className="text-xl" role="img" aria-label="huella">🐾</span>
              </div>
              <p className="text-[10px] lg:text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">
                Plataforma de Acogida Temporal y Adopción Segura
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5 font-medium text-sm text-gray-700 whitespace-nowrap">
            <button
              id="nav-inicio"
              onClick={() => handleNav('inicio')}
              className={`px-3 py-2 rounded-xl transition-all ${
                vistaActiva === 'inicio' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              Inicio
            </button>
            <button
              id="nav-servicios"
              onClick={() => handleNav('servicios')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                vistaActiva === 'servicios' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Servicios
            </button>
            <button
              id="nav-mascotas"
              onClick={() => handleNav('mascotas')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                vistaActiva === 'mascotas' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <PawPrint className="w-4 h-4" />
              Mascotas
            </button>
            <button
              id="nav-hogares"
              onClick={() => handleNav('hogares')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                vistaActiva === 'hogares' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Hogares
            </button>
            <button
              id="nav-solicitudes"
              onClick={() => handleNav('solicitudes')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 relative ${
                vistaActiva === 'solicitudes' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              {esGestor ? 'Solicitudes' : 'Mis solicitudes'}
              {solicitudesPendientes > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {solicitudesPendientes}
                </span>
              )}
            </button>
            <button
              id="nav-refugios-personas"
              onClick={() => handleNav('refugios_personas')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                vistaActiva === 'refugios_personas' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Refugios
            </button>
            <button
              id="nav-mapa"
              onClick={() => handleNav('mapa')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                vistaActiva === 'mapa' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Mapa
            </button>
            {verPanel && (
              <button
                id="nav-panel"
                onClick={() => handleNav('panel')}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  vistaActiva === 'panel' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Panel
              </button>
            )}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
            <button
              id="btn-donar-header"
              onClick={() => setModalDonarAbierto(true)}
              className="flex items-center gap-1.5 text-white bg-rose-600 hover:bg-rose-700 font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <HandHeart className="w-4 h-4" />
              Quiero donar
            </button>
            {esGestor && (
              <button
                id="btn-subir-mascota-header"
                onClick={() => setModalSubirMascotaAbierto(true)}
                className="flex items-center gap-1.5 text-white font-bold text-sm px-3 py-2.5 rounded-xl shadow-md cursor-pointer"
                style={{ backgroundColor: 'var(--color-acento)' }}
                title="Publicar mascota"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xl:inline">Publicar</span>
              </button>
            )}
            <button
              id="btn-cuenta-header"
              onClick={() => setModalRegistroAdoptanteAbierto(true)}
              className="flex items-center gap-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 font-semibold text-xs px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {autenticado ? <User className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              {autenticado ? usuarioActivo.nombre.split(' ')[0] : 'Ingresar'}
            </button>
          </div>

          {/* Mobile hamburger menu button */}
          <button
            id="btn-menu-hamburguesa"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="lg:hidden p-2 rounded-xl focus:outline-none transition-colors hover:bg-gray-100 text-gray-800"
            aria-label="Abrir menú"
          >
            {menuAbierto ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* LÍNEA ANIMADA MULTICOLOR */}
        {config.linea_multicolor && (
          <div className="h-1.5 w-full absolute bottom-[-6px] left-0 overflow-hidden z-20">
            <div className="flex w-[200%] h-full animate-mover-linea">
              <div className="flex-1 bg-yellow-500"></div>
              <div className="flex-1 bg-blue-700"></div>
              <div className="flex-1 bg-red-600"></div>
              <div className="flex-1 bg-purple-700"></div>
              <div className="flex-1 bg-yellow-500"></div>
              <div className="flex-1 bg-blue-700"></div>
              <div className="flex-1 bg-red-600"></div>
              <div className="flex-1 bg-purple-700"></div>
            </div>
          </div>
        )}
      </header>

      {/* Menú Lateral Móvil */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          menuAbierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuAbierto(false)}
      >
        <div
          className={`absolute top-0 right-0 w-[86%] max-w-sm h-dvh bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
            menuAbierto ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2.5">
              <PawPrint className="w-6 h-6 text-emerald-600" />
              <div>
                <span className="font-black text-xl tracking-tight text-gray-900 font-heading block leading-none">
                  PATAS
                </span>
                <span className="text-[9px] font-bold text-emerald-700 tracking-tight block mt-0.5">
                  Acogida Temporal y Adopción Segura
                </span>
              </div>
            </div>
            <button
              onClick={() => setMenuAbierto(false)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => { setModalRegistroAdoptanteAbierto(true); setMenuAbierto(false); }}
            className="p-4 border-b border-gray-100 bg-emerald-50/50 flex items-center gap-2 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {autenticado ? usuarioActivo.nombre[0] : <LogIn className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{autenticado ? usuarioActivo.nombre : 'Ingresar o crear cuenta'}</p>
              <p className="text-xs text-emerald-700 font-medium">{autenticado ? 'Ver mi cuenta' : 'Para adoptar y hacer trámites'}</p>
            </div>
          </button>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 flex flex-col gap-1">
            <button
              onClick={() => handleNav('inicio')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                vistaActiva === 'inicio' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" /> Inicio
            </button>

            <button
              onClick={() => handleNav('servicios')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                vistaActiva === 'servicios' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-5 h-5" /> Servicios y trámites
            </button>

            <button
              onClick={() => handleNav('mascotas')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                vistaActiva === 'mascotas' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <PawPrint className="w-5 h-5" /> Ver Mascotas en Adopción
            </button>

            <button
              onClick={() => handleNav('hogares')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                vistaActiva === 'hogares' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" /> Hogares de Paso
            </button>

            <button
              onClick={() => handleNav('solicitudes')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center justify-between ${
                vistaActiva === 'solicitudes' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5" /> {esGestor ? 'Solicitudes' : 'Mis solicitudes'}
              </div>
              {solicitudesPendientes > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {solicitudesPendientes}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('refugios_personas')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                vistaActiva === 'refugios_personas' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Building2 className="w-5 h-5" /> Refugios
            </button>

            <button
              onClick={() => handleNav('mapa')}
              className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                vistaActiva === 'mapa' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-5 h-5" /> Mapa de refugios
            </button>

            {verPanel && (
              <button
                onClick={() => handleNav('panel')}
                className={`w-full text-left font-bold text-[15px] px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                  vistaActiva === 'panel' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" /> Panel institucional
              </button>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={() => { setModalDonarAbierto(true); setMenuAbierto(false); }}
              className="w-full text-white bg-rose-600 font-bold py-3 rounded-xl shadow-md text-center flex items-center justify-center gap-2"
            >
              <HandHeart className="w-4 h-4" /> Quiero donar
            </button>
            {esGestor ? (
              <button
                onClick={() => { setModalSubirMascotaAbierto(true); setMenuAbierto(false); }}
                className="w-full text-white font-bold py-2.5 rounded-xl text-center flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-acento)' }}
              >
                <PlusCircle className="w-4 h-4" /> Publicar mascota
              </button>
            ) : (
              <button
                onClick={() => { setModalRegistroHogarAbierto(true); setMenuAbierto(false); }}
                className="w-full text-gray-700 bg-white border border-gray-200 font-bold py-2.5 rounded-xl text-center hover:bg-gray-100"
              >
                🏠 Inscribir hogar de paso
              </button>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
