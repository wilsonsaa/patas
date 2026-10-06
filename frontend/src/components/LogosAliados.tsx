import React from 'react';

interface LogosAliadosProps {
  className?: string;
  variant?: 'banner' | 'footer' | 'compact' | 'header';
}

// Configuración de logos institucionales en formato PNG alojados en /logos/
export const LOGOS_CONFIG = {
  alcaldia: {
    src: '/logos/logo-alcaldia.png',
    fallbackSrc: '/logos/alcaldia.png',
    alt: 'Alcaldía de Mosquera, Cundinamarca',
    label: 'Alcaldía de Mosquera',
    sublabel: 'Gestión Municipal Oficial'
  },
  gobernacion: {
    src: '/logos/logo-gobernacion.png',
    fallbackSrc: '/logos/logo-gober.png',
    alt: 'Gobernación de Cundinamarca',
    label: 'Gobernación',
    sublabel: 'Cundinamarca'
  },
  harrySalamanca: {
    src: '/logos/logo-harry-salamanca.png',
    fallbackSrc: '/logos/logoh.png',
    alt: 'Firma Harry Salamanca Concejal 2024 - 2027',
    label: 'Harry Salamanca',
    sublabel: 'Concejal 2024 - 2027'
  },
  hostaddrees: {
    src: '/logos/logo-hostaddrees.png',
    fallbackSrc: '/logos/logohos.png',
    alt: 'HostAddrees Tecnología',
    label: 'HostAddrees',
    sublabel: 'Tecnología & Plataforma'
  },
  externado: {
    src: '/logos/logo-externado.png',
    fallbackSrc: '/logos/logou.png',
    alt: 'Universidad Externado de Colombia',
    label: 'U. Externado',
    sublabel: 'Aliado Académico'
  }
};

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackSrc: string) => {
  const target = e.currentTarget;
  if (target.src !== fallbackSrc && !target.src.endsWith(fallbackSrc)) {
    target.src = fallbackSrc;
  }
};

export default function LogosAliados({ className = '', variant = 'banner' }: LogosAliadosProps) {
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Alcaldía de Mosquera PNG */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
          <img
            src={LOGOS_CONFIG.alcaldia.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.alcaldia.fallbackSrc)}
            alt={LOGOS_CONFIG.alcaldia.alt}
            className="h-8 w-auto object-contain drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="hidden sm:block text-[10px] font-extrabold text-gray-800 leading-tight">
            <span className="block text-emerald-800">Alcaldía de</span>
            <span>Mosquera</span>
          </div>
        </div>

        {/* Gobernación de Cundinamarca PNG */}
        <div className="hidden md:flex items-center gap-2 pr-3 border-r border-gray-200">
          <img
            src={LOGOS_CONFIG.gobernacion.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.gobernacion.fallbackSrc)}
            alt={LOGOS_CONFIG.gobernacion.alt}
            className="h-6 w-auto object-contain rounded-xs drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Harry Salamanca Firma PNG */}
        <div className="hidden lg:flex items-center">
          <img
            src={LOGOS_CONFIG.harrySalamanca.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.harrySalamanca.fallbackSrc)}
            alt={LOGOS_CONFIG.harrySalamanca.alt}
            className="h-7 w-auto object-contain drop-shadow-xs"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 items-center justify-items-center py-6 px-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-gray-200 shadow-inner">
          {/* 1. Alcaldía de Mosquera PNG */}
          <div className="flex flex-col items-center text-center group">
            <div className="h-16 w-16 p-1 bg-white rounded-xl shadow-xs border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src={LOGOS_CONFIG.alcaldia.src}
                onError={(e) => handleImgError(e, LOGOS_CONFIG.alcaldia.fallbackSrc)}
                alt={LOGOS_CONFIG.alcaldia.alt}
                className="h-14 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-1.5 uppercase tracking-wider">
              {LOGOS_CONFIG.alcaldia.label}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">{LOGOS_CONFIG.alcaldia.sublabel}</span>
          </div>

          {/* 2. Gobernación de Cundinamarca PNG */}
          <div className="flex flex-col items-center text-center group">
            <div className="h-16 w-32 p-1.5 bg-white rounded-xl shadow-xs border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src={LOGOS_CONFIG.gobernacion.src}
                onError={(e) => handleImgError(e, LOGOS_CONFIG.gobernacion.fallbackSrc)}
                alt={LOGOS_CONFIG.gobernacion.alt}
                className="h-12 w-auto object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-1.5 uppercase tracking-wider">
              {LOGOS_CONFIG.gobernacion.label}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">{LOGOS_CONFIG.gobernacion.sublabel}</span>
          </div>

          {/* 3. Firma Harry Salamanca PNG */}
          <div className="flex flex-col items-center text-center group col-span-2 sm:col-span-1">
            <div className="h-16 w-36 p-1.5 bg-white rounded-xl shadow-xs border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src={LOGOS_CONFIG.harrySalamanca.src}
                onError={(e) => handleImgError(e, LOGOS_CONFIG.harrySalamanca.fallbackSrc)}
                alt={LOGOS_CONFIG.harrySalamanca.alt}
                className="h-14 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-1.5 uppercase tracking-wider">
              {LOGOS_CONFIG.harrySalamanca.label}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">{LOGOS_CONFIG.harrySalamanca.sublabel}</span>
          </div>

          {/* 4. HostAddrees PNG */}
          <div className="flex flex-col items-center text-center group">
            <div className="h-16 w-32 p-1.5 bg-white rounded-xl shadow-xs border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src={LOGOS_CONFIG.hostaddrees.src}
                onError={(e) => handleImgError(e, LOGOS_CONFIG.hostaddrees.fallbackSrc)}
                alt={LOGOS_CONFIG.hostaddrees.alt}
                className="h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-1.5 uppercase tracking-wider">
              {LOGOS_CONFIG.hostaddrees.label}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">{LOGOS_CONFIG.hostaddrees.sublabel}</span>
          </div>

          {/* 5. Universidad Externado PNG */}
          <div className="flex flex-col items-center text-center group">
            <div className="h-16 w-28 p-1.5 bg-white rounded-xl shadow-xs border border-gray-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src={LOGOS_CONFIG.externado.src}
                onError={(e) => handleImgError(e, LOGOS_CONFIG.externado.fallbackSrc)}
                alt={LOGOS_CONFIG.externado.alt}
                className="h-13 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 mt-1.5 uppercase tracking-wider">
              {LOGOS_CONFIG.externado.label}
            </span>
            <span className="text-[9px] text-gray-400 font-medium">{LOGOS_CONFIG.externado.sublabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // Variant: banner (showcased in Hero / Home page)
  return (
    <div className={`bg-white rounded-3xl p-6 border border-gray-200/80 shadow-md ${className}`}>
      <div className="text-center mb-4">
        <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Iniciativa Oficial en Mosquera, Cundinamarca
        </span>
        <h3 className="text-lg font-black text-gray-900 mt-2 font-heading">
          Respaldado por la Administración Municipal y Alianzas Estratégicas
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center justify-items-center pt-2">
        {/* Alcaldía Mosquera PNG */}
        <div className="flex flex-col items-center gap-1 group">
          <img
            src={LOGOS_CONFIG.alcaldia.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.alcaldia.fallbackSrc)}
            alt={LOGOS_CONFIG.alcaldia.alt}
            className="h-16 w-auto object-contain transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <span className="text-[11px] font-bold text-gray-700 text-center">Alcaldía de Mosquera</span>
        </div>

        {/* Gobernación de Cundinamarca PNG */}
        <div className="flex flex-col items-center gap-1 group">
          <img
            src={LOGOS_CONFIG.gobernacion.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.gobernacion.fallbackSrc)}
            alt={LOGOS_CONFIG.gobernacion.alt}
            className="h-12 w-auto object-contain rounded transition-transform group-hover:scale-110 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <span className="text-[11px] font-bold text-gray-700 text-center">Gobernación de Cundinamarca</span>
        </div>

        {/* Firma Harry Salamanca PNG */}
        <div className="flex flex-col items-center gap-1 group col-span-2 md:col-span-1">
          <img
            src={LOGOS_CONFIG.harrySalamanca.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.harrySalamanca.fallbackSrc)}
            alt={LOGOS_CONFIG.harrySalamanca.alt}
            className="h-14 w-auto object-contain transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <span className="text-[11px] font-bold text-gray-700 text-center">Harry Salamanca Concejal</span>
        </div>

        {/* HostAddrees PNG */}
        <div className="flex flex-col items-center gap-1 group">
          <img
            src={LOGOS_CONFIG.hostaddrees.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.hostaddrees.fallbackSrc)}
            alt={LOGOS_CONFIG.hostaddrees.alt}
            className="h-12 w-auto object-contain transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <span className="text-[11px] font-bold text-gray-700 text-center">HostAddrees</span>
        </div>

        {/* Externado PNG */}
        <div className="flex flex-col items-center gap-1 group">
          <img
            src={LOGOS_CONFIG.externado.src}
            onError={(e) => handleImgError(e, LOGOS_CONFIG.externado.fallbackSrc)}
            alt={LOGOS_CONFIG.externado.alt}
            className="h-14 w-auto object-contain transition-transform group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <span className="text-[11px] font-bold text-gray-700 text-center">U. Externado de Colombia</span>
        </div>
      </div>
    </div>
  );
}
