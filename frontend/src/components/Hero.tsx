import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PawPrint, Heart, Home, Shield, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const {
    config,
    pets,
    refugios,
    solicitudes,
    adopcionesExitosas,
    setVistaActiva,
    setModalRegistroHogarAbierto,
    setModalRegistroAdoptanteAbierto
  } = useTheme();

  // Estados visuales de la portada con colores de marca
  const ESTADOS = [
    {
      id: 'oficial',
      label: 'PATAS Mosquera',
      color: '#059669',
      emoji: '🐾',
      imagen: '/logos/portada.png',
      badge: 'Iniciativa Oficial Mosquera'
    },
    {
      id: 'perro',
      label: 'Perritos',
      color: '#2563EB',
      emoji: '🐶',
      imagen: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80',
      badge: 'Buscando familia amorosa'
    },
    {
      id: 'gato',
      label: 'Gatitos',
      color: '#F59E0B',
      emoji: '🐱',
      imagen: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
      badge: 'Esterilizados y vacunados'
    },
    {
      id: 'huella',
      label: 'Hogares de Paso',
      color: '#10B981',
      emoji: '🐾',
      imagen: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80',
      badge: 'Cuidado temporal voluntario'
    },
    {
      id: 'adopcion',
      label: 'Finales Felices',
      color: '#8B5CF6',
      emoji: '❤️',
      imagen: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=80',
      badge: 'Más de 140 adopciones logradas'
    }
  ];

  const [paso, setPaso] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPaso((prev) => (prev + 1) % ESTADOS.length);
        setIsFading(false);
      }, 400);
    }, 4500);

    return () => clearInterval(intervalo);
  }, []);

  const estadoActual = ESTADOS[paso];

  // Stats calculation
  const disponiblesCount = pets.filter(p => p.estado === 'Disponible').length;
  const hogaresCount = refugios.filter(r => r.tipo === 'hogar_paso').length;
  const adopcionesCount = adopcionesExitosas.length;

  const RenderImagen = () => (
    <div className="relative w-full max-w-md md:max-w-lg aspect-square flex items-center justify-center filter drop-shadow-2xl mx-auto">
      {/* Decorative colored glow ring */}
      <div
        className="absolute -inset-3 rounded-[3rem] opacity-30 blur-xl transition-all duration-700"
        style={{ backgroundColor: estadoActual.color }}
      ></div>

      {/* Border shell */}
      <div
        className={`absolute inset-0 rounded-[2.5rem] transition-all duration-700 ease-in-out p-1.5 shadow-xl ${
          isFading ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{ backgroundColor: estadoActual.color }}
      >
        <div className="w-full h-full rounded-[2.25rem] overflow-hidden bg-white relative">
          <img
            src={estadoActual.imagen}
            alt="Mascota en PATAS"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Tag badge floating */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-gray-100">
            <span className="text-lg">{estadoActual.emoji}</span>
            <span className="text-xs font-bold text-gray-800">{estadoActual.badge}</span>
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 text-white">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Red PATAS
                </p>
                <h4 className="text-lg font-bold mt-0.5">Adopción responsable y segura</h4>
              </div>
              <span className="text-2xl">{estadoActual.emoji}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute -bottom-8 flex gap-2 z-10">
        {ESTADOS.map((estado, i) => (
          <button
            key={i}
            onClick={() => setPaso(i)}
            className="h-2 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: paso === i ? '28px' : '8px',
              backgroundColor: paso === i ? estado.color : '#d1d5db'
            }}
            aria-label={`Ver ${estado.label}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative bg-white overflow-hidden border-b border-gray-100">
      {/* Background soft ambient dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white/80 backdrop-blur-xs sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 pt-8 md:pt-14 px-4 sm:px-6 lg:px-8">
          <main className="mt-4 mx-auto max-w-7xl sm:mt-6 md:mt-10">
            <div className="sm:text-center lg:text-left relative z-20">
              {/* Badge oficial */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Red Oficial de Refugios y Hogares de Paso • {config.nombre}
              </div>

              {/* Title */}
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl flex flex-col font-heading">
                <span className="block">Encuentra a tu nuevo</span>
                <span
                  className="block mt-1.5 font-black tracking-tight transition-colors duration-500"
                  style={{ color: 'var(--color-acento)' }}
                >
                  mejor amigo. 🐾
                </span>
              </h1>

              {/* Mobile Image */}
              <div className="lg:hidden w-full flex justify-center py-8">
                <RenderImagen />
              </div>

              {/* Description */}
              <p className="mt-4 text-base text-gray-600 sm:text-lg sm:max-w-xl sm:mx-auto md:text-xl lg:mx-0 font-medium leading-relaxed">
                Bienvenido a <strong className="font-extrabold text-gray-900">PATAS</strong> (Plataforma de Acogida Temporal y Adopción Segura).
                Conectamos corazones dispuestos a dar amor con peluditos rescatados en hogares de paso voluntarios y refugios municipales.
                Gestiona adopciones con transparencia y seguimiento en tiempo real en Mosquera.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3 relative z-20">
                <button
                  id="hero-btn-adoptar"
                  onClick={() => setVistaActiva('mascotas')}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 border border-transparent text-base font-bold rounded-xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-acento)' }}
                >
                  <Heart className="w-5 h-5 fill-white" />
                  Adoptar ahora 🐾
                </button>

                <button
                  id="hero-btn-hogar-paso"
                  onClick={() => setModalRegistroHogarAbierto(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 border border-gray-300 text-base font-bold rounded-xl text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Home className="w-5 h-5 text-emerald-600" />
                  Ser Hogar de Paso
                </button>

                <button
                  id="hero-btn-servicios"
                  onClick={() => setVistaActiva('servicios')}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Todos los servicios →
                </button>
              </div>

              {/* Real-time stats bar */}
              <div className="mt-10 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <p className="text-2xl font-black text-gray-900 font-heading">{disponiblesCount}</p>
                  <p className="text-xs font-semibold text-gray-500">Mascotas en adopción</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600 font-heading">{hogaresCount}</p>
                  <p className="text-xs font-semibold text-gray-500">Hogares de paso activos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-600 font-heading">{adopcionesCount}+</p>
                  <p className="text-xs font-semibold text-gray-500">Adopciones registradas</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Desktop Image Section */}
      <div className="hidden lg:flex lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 items-center justify-center p-6 md:p-10 lg:p-14 bg-gradient-to-l from-emerald-50/40 to-transparent z-0">
        <RenderImagen />
      </div>
    </div>
  );
}
