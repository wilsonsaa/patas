import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './components/Header';
import Hero from './components/Hero';
import PasosAdopcion from './components/PasosAdopcion';
import MascotasGallery from './components/MascotasGallery';
import HogaresPasoHub from './components/HogaresPasoHub';
import SolicitudesManager from './components/SolicitudesManager';
import RefugiosYPersonas from './components/RefugiosYPersonas';
import MapaRefugios from './components/MapaRefugios';
import Footer from './components/Footer';
import ModalHojaDeVida from './components/ModalHojaDeVida';
import ModalAdopcion from './components/ModalAdopcion';
import ModalRegistroHogar from './components/ModalRegistroHogar';
import ModalSubirMascota from './components/ModalSubirMascota';
import ModalRegistroAdoptante from './components/ModalRegistroAdoptante';
import ToastContainer from './components/ToastContainer';
import BarraMovil from './components/BarraMovil';
import LogosAliados from './components/LogosAliados';
import ModalMascotaPropia from './components/ModalMascotaPropia';
import ModalManejoEspecial from './components/ModalManejoEspecial';
import ModalDonar from './components/ModalDonar';
import ServiciosHub from './components/ServiciosHub';
import PanelAdmin from './components/PanelAdmin';
import { Heart, PawPrint, ShieldAlert, HandHeart } from 'lucide-react';

function AppContent() {
  const {
    vistaActiva,
    setVistaActiva,
    mascotaSeleccionada,
    setMascotaSeleccionada,
    mascotaParaAdoptar,
    setMascotaParaAdoptar,
    setModalRegistroHogarAbierto,
    setModalSubirMascotaAbierto,
    setModalMascotaPropiaAbierto,
    setModalManejoEspecialAbierto,
    setModalDonarAbierto
  } = useTheme();

  return (
    <div className="min-h-dvh bg-[#faf8f5] font-sans flex flex-col pb-16 sm:pb-0 selection:bg-emerald-200 selection:text-emerald-900">
      <Header />

      {/* Main Dynamic Viewport */}
      <main className="flex-1">
        {vistaActiva === 'inicio' && (
          <>
            <Hero />

            {/* Accesos rápidos a los servicios */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-30 mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { titulo: 'Quiero adoptar', texto: 'Conoce a los peluditos y postúlate', icono: Heart, color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600', accion: () => setVistaActiva('mascotas') },
                  { titulo: 'Registrar mi mascota', texto: 'Censo municipal y vacunación', icono: PawPrint, color: 'bg-sky-50 text-sky-600 group-hover:bg-sky-600', accion: () => setModalMascotaPropiaAbierto(true) },
                  { titulo: 'Manejo especial', texto: 'Registro de razas de manejo especial', icono: ShieldAlert, color: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500', accion: () => setModalManejoEspecialAbierto(true) },
                  { titulo: 'Quiero donar', texto: 'Alimento, insumos o tu tiempo', icono: HandHeart, color: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600', accion: () => setModalDonarAbierto(true) },
                ].map(({ titulo, texto, icono: Icono, color, accion }) => (
                  <button
                    key={titulo}
                    onClick={accion}
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-emerald-300 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-3 text-left"
                  >
                    <span className={`w-11 h-11 rounded-xl group-hover:text-white flex items-center justify-center transition-colors shrink-0 ${color}`}>
                      <Icono className="w-6 h-6" />
                    </span>
                    <span>
                      <span className="block text-sm sm:text-base font-black text-gray-900 font-heading leading-tight">{titulo}</span>
                      <span className="block text-xs text-gray-500 font-medium mt-0.5">{texto}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <PasosAdopcion />

            {/* Institutional Endorsement Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
              <LogosAliados variant="banner" />
            </div>

            {/* Gallery in Home */}
            <MascotasGallery />

            {/* El mapa en el inicio solo en pantallas grandes; en celular está en el menú */}
            <div className="hidden sm:block"><MapaRefugios /></div>
          </>
        )}

        {vistaActiva === 'mascotas' && (
          <div className="py-6">
            <MascotasGallery />
          </div>
        )}

        {vistaActiva === 'hogares' && (
          <div className="py-6">
            <HogaresPasoHub />
          </div>
        )}

        {vistaActiva === 'solicitudes' && (
          <div className="py-6">
            <SolicitudesManager />
          </div>
        )}

        {vistaActiva === 'refugios_personas' && (
          <div className="py-6">
            <RefugiosYPersonas />
          </div>
        )}

        {vistaActiva === 'servicios' && (
          <div className="py-6">
            <ServiciosHub />
          </div>
        )}

        {vistaActiva === 'panel' && (
          <div className="py-6">
            <PanelAdmin />
          </div>
        )}

        {vistaActiva === 'mapa' && (
          <div className="py-6">
            <MapaRefugios />
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {mascotaSeleccionada && (
        <ModalHojaDeVida
          mascota={mascotaSeleccionada}
          onClose={() => setMascotaSeleccionada(null)}
        />
      )}

      {mascotaParaAdoptar && (
        <ModalAdopcion
          mascota={mascotaParaAdoptar}
          onClose={() => setMascotaParaAdoptar(null)}
        />
      )}

      <ModalRegistroHogar />
      <ModalSubirMascota />
      <ModalRegistroAdoptante />
      <ModalMascotaPropia />
      <ModalManejoEspecial />
      <ModalDonar />
      <BarraMovil />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
