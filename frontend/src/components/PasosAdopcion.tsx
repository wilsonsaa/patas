import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Search, FileCheck, HeartHandshake, ArrowRight } from 'lucide-react';

export default function PasosAdopcion() {
  const { setVistaActiva, setModalRegistroAdoptanteAbierto } = useTheme();

  const pasos = [
    {
      id: 1,
      titulo: 'Explora & Conoce',
      descripcion: 'Revisa las hojas de vida, fotos y estado veterinario de los peluditos en refugios y hogares de paso.',
      icono: <Search className="w-8 h-8 text-emerald-600" />,
      accionTexto: 'Ver Mascotas',
      onClick: () => setVistaActiva('mascotas')
    },
    {
      id: 2,
      titulo: 'Postula tu Hogar',
      descripcion: 'Llena tu solicitud de adopción digital detallando tu espacio familiar para verificar compatibilidad.',
      icono: <FileCheck className="w-8 h-8 text-amber-500" />,
      accionTexto: 'Registrarme',
      onClick: () => setModalRegistroAdoptanteAbierto(true)
    },
    {
      id: 3,
      titulo: 'Entrevista & Conexión',
      descripcion: 'El hogar de paso o refugio te contactará para coordinar la visita y oficializar la entrega amorosa.',
      icono: <HeartHandshake className="w-8 h-8 text-purple-600" />,
      accionTexto: 'Ver Solicitudes',
      onClick: () => setVistaActiva('solicitudes')
    }
  ];

  return (
    <section className="py-16 bg-[#faf8f5] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span
            className="text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200"
            style={{ color: 'var(--color-acento)' }}
          >
            Proceso Transparente y Seguro
          </span>
          <h2 className="mt-3 text-3xl leading-8 font-black tracking-tight text-gray-900 sm:text-4xl font-heading">
            Adoptar nunca fue tan fácil y confiable
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto font-medium">
            3 sencillos pasos para cambiar una vida y llenar tu hogar de felicidad incondicional
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {pasos.map((paso) => (
            <div
              key={paso.id}
              className="bg-white rounded-3xl shadow-lg shadow-gray-200/60 p-8 text-center border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-gray-300/50 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Círculo decorativo de fondo */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 pointer-events-none"
                style={{ backgroundColor: 'var(--color-acento)' }}
              ></div>

              {/* Huellas en las esquinas */}
              <div
                className="absolute top-3 left-3 text-xl opacity-[0.08] rotate-[-15deg] select-none pointer-events-none"
                style={{ color: 'var(--color-acento)' }}
              >
                🐾
              </div>
              <div
                className="absolute bottom-3 left-3 text-xl opacity-[0.08] rotate-[15deg] select-none pointer-events-none"
                style={{ color: 'var(--color-acento)' }}
              >
                🐾
              </div>
              <div
                className="absolute bottom-3 right-3 text-xl opacity-[0.08] rotate-[-15deg] select-none pointer-events-none"
                style={{ color: 'var(--color-acento)' }}
              >
                🐾
              </div>

              <div>
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5 relative z-10 shadow-xs">
                  {paso.icono}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Paso 0{paso.id}</span>
                <h3 className="text-xl font-black text-gray-900 mb-2 relative z-10 font-heading">
                  {paso.titulo}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm font-medium relative z-10 leading-relaxed">
                  {paso.descripcion}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 relative z-10">
                <button
                  onClick={paso.onClick}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span>{paso.accionTexto}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
