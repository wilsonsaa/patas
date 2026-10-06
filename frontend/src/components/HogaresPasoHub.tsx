import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Home, PlusCircle, ShieldCheck, Lock } from 'lucide-react';
import MascotaCard from './MascotaCard';

export default function HogaresPasoHub() {
  const { refugios, pets, setModalRegistroHogarAbierto, setModalSubirMascotaAbierto, usuarioActivo } = useTheme();
  const [hogarSeleccionadoId, setHogarSeleccionadoId] = useState<string>('todos');

  const hogaresDePaso = refugios.filter((r) => r.tipo === 'hogar_paso');
  const mascotasEnHogares = pets.filter((p) => p.esHogarPaso && p.estado !== 'Adoptado');
  const mascotasMostradas = hogarSeleccionadoId === 'todos' ? mascotasEnHogares : mascotasEnHogares.filter((p) => p.hogarOrefugioId === hogarSeleccionadoId);
  const seleccionado = hogaresDePaso.find((h) => h.id === hogarSeleccionadoId);

  return (
    <section id="hogar-paso" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl mb-10">
        <div className="absolute top-4 right-6 text-7xl opacity-10 select-none pointer-events-none" aria-hidden="true">🐾</div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-3 border border-white/10">
            <Home className="w-3.5 h-3.5 text-emerald-300" /> Red solidaria de hogares de paso
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-tight">Sé el puente entre el rescate y su hogar para siempre.</h2>
          <p className="text-emerald-100 text-sm sm:text-base mt-3 leading-relaxed font-medium">
            Un <strong>hogar de paso</strong> acoge temporalmente a un animal rescatado mientras se recupera y encuentra familia. Tú pones el
            techo y el cariño; la Dirección de Protección Animal acompaña, verifica y gestiona la adopción.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {usuarioActivo.rol === 'hogar_paso' ? (
              <button id="btn-subir-mascota-hub" onClick={() => setModalSubirMascotaAbierto(true)} className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-emerald-900 shadow-md hover:bg-emerald-50 cursor-pointer flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Publicar mascota de mi hogar
              </button>
            ) : (
              <button id="btn-registrarse-hogar-hub" onClick={() => setModalRegistroHogarAbierto(true)} className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-emerald-900 shadow-md hover:bg-emerald-50 cursor-pointer flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-700" /> Inscribir mi hogar de paso
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-slate-700">
        <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Ubicación protegida.</strong> Para cuidar a las familias voluntarias y a los animales, los hogares de paso se identifican solo
          con un código. Su dirección y datos de contacto no se publican: las visitas se coordinan a través de tu solicitud de adopción.
        </p>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-end gap-2 mb-6">
          <div>
            <h3 className="text-2xl font-black text-gray-900 font-heading">Hogares de paso verificados</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Familias voluntarias verificadas por la Dirección de Protección Animal</p>
          </div>
          <div className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl shrink-0">{hogaresDePaso.length} activos</div>
        </div>

        {hogaresDePaso.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-3xl p-8 text-center">Aún no hay hogares de paso verificados. ¡Sé el primero en inscribirte!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hogaresDePaso.map((hogar) => {
              const libres = Math.max(0, hogar.capacidad - hogar.mascotasActuales);
              return (
                <div key={hogar.id} className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Verificado
                      </span>
                      <span className="text-xs font-bold text-gray-600">{libres} {libres === 1 ? 'cupo libre' : 'cupos libres'}</span>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Hogar de paso</p>
                    <h4 className="text-3xl font-black text-gray-900 font-mono tracking-tight">{hogar.codigo}</h4>
                    <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (hogar.mascotasActuales / hogar.capacidad) * 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">{hogar.mascotasActuales} de {hogar.capacidad} animales en resguardo</p>
                    {hogar.descripcion && <p className="text-xs text-gray-600 leading-relaxed mt-3">{hogar.descripcion}</p>}
                  </div>
                  <button onClick={() => { setHogarSeleccionadoId(hogar.id); document.getElementById('peluditos-hogares')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="mt-4 text-xs font-bold py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer">
                    Ver sus peluditos
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div id="peluditos-hogares" className="scroll-mt-40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-2xl font-black text-gray-900 font-heading">
              {seleccionado ? `Peluditos en el hogar ${seleccionado.codigo}` : 'Peluditos en hogares de paso'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Postúlate desde su hoja de vida y coordinamos la visita contigo</p>
          </div>
          {seleccionado && (
            <button onClick={() => setHogarSeleccionadoId('todos')} className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer">
              ← Ver todos los hogares
            </button>
          )}
        </div>
        {mascotasMostradas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mascotasMostradas.map((mascota) => <MascotaCard key={mascota.id} mascota={mascota} />)}
          </div>
        ) : (
          <p className="text-center py-12 bg-white rounded-3xl border border-gray-200 text-sm font-semibold text-gray-500">No hay mascotas publicadas en este hogar por ahora.</p>
        )}
      </div>
    </section>
  );
}
