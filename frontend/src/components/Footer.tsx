import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { PawPrint, Heart, Mail, Phone, MapPin } from 'lucide-react';
import LogosAliados from './LogosAliados';

export default function Footer() {
  const { config, setVistaActiva, setModalRegistroHogarAbierto, setModalDonarAbierto } = useTheme();

  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-auto overflow-hidden">
      {/* LÍNEA ANIMADA MULTICOLOR (FOOTER) */}
      {config.linea_multicolor && (
        <div className="h-1.5 w-full overflow-hidden">
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

      {/* Main footer navigation & info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Institutional Logos Showcase */}
        <div className="mb-10">
          <div className="text-center mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Alianzas Institucionales & Respaldo Oficial en Mosquera
            </span>
          </div>
          <LogosAliados variant="footer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-100">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: 'var(--color-acento)' }}
              >
                <PawPrint className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-heading">
                PATAS
              </span>
              <span className="text-xl">🐾</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-emerald-800 tracking-wide">
              Plataforma de Acogida Temporal y Adopción Segura
            </p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
              Iniciativa municipal de Mosquera para la acogida temporal, adopción responsable de perros y gatos, gestión de hogares de paso voluntarios y seguimiento transparente de solicitudes con la Alcaldía de Mosquera y aliados estratégicos.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-emerald-800 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Exclusivo para Mosquera, Cundinamarca
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> Sin ánimo de lucro
              </span>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs font-medium text-gray-600">
              <li>
                <button
                  onClick={() => { setVistaActiva('mascotas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  🐾 Ver Mascotas en Mosquera
                </button>
              </li>
              <li>
                <button onClick={() => { setVistaActiva('servicios'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-emerald-700 transition-colors">
                  🗂️ Servicios y trámites
                </button>
              </li>
              <li>
                <button onClick={() => setModalDonarAbierto(true)} className="hover:text-emerald-700 transition-colors">
                  💚 Quiero donar
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setModalRegistroHogarAbierto(true); }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  🏠 Inscribir hogar de paso
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setVistaActiva('solicitudes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  📋 Mis solicitudes
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setVistaActiva('refugios_personas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  🏢 Refugios y Adoptantes
                </button>
              </li>
              <li>
                <button
                  onClick={() => { setVistaActiva('mapa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  🗺️ Mapa de Puntos en Mosquera
                </button>
              </li>
            </ul>
          </div>

          {/* Asistencia */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Líneas de Atención
            </h4>
            <div className="space-y-2 text-xs text-gray-500">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Refugio Municipal Mosquera: +57 (601) 827-0830</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>bienestaranimal@mosquera-cundinamarca.gov.co</span>
              </p>
              <p className="text-[11px] text-gray-400 pt-1">
                Horario: Lunes a viernes 8:00 AM a 5:00 PM • Mosquera
              </p>
            </div>
          </div>
        </div>

        {/* Institutional & Credits Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 text-xs pt-4">
          {/* Firma Harry Salamanca */}
          <div className="flex items-center gap-2">
            <img
              src="/logos/logo-harry-salamanca.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logos/logoh.png')) {
                  target.src = '/logos/logoh.png';
                }
              }}
              alt="Harry Salamanca Concejal 2024 - 2027"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-[11px] text-gray-600 font-medium">
              Concejal de Mosquera 2024 - 2027
            </span>
          </div>

          {/* Centro: Hostaddrees y Derechos */}
          <div className="flex flex-col items-center justify-center text-center">
            <a
              href="https://hostaddrees.com"
              target="_blank"
              rel="noopener"
              className="group flex items-center gap-1.5 text-xs text-gray-600 font-medium py-1"
            >
              <span>Desarrollado con <span role="img" aria-label="amor">❤️</span> por</span>
              <img src="/logos/logo-hostaddrees.png" alt="" className="h-6 w-auto object-contain" />
              <span className="font-bold text-gray-900 underline decoration-emerald-500 decoration-2 underline-offset-2 group-hover:text-emerald-700">HostAddrees</span>
            </a>
            <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">
              &copy; {new Date().getFullYear()} PATAS (Plataforma de Acogida Temporal y Adopción Segura) • Mosquera, Cundinamarca
            </p>
          </div>

          {/* Derecha: Alcaldía y Gobernación */}
          <div className="flex items-center gap-3">
            <img
              src="/logos/logo-alcaldia.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logos/alcaldia.png')) {
                  target.src = '/logos/alcaldia.png';
                }
              }}
              alt="Alcaldía de Mosquera"
              className="h-9 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <img
              src="/logos/logo-gobernacion.png"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logos/logo-gober.png')) {
                  target.src = '/logos/logo-gober.png';
                }
              }}
              alt="Gobernación de Cundinamarca"
              className="h-6 w-auto object-contain rounded-xs"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
