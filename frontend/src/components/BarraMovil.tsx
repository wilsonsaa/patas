import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Home, PawPrint, LayoutGrid, HandHeart, User, PlusCircle } from 'lucide-react';

/** Barra de navegación inferior para celulares: lo esencial al alcance del pulgar. */
export default function BarraMovil() {
  const { vistaActiva, setVistaActiva, setModalDonarAbierto, setModalRegistroAdoptanteAbierto, setModalSubirMascotaAbierto, autenticado, esGestor, usuarioActivo } = useTheme();
  const ir = (vista: 'inicio' | 'mascotas' | 'servicios') => () => { setVistaActiva(vista); window.scrollTo({ top: 0 }); };
  const item = (activo: boolean) => `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold cursor-pointer ${activo ? 'text-emerald-700' : 'text-gray-500'}`;

  return (
    <nav aria-label="Navegación principal" className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        <button onClick={ir('inicio')} className={item(vistaActiva === 'inicio')} aria-current={vistaActiva === 'inicio' ? 'page' : undefined}><Home className="w-5 h-5" />Inicio</button>
        <button onClick={ir('mascotas')} className={item(vistaActiva === 'mascotas')} aria-current={vistaActiva === 'mascotas' ? 'page' : undefined}><PawPrint className="w-5 h-5" />Adoptar</button>
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => (esGestor ? setModalSubirMascotaAbierto(true) : setModalDonarAbierto(true))}
            className={`-mt-5 w-14 h-14 rounded-full text-white shadow-lg flex flex-col items-center justify-center text-[9px] font-bold border-4 border-white cursor-pointer active:scale-95 transition-transform ${esGestor ? 'bg-emerald-600' : 'bg-rose-600'}`}
            aria-label={esGestor ? 'Publicar mascota' : 'Quiero donar'}
          >
            {esGestor ? <PlusCircle className="w-5 h-5" /> : <HandHeart className="w-5 h-5" />}
            {esGestor ? 'Publicar' : 'Donar'}
          </button>
        </div>
        <button onClick={ir('servicios')} className={item(vistaActiva === 'servicios')} aria-current={vistaActiva === 'servicios' ? 'page' : undefined}><LayoutGrid className="w-5 h-5" />Servicios</button>
        <button onClick={() => setModalRegistroAdoptanteAbierto(true)} className={item(false)}><User className="w-5 h-5" />{autenticado ? usuarioActivo.nombre.split(' ')[0].slice(0, 9) : 'Ingresar'}</button>
      </div>
    </nav>
  );
}
