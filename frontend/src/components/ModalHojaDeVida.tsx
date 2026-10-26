import React, { useState } from 'react';
import { Pet } from '../types';
import { useTheme } from '../context/ThemeContext';
import { X, CheckCircle2, ShieldCheck, Heart, MapPin, Calendar, Home, MessageCircle, AlertCircle, Sparkles, PawPrint, MapPinned } from 'lucide-react';
import ModalHallazgo from './ModalHallazgo';

interface ModalHojaDeVidaProps {
  mascota: Pet;
  onClose: () => void;
}

export default function ModalHojaDeVida({ mascota, onClose }: ModalHojaDeVidaProps) {
  const { setMascotaParaAdoptar, refugios, usuarioActivo } = useTheme();
  const [editarHallazgo, setEditarHallazgo] = useState(false);
  // georreferencian: administración, refugios y el hogar de paso que tiene a cargo al animal
  const puedeGestionar = usuarioActivo.rol === 'admin' || usuarioActivo.rol === 'refugio_admin' ||
    (usuarioActivo.rol === 'hogar_paso' && usuarioActivo.lugarId === mascota.hogarOrefugioId);
  const [fotoActiva, setFotoActiva] = useState(0);

  // Find shelter or foster home details
  const hogarDetalles = refugios.find(r => r.id === mascota.hogarOrefugioId);

  const handleStartAdopt = () => {
    onClose();
    setMascotaParaAdoptar(mascota);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-6 overscroll-contain">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors backdrop-blur-xs"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Columna Izquierda: Galería de Fotos */}
          <div className="bg-gray-900 flex flex-col justify-between relative">
            <div className="relative h-72 md:h-full min-h-[300px]">
              <img
                src={mascota.fotos[fotoActiva] || mascota.fotos[0]}
                alt={mascota.nombre}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {mascota.estado}
              </div>

              {/* Thumbnails si tiene varias fotos */}
              {mascota.fotos.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 px-4 z-20">
                  {mascota.fotos.map((foto, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFotoActiva(idx)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        fotoActiva === idx ? 'border-white scale-110 shadow-lg' : 'border-white/50 opacity-70'
                      }`}
                    >
                      <img src={foto} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Hoja de Vida y Datos Médicos */}
          <div className="p-6 md:p-8 flex flex-col justify-between max-h-[80vh] overflow-y-auto">
            <div>
              {/* Encabezado */}
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                <span>{mascota.especie === 'perro' ? '🐕 Canino' : '🐈 Felino'}</span>
                <span>•</span>
                <span>{mascota.raza}</span>
              </div>

              <h2 className="text-3xl font-black text-gray-900 font-heading">
                {mascota.nombre}
              </h2>

              <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {mascota.municipio}
              </p>

              {/* Ficha Rápida */}
              <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Edad</span>
                  <span className="text-xs font-bold text-gray-800">{mascota.edadTexto}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Género</span>
                  <span className="text-xs font-bold text-gray-800">{mascota.genero}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Tamaño</span>
                  <span className="text-xs font-bold text-gray-800">{mascota.tamano}</span>
                </div>
              </div>

              {/* Historia y Personalidad */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Historia & Personalidad
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                  {mascota.descripcion}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {mascota.temperamento.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      🐾 {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Registro Clínico / Estado de Salud */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Estado Veterinario & Sanitario
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${mascota.salud.vacunado ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${mascota.salud.vacunado ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">Vacunación al día</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${mascota.salud.esterilizado ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${mascota.salud.esterilizado ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">Esterilizado(a)</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${mascota.salud.desparasitado ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${mascota.salud.desparasitado ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">Desparasitado(a)</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${mascota.salud.microchip ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${mascota.salud.microchip ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="font-semibold">{mascota.salud.microchip ? 'Microchip registrado' : 'Sin microchip'}</span>
                  </div>
                </div>

                {mascota.salud.detallesMedicos && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <strong className="text-gray-700">Notas de salud: </strong>{mascota.salud.detallesMedicos}
                  </p>
                )}
              </div>

              {/* Dónde fue rescatado (solo la referencia escrita; la coordenada es interna) */}
              {(mascota.hallazgoReferencia || puedeGestionar) && (
                <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPinned className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Lugar de rescate</p>
                      <p className="text-sm text-gray-700">{mascota.hallazgoReferencia || 'Sin registrar'}{mascota.hallazgoFecha ? ` · ${new Date(mascota.hallazgoFecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
                    </div>
                  </div>
                  {puedeGestionar && (
                    <button type="button" onClick={() => setEditarHallazgo(true)} className="text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg shrink-0 cursor-pointer">
                      {mascota.hallazgoReferencia ? 'Editar' : 'Georreferenciar'}
                    </button>
                  )}
                </div>
              )}

              {/* Responsable / Hogar de Paso */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-900">
                    {mascota.esHogarPaso ? 'Hogar de Paso Voluntario' : 'Refugio Oficial'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{mascota.hogarOrefugioNombre}</p>
                {hogarDetalles && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hogarDetalles.tipo === 'hogar_paso'
                      ? 'Ubicación reservada. La visita se coordina con tu solicitud de adopción.'
                      : `${hogarDetalles.direccion} • Tel: ${hogarDetalles.telefono}`}
                  </p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5">
              {mascota.contactoWhatsapp && (
                <a
                  href={`https://wa.me/${mascota.contactoWhatsapp}?text=${encodeURIComponent(`¡Hola! Vi a ${mascota.nombre} en PATAS (Plataforma de Acogida Temporal y Adopción Segura) y me gustaría recibir más información para adoptarlo(a).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Preguntar por WhatsApp
                </a>
              )}

              {mascota.estado === 'Disponible' ? (
                <button
                  id="btn-postular-adopcion"
                  onClick={handleStartAdopt}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--color-acento)' }}
                >
                  <Heart className="w-4 h-4 fill-white" />
                  Llenar Solicitud de Adopción
                </button>
              ) : (
                <div className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gray-100 text-gray-500 text-center flex items-center justify-center">
                  Esta mascota está actualmente en proceso de adopción
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {editarHallazgo && <ModalHallazgo mascota={mascota} onClose={() => setEditarHallazgo(false)} />}
    </div>
  );
}
