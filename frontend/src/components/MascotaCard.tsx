import React, { useState } from 'react';
import { Pet } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Heart, MapPin, ShieldCheck, Home, Sparkles, PawPrint } from 'lucide-react';

interface MascotaCardProps {
  mascota: Pet;
  key?: React.Key;
}

export default function MascotaCard({ mascota }: MascotaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setMascotaSeleccionada, setMascotaParaAdoptar } = useTheme();

  const getStatusBadge = () => {
    switch (mascota.estado) {
      case 'Disponible':
        return {
          bg: 'bg-emerald-500 text-white',
          label: 'Disponible'
        };
      case 'En proceso':
        return {
          bg: 'bg-amber-500 text-white',
          label: 'En Evaluación'
        };
      case 'Adoptado':
        return {
          bg: 'bg-blue-600 text-white',
          label: '¡Adoptado! 🎉'
        };
      default:
        return {
          bg: 'bg-gray-500 text-white',
          label: mascota.estado
        };
    }
  };

  const status = getStatusBadge();

  return (
    <div
      id={`card-mascota-${mascota.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 relative flex flex-col justify-between group"
      style={{
        border: '1px solid rgba(5, 150, 105, 0.35)',
        boxShadow: isHovered
          ? '0 10px 25px -5px rgba(5, 150, 105, 0.25), 0 0 15px 2px rgba(5, 150, 105, 0.3)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 0 4px 0px rgba(5, 150, 105, 0.2)'
      }}
    >
      {/* Huellas decorativas en las 4 esquinas de la tarjeta */}
      <div
        className="absolute top-2.5 left-2.5 text-base opacity-25 rotate-[-15deg] select-none pointer-events-none z-20"
        style={{ color: 'var(--color-acento)' }}
      >
        🐾
      </div>
      <div
        className="absolute top-2.5 right-2.5 text-base opacity-25 rotate-[15deg] select-none pointer-events-none z-20"
        style={{ color: 'var(--color-acento)' }}
      >
        🐾
      </div>
      <div
        className="absolute bottom-2.5 left-2.5 text-base opacity-15 rotate-[15deg] select-none pointer-events-none z-20"
        style={{ color: 'var(--color-acento)' }}
      >
        🐾
      </div>
      <div
        className="absolute bottom-2.5 right-2.5 text-base opacity-15 rotate-[-15deg] select-none pointer-events-none z-20"
        style={{ color: 'var(--color-acento)' }}
      >
        🐾
      </div>

      {/* Imagen & Badges Superiores */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-100">
        <img
          src={mascota.fotos[0] || '/fotos/perro-calle.webp'}
          alt={mascota.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Especie Tag */}
        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-20">
          {mascota.especie === 'perro' && '🐶 Perro'}
          {mascota.especie === 'gato' && '🐱 Gato'}
          {mascota.especie === 'otro' && '🐾 Mascota'}
        </span>

        {/* Estado Badge */}
        <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-black rounded-full shadow-md z-20 ${status.bg}`}>
          {status.label}
        </span>

        {/* Foster Home or Shelter Chip */}
        <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between text-white text-xs">
          <span className="font-semibold flex items-center gap-1 truncate drop-shadow-md">
            {mascota.esHogarPaso ? <Home className="w-3.5 h-3.5 text-amber-300 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
            <span className="truncate">{mascota.hogarOrefugioNombre}</span>
          </span>
          <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] shrink-0 font-medium">
            {mascota.edadTexto}
          </span>
        </div>
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-5 flex-1 flex flex-col justify-between relative z-20">
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-2xl font-black text-gray-900 font-heading tracking-tight">
              {mascota.nombre}
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              {mascota.genero} • {mascota.tamano}
            </span>
          </div>

          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-emerald-600" />
            {mascota.municipio}
          </p>

          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
            {mascota.descripcion}
          </p>

          {/* Chips de temperamento */}
          <div className="flex flex-wrap gap-1 mb-4">
            {mascota.temperamento.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            id={`btn-hoja-vida-${mascota.id}`}
            onClick={() => setMascotaSeleccionada(mascota)}
            className="flex-1 text-xs font-bold py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
            Ver Hoja de Vida
          </button>

          {mascota.estado === 'Disponible' && (
            <button
              id={`btn-adoptar-${mascota.id}`}
              onClick={() => setMascotaParaAdoptar(mascota)}
              className="flex-1 text-xs font-bold py-2.5 px-3 rounded-xl text-white shadow-md transition-all hover:opacity-95 hover:scale-102 flex items-center justify-center gap-1 cursor-pointer"
              style={{ backgroundColor: 'var(--color-acento)' }}
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              Adoptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
