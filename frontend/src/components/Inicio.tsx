import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Heart, PawPrint, ShieldAlert, Home, HandHeart, ArrowRight, Search, FileCheck2, HeartHandshake, Lock, ShieldCheck, Stethoscope, Quote, MapPin } from 'lucide-react';
import MascotaCard from './MascotaCard';

const Etiqueta = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-2">{children}</p>
);
const Titulo = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight leading-tight">{children}</h2>
);

/** Página de inicio: cada bloque cuenta una sola cosa y ninguna acción se repite. */
export default function Inicio() {
  const { pets, refugios, adopcionesExitosas, setVistaActiva, setModalMascotaPropiaAbierto, setModalManejoEspecialAbierto, setModalRegistroHogarAbierto, setModalDonarAbierto } = useTheme();

  const disponibles = pets.filter((p) => p.estado === 'Disponible');
  const destacadas = disponibles.slice(0, 3);
  const hogares = refugios.filter((r) => r.tipo === 'hogar_paso').length;
  const historias = adopcionesExitosas.filter((a) => a.testimonio).slice(0, 3);

  const cifras = [
    { valor: disponibles.length, texto: 'esperan una familia' },
    { valor: hogares, texto: 'hogares de paso verificados' },
    { valor: adopcionesExitosas.length, texto: 'adopciones logradas' },
  ];

  const tramites = [
    { icono: PawPrint, color: 'bg-sky-50 text-sky-700', titulo: 'Registra a tu mascota', texto: 'Inscríbela en el censo municipal con sus vacunas. Te sirve en cada jornada de vacunación y esterilización.', accion: () => setModalMascotaPropiaAbierto(true) },
    { icono: ShieldAlert, color: 'bg-amber-50 text-amber-700', titulo: 'Razas de manejo especial', texto: 'Si tu perro es de manejo especial, la ley te pide registrarlo. Hazlo aquí en minutos.', accion: () => setModalManejoEspecialAbierto(true) },
    { icono: Home, color: 'bg-teal-50 text-teal-700', titulo: 'Sé hogar de paso', texto: 'Acoge por un tiempo a un animal rescatado. Tu dirección nunca se publica.', accion: () => setModalRegistroHogarAbierto(true) },
  ];

  const pasos = [
    { icono: Search, titulo: 'Conoce', texto: 'Mira la hoja de vida de cada animal: carácter, salud y su historia.' },
    { icono: FileCheck2, titulo: 'Postúlate', texto: 'Cuéntanos de tu hogar y tu familia. Recibes un número de radicado.' },
    { icono: HeartHandshake, titulo: 'Conózcanse', texto: 'Coordinamos una entrevista y la visita para que se encuentren.' },
    { icono: Heart, titulo: 'Bienvenido a casa', texto: 'Formalizamos la entrega y te acompañamos después de la adopción.' },
  ];

  const garantias = [
    { icono: Lock, titulo: 'Hogares de paso protegidos', texto: 'Se identifican con un código. Su ubicación y contacto son reservados.' },
    { icono: ShieldCheck, titulo: 'Verificación institucional', texto: 'La Dirección de Protección Animal visita y aprueba cada hogar antes de activarlo.' },
    { icono: Stethoscope, titulo: 'Animales con historia clínica', texto: 'Cada mascota se publica con su estado de vacunas, esterilización y desparasitación.' },
  ];

  return (
    <>
      {/* 1. Qué es PATAS, en una frase */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-5">
              <MapPin className="w-3.5 h-3.5" /> Protección animal de Mosquera, Cundinamarca
            </p>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 font-heading tracking-tight leading-[1.05]">
              Cada animal merece <span className="text-emerald-600">un hogar seguro.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl">
              PATAS reúne en un solo lugar la adopción, los hogares de paso y los trámites de tenencia responsable del municipio.
              Para quienes buscan un compañero y para quienes ya lo tienen.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button id="hero-btn-adoptar" onClick={() => setVistaActiva('mascotas')} className="flex items-center justify-center gap-2 px-7 py-4 text-base font-bold rounded-2xl text-white shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>
                <Heart className="w-5 h-5 fill-white" /> Quiero adoptar
              </button>
              <button id="hero-btn-servicios" onClick={() => setVistaActiva('servicios')} className="flex items-center justify-center gap-2 px-7 py-4 text-base font-bold rounded-2xl text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                Ver todos los servicios <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <img src="/logos/portada.png" alt="Familia con un perro y un gato adoptados" className="w-full aspect-[4/3] object-cover rounded-[2rem] shadow-2xl shadow-emerald-900/10" fetchPriority="high" />
            <dl className="relative sm:absolute sm:-bottom-6 sm:left-6 sm:right-6 mt-4 sm:mt-0 grid grid-cols-3 bg-white rounded-2xl shadow-xl border border-gray-100 divide-x divide-gray-100">
              {cifras.map((c) => (
                <div key={c.texto} className="px-3 py-4 text-center">
                  <dt className="sr-only">{c.texto}</dt>
                  <dd className="text-2xl sm:text-3xl font-black text-emerald-700 font-heading leading-none">{c.valor}</dd>
                  <dd className="text-[11px] sm:text-xs font-semibold text-gray-500 mt-1 leading-tight">{c.texto}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 2. Ellos primero: una muestra, no el catálogo completo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-24 pb-12">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <Etiqueta>Te están esperando</Etiqueta>
            <Titulo>Conoce a quienes buscan familia</Titulo>
          </div>
          {disponibles.length > 3 && (
            <button onClick={() => setVistaActiva('mascotas')} className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900 shrink-0 cursor-pointer">
              Ver las {disponibles.length} mascotas <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {destacadas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destacadas.map((m) => <MascotaCard key={m.id} mascota={m} />)}
          </div>
        ) : (
          <p className="bg-white border border-gray-200 rounded-3xl p-10 text-center text-gray-600">
            En este momento no hay mascotas disponibles. Vuelve pronto: cada semana llegan nuevos rescatados.
          </p>
        )}
        {disponibles.length > 3 && (
          <button onClick={() => setVistaActiva('mascotas')} className="sm:hidden mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 cursor-pointer">
            Ver las {disponibles.length} mascotas <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </section>

      {/* 3. Cómo se adopta */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl mb-10">
            <Etiqueta>Adopción responsable</Etiqueta>
            <Titulo>Cuatro pasos, sin costo y con acompañamiento</Titulo>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
            {pasos.map(({ icono: Icono, titulo, texto }, i) => (
              <li key={titulo} className="flex lg:flex-col gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center"><Icono className="w-6 h-6" /></span>
                  <span className="hidden lg:block text-5xl font-black text-gray-100 font-heading leading-none" aria-hidden="true">{i + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 font-heading"><span className="lg:hidden text-emerald-600">{i + 1}. </span>{titulo}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Para quienes ya tienen mascota o quieren ayudar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="max-w-2xl mb-8">
          <Etiqueta>Tenencia responsable</Etiqueta>
          <Titulo>¿Ya tienes un compañero? Esto también es para ti</Titulo>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tramites.map(({ icono: Icono, color, titulo, texto, accion }) => (
            <button key={titulo} onClick={accion} className="group text-left bg-white rounded-3xl p-6 border border-gray-200/80 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer flex flex-col">
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}><Icono className="w-6 h-6" /></span>
              <h3 className="text-lg font-black text-gray-900 font-heading mt-4">{titulo}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mt-1 flex-1">{texto}</p>
              <span className="mt-4 text-sm font-bold text-emerald-700 flex items-center gap-1">Empezar <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Por qué confiar */}
      <section className="bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid lg:grid-cols-3 gap-10 items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300 mb-2">Adopción segura</p>
            <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight leading-tight">Cuidamos a los animales y a quienes los cuidan.</h2>
          </div>
          <ul className="lg:col-span-2 grid sm:grid-cols-3 gap-6">
            {garantias.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo}>
                <Icono className="w-7 h-7 text-emerald-300" />
                <h3 className="font-bold text-base mt-3">{titulo}</h3>
                <p className="text-sm text-emerald-100/90 leading-relaxed mt-1">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Historias reales (solo si existen) */}
      {historias.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl mb-8">
            <Etiqueta>Finales felices</Etiqueta>
            <Titulo>Familias que ya dieron el paso</Titulo>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {historias.map((h) => (
              <figure key={h.id} className="bg-white rounded-3xl p-6 border border-gray-200/80 flex flex-col">
                <Quote className="w-6 h-6 text-emerald-300" />
                <blockquote className="text-sm text-gray-700 leading-relaxed mt-3 flex-1">{h.testimonio}</blockquote>
                <figcaption className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                  {h.mascotaFoto && <img src={h.mascotaFoto} alt="" className="w-11 h-11 rounded-full object-cover bg-gray-100" loading="lazy" />}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{h.adoptanteNombre} y {h.mascotaNombre}</p>
                    <p className="text-xs text-gray-500">{h.refugioOHogar}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 7. Cierre: la otra forma de ayudar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-[2rem] bg-gradient-to-r from-rose-600 to-orange-500 text-white p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black font-heading leading-tight">¿No puedes adoptar? También puedes ayudar.</h2>
            <p className="text-white/90 mt-2 text-sm sm:text-base">Alimento, medicamentos, cobijas o unas horas de tu tiempo cambian la vida de un animal rescatado.</p>
          </div>
          <button id="inicio-btn-donar" onClick={() => setModalDonarAbierto(true)} className="shrink-0 flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white text-rose-700 font-bold shadow-lg hover:-translate-y-0.5 transition-transform cursor-pointer">
            <HandHeart className="w-5 h-5" /> Quiero donar
          </button>
        </div>
      </section>
    </>
  );
}
