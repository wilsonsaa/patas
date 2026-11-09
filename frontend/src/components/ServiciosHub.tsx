import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Heart, Home, PawPrint, ShieldAlert, HandHeart, ClipboardList, ChevronRight, Building2, Siren } from 'lucide-react';
import { api } from '../api';

interface Tramite { radicado: string; nombre: string; creado_en: string; estado?: string }

/** Ventanilla de servicios de la Secretaría de Ambiente y la Dirección de Protección Animal. */
export default function ServiciosHub() {
  const { setVistaActiva, setModalRegistroHogarAbierto, setModalMascotaPropiaAbierto, setModalManejoEspecialAbierto, setModalDonarAbierto, setModalReportarAbierto,
    autenticado, modalMascotaPropiaAbierto, modalManejoEspecialAbierto, modalReportarAbierto, solicitudes } = useTheme();
  const [mascotas, setMascotas] = useState<Tramite[]>([]);
  const [especiales, setEspeciales] = useState<Tramite[]>([]);
  const [reportes, setReportes] = useState<Tramite[]>([]);

  useEffect(() => {
    if (!autenticado) { setMascotas([]); setEspeciales([]); setReportes([]); return; }
    // se vuelve a consultar al cerrar un formulario, para mostrar el trámite recién radicado
    if (modalMascotaPropiaAbierto || modalManejoEspecialAbierto || modalReportarAbierto) return;
    api.get<Tramite[]>('/mascotas-propias').then(setMascotas).catch(() => {});
    api.get<Tramite[]>('/manejo-especial').then(setEspeciales).catch(() => {});
    api.get<{ radicado: string; especie: string; referencia: string; creado_en: string; estado: string }[]>('/reportes/mios')
      .then((r) => setReportes(r.map((x) => ({ radicado: x.radicado, nombre: `${x.especie} · ${x.referencia || 'sin referencia'}`, creado_en: x.creado_en, estado: x.estado })))).catch(() => {});
  }, [autenticado, modalMascotaPropiaAbierto, modalManejoEspecialAbierto, modalReportarAbierto]);

  const servicios = [
    { icono: Siren, color: 'bg-rose-50 text-rose-700', titulo: 'Reportar un animal abandonado', texto: 'Marca en el mapa dónde está y avisamos a la Dirección de Protección Animal.', accion: () => setModalReportarAbierto(true), destacado: true },
    { icono: Heart, color: 'bg-emerald-50 text-emerald-700', titulo: 'Adoptar una mascota', texto: 'Conoce a los animales rescatados y postúlate a su adopción.', accion: () => setVistaActiva('mascotas') },
    { icono: PawPrint, color: 'bg-sky-50 text-sky-700', titulo: 'Registrar mi mascota', texto: 'Inscríbela en el censo municipal con sus datos de vacunación.', accion: () => setModalMascotaPropiaAbierto(true) },
    { icono: ShieldAlert, color: 'bg-amber-50 text-amber-700', titulo: 'Razas de manejo especial', texto: 'Registro obligatorio de caninos de manejo especial (Ley 1801 de 2016).', accion: () => setModalManejoEspecialAbierto(true) },
    { icono: Home, color: 'bg-teal-50 text-teal-700', titulo: 'Ser hogar de paso', texto: 'Acoge temporalmente a un animal rescatado. Tu ubicación es reservada.', accion: () => setModalRegistroHogarAbierto(true) },
    { icono: HandHeart, color: 'bg-rose-50 text-rose-700', titulo: 'Quiero donar', texto: 'Alimento, insumos, cobijas o tu tiempo como voluntario.', accion: () => setModalDonarAbierto(true) },
    { icono: Building2, color: 'bg-violet-50 text-violet-700', titulo: 'Refugios y puntos de atención', texto: 'Ubica el refugio municipal y sus horarios en el mapa.', accion: () => setVistaActiva('mapa') },
  ];

  const fecha = (f: string) => new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section id="servicios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
          <ClipboardList className="w-3.5 h-3.5" /> Ventanilla única
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight">Servicios y trámites</h2>
        <p className="text-gray-500 font-medium text-sm sm:text-base mt-1">
          Todo lo que la Secretaría de Ambiente y la Dirección de Protección Animal de Mosquera ofrecen para ti y tus animales, en un solo lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicios.map(({ icono: Icono, color, titulo, texto, accion, destacado }) => (
          <button key={titulo} onClick={accion} className={`group text-left bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col ${destacado ? 'sm:col-span-2 lg:col-span-3 border-rose-200 hover:border-rose-400' : 'border-gray-200/80 hover:border-emerald-300'}`}>
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}><Icono className="w-6 h-6" /></span>
            <h3 className="text-lg font-black text-gray-900 font-heading mt-4">{titulo}</h3>
            <p className="text-sm text-gray-600 mt-1 flex-1">{texto}</p>
            <span className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1">Empezar <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
          </button>
        ))}
      </div>

      {autenticado && (
        <div className="mt-12">
          <h3 className="text-2xl font-black text-gray-900 font-heading mb-4">Mis trámites</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ListaTramites titulo="Solicitudes de adopción" vacio="Aún no te has postulado a una adopción."
              items={solicitudes.map((s) => ({ radicado: s.radicado, nombre: s.mascotaNombre, creado_en: s.fechaSolicitud, estado: s.estado }))} fecha={fecha}
              verMas={() => setVistaActiva('solicitudes')} />
            <ListaTramites titulo="Mis mascotas registradas" vacio="Aún no has registrado mascotas." items={mascotas} fecha={fecha} />
            <ListaTramites titulo="Manejo especial" vacio="No tienes registros de manejo especial." items={especiales} fecha={fecha} />
            <ListaTramites titulo="Mis reportes de animales" vacio="No has reportado animales." items={reportes} fecha={fecha} />
          </div>
        </div>
      )}
    </section>
  );
}

function ListaTramites({ titulo, items, vacio, fecha, verMas }: { titulo: string; items: Tramite[]; vacio: string; fecha: (f: string) => string; verMas?: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-black text-gray-900">{titulo}</h4>
        {verMas && items.length > 0 && <button onClick={verMas} className="text-xs font-bold text-emerald-700 cursor-pointer">Ver detalle</button>}
      </div>
      {items.length === 0 ? <p className="text-xs text-gray-500">{vacio}</p> : (
        <ul className="divide-y divide-gray-100">
          {items.slice(0, 6).map((t) => (
            <li key={t.radicado} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{t.nombre}</p>
                <p className="text-[11px] text-gray-500 font-mono">{t.radicado} · {fecha(t.creado_en)}</p>
              </div>
              {t.estado && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">{t.estado}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
