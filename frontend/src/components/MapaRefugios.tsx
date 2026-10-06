import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { RefugioHogar } from '../types';
import {
  MapPin,
  Building2,
  Home,
  Phone,
  Mail,
  Navigation,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  LocateFixed,
  Compass
} from 'lucide-react';

// Capas de mapa con licencia de uso abierta (Esri World Imagery y OpenStreetMap)
const GOOGLE_LAYERS = {
  hibrido: {
    nombre: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imágenes &copy; Esri, Maxar, Earthstar Geographics',
    icono: '🛰️'
  },
  satelite: {
    nombre: 'Relieve',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri y colaboradores',
    icono: '🌍'
  },
  calles: {
    nombre: 'Calles',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; colaboradores de OpenStreetMap',
    icono: '🗺️'
  }
};

// Los textos se insertan en HTML del mapa: siempre escapados.
const esc = (t: unknown) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// Coordenadas centrales de Mosquera, Cundinamarca
const MOSQUERA_CENTER: [number, number] = [4.7060, -74.2300];
const DEFAULT_ZOOM = 14;

export default function MapaRefugios() {
  const { refugios: lugares, setVistaActiva } = useTheme();
  // Solo se georreferencian refugios institucionales. Los hogares de paso NO tienen ubicación pública.
  const refugios = React.useMemo(() => lugares.filter((l) => l.tipo === 'refugio' && l.lat != null && l.lng != null), [lugares]);

  const [filtro, setFiltro] = useState<'todos' | 'refugio' | 'hogar_paso'>('todos');
  const [lugarSeleccionado, setLugarSeleccionado] = useState<RefugioHogar | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [tipoCapa, setTipoCapa] = useState<'hibrido' | 'satelite' | 'calles'>('hibrido');
  const [ubicacionUsuario, setUbicacionUsuario] = useState<[number, number] | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Inicializar Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevenir doble inicialización
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: MOSQUERA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false
      });

      // Capa inicial de Google Satelital Híbrido
      const initialLayer = L.tileLayer(GOOGLE_LAYERS[tipoCapa].url, {
        maxZoom: 20,
        attribution: GOOGLE_LAYERS[tipoCapa].attribution
      }).addTo(map);

      tileLayerRef.current = initialLayer;

      // Control de zoom en la esquina inferior derecha
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution discreta
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualizar capa de Google (Híbrido / Satélite / Calles)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const nuevaCapa = L.tileLayer(GOOGLE_LAYERS[tipoCapa].url, {
      maxZoom: 20,
      attribution: GOOGLE_LAYERS[tipoCapa].attribution
    }).addTo(map);

    tileLayerRef.current = nuevaCapa;
  }, [tipoCapa]);

  // Manejar cambio de tamaño (Resize / Pantalla Completa)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [pantallaCompleta]);

  // Renderizar marcadores de refugios y hogares de paso
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Limpiar marcadores previos
    Object.keys(markersRef.current).forEach((key) => {
      markersRef.current[key]?.remove();
    });
    markersRef.current = {};

    const itemsAMostrar = refugios.filter(
      (r) => filtro === 'todos' || r.tipo === filtro
    );

    itemsAMostrar.forEach((lugar) => {
      const isRefugio = lugar.tipo === 'refugio';
      const isSelected = lugarSeleccionado?.id === lugar.id;

      // HTML estilizado del icono personalizado con efecto de pulso
      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <!-- Pulse halo -->
          <div class="absolute -inset-2 rounded-full animate-ping opacity-40 ${
            isRefugio ? 'bg-emerald-500' : 'bg-amber-500'
          }"></div>
          
          <!-- Outer circle -->
          <div class="relative flex items-center justify-center w-11 h-11 rounded-2xl shadow-2xl border-2 transition-all transform hover:scale-115 ${
            isSelected
              ? 'ring-4 ring-white scale-120 z-50 ' + (isRefugio ? 'bg-emerald-600 border-white' : 'bg-amber-600 border-white')
              : isRefugio
              ? 'bg-emerald-700 border-emerald-300 text-white'
              : 'bg-amber-600 border-amber-300 text-white'
          }">
            <span class="text-lg">${isRefugio ? '🏢' : '🐾'}</span>
          </div>

          <!-- Label floating underneath -->
          <div class="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/20 shadow-lg pointer-events-none">
            ${esc(lugar.nombre.length > 22 ? lugar.nombre.slice(0, 20) + '…' : lugar.nombre)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([lugar.lat as number, lugar.lng as number], { icon: customIcon }).addTo(map);

      // Popup informativo enriquecido con acciones
      const popupHtml = `
        <div class="p-3 font-sans text-gray-900 max-w-[260px]">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span class="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isRefugio ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }">
              ${isRefugio ? '🏢 Refugio Oficial' : '🏠 Hogar de Paso'}
            </span>
            <span class="text-emerald-700 font-bold text-xs">✓ Verificado</span>
          </div>
          <h4 class="font-extrabold text-sm text-gray-900 leading-snug mb-1">${esc(lugar.nombre)}</h4>
          <p class="text-xs text-gray-600 mb-2 flex items-start gap-1">
            <span>📍</span> <span>${esc(lugar.direccion)}</span>
          </p>
          <div class="bg-gray-50 rounded-xl p-2 mb-2 text-xs border border-gray-200">
            <div class="flex justify-between text-gray-600">
              <span>Capacidad:</span>
              <span class="font-bold text-gray-900">${lugar.mascotasActuales} / ${lugar.capacidad} mascotas</span>
            </div>
            <div class="flex justify-between text-gray-600 mt-0.5">
              <span>Sector:</span>
              <span class="font-bold text-emerald-800">Mosquera</span>
            </div>
          </div>
          <div class="flex flex-col gap-1.5 pt-1">
            <a 
              href="https://wa.me/${(lugar.telefono ?? '').replace(/[^0-9]/g, '')}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-xs"
            >
              💬 Contactar WhatsApp
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -20],
        closeButton: true,
        className: 'custom-leaflet-popup'
      });

      marker.on('click', () => {
        setLugarSeleccionado(lugar);
      });

      markersRef.current[lugar.id] = marker;
    });
  }, [refugios, filtro, lugarSeleccionado]);

  // Centrar y abrir popup cuando se selecciona un lugar desde la lista
  const seleccionarYCentrar = (lugar: RefugioHogar) => {
    setLugarSeleccionado(lugar);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([lugar.lat as number, lugar.lng as number], 16, {
        animate: true,
        duration: 1.2
      });

      const marker = markersRef.current[lugar.id];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }
    }
  };

  // Centrar en todo Mosquera
  const resetearVistaMosquera = () => {
    setLugarSeleccionado(null);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(MOSQUERA_CENTER, DEFAULT_ZOOM, {
        animate: true,
        duration: 1.2
      });
      map.closePopup();
    }
  };

  // Geolocalización del Usuario con GPS
  const localizarUsuario = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setBuscandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUbicacionUsuario(coords);
        setBuscandoGps(false);

        const map = mapInstanceRef.current;
        if (map) {
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          // Marcador de usuario con pulso azul
          const userIconHtml = `
            <div class="relative flex items-center justify-center" style="transform: translate(-50%, -50%);">
              <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              <div class="relative w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-bold">
                ●
              </div>
            </div>
          `;

          const userIcon = L.divIcon({
            html: userIconHtml,
            className: 'user-gps-pin',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          userMarkerRef.current = L.marker(coords, { icon: userIcon })
            .addTo(map)
            .bindPopup('<b>Tu Ubicación Actual</b><br><span class="text-xs text-gray-500">Cálculo de cercanía en Mosquera</span>')
            .openPopup();

          map.flyTo(coords, 15, { animate: true, duration: 1.2 });
        }
      },
      (err) => {
        setBuscandoGps(false);
        console.warn('Error obteniendo ubicación:', err.message);
        alert('No pudimos acceder a tu ubicación GPS. Por favor habilita los permisos en tu navegador.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const refugiosFiltrados = refugios.filter(
    (r) => filtro === 'todos' || r.tipo === filtro
  );

  return (
    <section id="mapa" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-3 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Header Superior */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 pb-6 border-b border-gray-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
              <MapPin className="w-3.5 h-3.5" /> Puntos de atención georreferenciados
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-heading tracking-tight">
              Refugios y puntos de atención en Mosquera
            </h2>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
              Ubica los refugios y puntos institucionales. Los hogares de paso no aparecen en el mapa: su ubicación es reservada.
            </p>
          </div>

          <div className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200/70">🏢 {refugios.length} {refugios.length === 1 ? 'punto institucional' : 'puntos institucionales'}</div>
        </div>

        {/* Contenedor del Mapa con Leaflet y Google Satelital */}
        <div
          className={`bg-slate-900 border border-gray-200 shadow-inner flex flex-col lg:flex-row transition-all duration-300 rounded-3xl overflow-hidden ${
            pantallaCompleta ? 'fixed inset-4 z-50 rounded-2xl' : 'h-[78dvh] min-h-[480px] sm:h-[620px] relative'
          }`}
        >
          {/* Área del Mapa Interactivo con Leaflet */}
          <div className="flex-1 h-full relative z-0">
            {/* Div donde monta Leaflet */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Barra de Controles Superiores Flotantes sobre el Mapa */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-between items-center gap-2 pointer-events-none z-[400]">
              {/* Selector de Capa Satelital de Google */}
              <div className="bg-black/75 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-1 pointer-events-auto">
                <span className="text-[10px] font-bold text-emerald-400 px-2 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Capa:
                </span>
                <button
                  onClick={() => setTipoCapa('hibrido')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    tipoCapa === 'hibrido'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Imágenes satelitales"
                >
                  🛰️ Satélite
                </button>
                <button
                  onClick={() => setTipoCapa('satelite')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    tipoCapa === 'satelite'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Mapa topográfico"
                >
                  🌍 Relieve
                </button>
                <button
                  onClick={() => setTipoCapa('calles')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    tipoCapa === 'calles'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Mapa de calles"
                >
                  🗺️ Calles
                </button>
              </div>

              {/* Botones de Acción Rápida (GPS, Centrar, Pantalla Completa) */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={localizarUsuario}
                  disabled={buscandoGps}
                  className="bg-white/90 hover:bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Ver mi ubicación en el mapa"
                >
                  <LocateFixed className={`w-3.5 h-3.5 text-blue-600 ${buscandoGps ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{buscandoGps ? 'Buscando GPS...' : 'Mi Ubicación'}</span>
                </button>

                <button
                  onClick={resetearVistaMosquera}
                  className="bg-white/90 hover:bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Centrar mapa en Mosquera"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Centrar Mosquera</span>
                </button>

                <button
                  onClick={() => setPantallaCompleta(!pantallaCompleta)}
                  className="bg-black/75 hover:bg-black text-white p-2 rounded-2xl border border-white/20 shadow-lg transition-all cursor-pointer"
                  title={pantallaCompleta ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
                >
                  {pantallaCompleta ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Badge inferior con créditos satelitales */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-semibold px-3 py-1 rounded-xl border border-white/10 z-[400] pointer-events-none flex items-center gap-1.5">
              <span>🛰️ Municipio de Mosquera, Cundinamarca</span>
            </div>
          </div>

          {/* Panel Lateral: Lista Interactiva de Puntos y Ficha Detallada */}
          <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col h-56 sm:h-72 lg:h-full z-10 shadow-lg">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">
                  {lugarSeleccionado ? 'Detalles del Punto' : `Puntos en Mosquera (${refugiosFiltrados.length})`}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lugarSeleccionado
                    ? 'Haz clic en el mapa para ver otro punto'
                    : 'Toca un punto para centrarlo en el mapa'}
                </p>
              </div>
              {lugarSeleccionado && (
                <button
                  onClick={() => setLugarSeleccionado(null)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 cursor-pointer shadow-2xs"
                >
                  Ver todos
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {lugarSeleccionado ? (
                // Vista detallada del lugar seleccionado
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                        lugarSeleccionado.tipo === 'refugio'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {lugarSeleccionado.tipo === 'refugio' ? '🏢 Refugio Oficial' : '🏠 Hogar de Paso'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                    </span>
                  </div>

                  <h4 className="text-base font-black text-gray-900 leading-snug">
                    {lugarSeleccionado.nombre}
                  </h4>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {lugarSeleccionado.descripcion}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-200/60 text-xs">
                    <p className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{lugarSeleccionado.direccion}</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{lugarSeleccionado.telefono}</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{lugarSeleccionado.correo}</span>
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Responsable:</span>
                      <span className="font-bold text-gray-900 text-right">{lugarSeleccionado.responsable}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Horario de atención:</span>
                      <span className="font-bold text-gray-900 text-right">{lugarSeleccionado.horario}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Animales actualmente:</span>
                      <span className="font-extrabold text-emerald-700">
                        {lugarSeleccionado.mascotasActuales} de {lugarSeleccionado.capacidad} cupos
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`https://wa.me/${(lugarSeleccionado.telefono ?? '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                    <button
                      onClick={() => {
                        setVistaActiva('mascotas');
                        window.scrollTo({ top: 500, behavior: 'smooth' });
                      }}
                      className="text-center bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      🐾 Ver Mascotas
                    </button>
                  </div>
                </div>
              ) : (
                // Lista de todos los puntos filtrados
                refugiosFiltrados.map((lugar) => {
                  const isRefugio = lugar.tipo === 'refugio';
                  return (
                    <div
                      key={lugar.id}
                      onClick={() => seleccionarYCentrar(lugar)}
                      className="p-3 bg-gray-50 hover:bg-emerald-50/70 rounded-2xl border border-gray-200/80 hover:border-emerald-300 transition-all cursor-pointer text-left group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
                            isRefugio ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isRefugio ? 'Refugio Oficial' : 'Hogar de Paso'}
                        </span>
                        <span className="text-[10px] text-gray-400 group-hover:text-emerald-700 font-bold flex items-center gap-0.5">
                          Ver en mapa →
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 group-hover:text-emerald-900 leading-snug">
                        {lugar.nombre}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{lugar.direccion}</span>
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-200/60 flex justify-between items-center text-[10px] text-gray-500">
                        <span>Capacidad: {lugar.mascotasActuales}/{lugar.capacidad}</span>
                        <span className="font-semibold text-emerald-800">Sector Mosquera</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
