import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './components/Header';
import MascotasGallery from './components/MascotasGallery';
import HogaresPasoHub from './components/HogaresPasoHub';
import SolicitudesManager from './components/SolicitudesManager';
import RefugiosYPersonas from './components/RefugiosYPersonas';
import MapaRefugios from './components/MapaRefugios';
import Footer from './components/Footer';
import Inicio from './components/Inicio';
import Legal from './components/Legal';
import AvisoCookies from './components/AvisoCookies';
import ModalHojaDeVida from './components/ModalHojaDeVida';
import ModalAdopcion from './components/ModalAdopcion';
import ModalRegistroHogar from './components/ModalRegistroHogar';
import ModalSubirMascota from './components/ModalSubirMascota';
import ModalRegistroAdoptante from './components/ModalRegistroAdoptante';
import ToastContainer from './components/ToastContainer';
import BarraMovil from './components/BarraMovil';
import ModalMascotaPropia from './components/ModalMascotaPropia';
import ModalManejoEspecial from './components/ModalManejoEspecial';
import ModalDonar from './components/ModalDonar';
import ServiciosHub from './components/ServiciosHub';
import PanelAdmin from './components/PanelAdmin';

function AppContent() {
  const { vistaActiva, mascotaSeleccionada, setMascotaSeleccionada, mascotaParaAdoptar, setMascotaParaAdoptar } = useTheme();

  return (
    <div className="min-h-dvh bg-[#faf8f5] font-sans flex flex-col pb-16 sm:pb-0 selection:bg-emerald-200 selection:text-emerald-900">
      <Header />

      {/* Main Dynamic Viewport */}
      <main className="flex-1">
        {vistaActiva === 'inicio' && <Inicio />}

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

        {(vistaActiva === 'privacidad' || vistaActiva === 'terminos') && <Legal />}

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
      <AvisoCookies />
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
