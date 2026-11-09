import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Home, PawPrint, ShieldAlert, HandHeart, Lock, LayoutDashboard, HeartHandshake, MapPinned, Users, Building2 } from 'lucide-react';
import PanelAdopciones from './PanelAdopciones';
import PanelHallazgos from './PanelHallazgos';
import PanelUsuarios from './PanelUsuarios';
import PanelRefugios from './PanelRefugios';
import { api } from '../api';

type Fila = Record<string, any>;
type Tabla = 'hogares' | 'mascotas' | 'especial' | 'donaciones';
type Pestana = Tabla | 'adopciones' | 'hallazgos' | 'usuarios' | 'refugios';
const fecha = (f?: string) => (f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const claseSelect = 'text-xs font-bold p-1.5 rounded-lg border border-gray-300 bg-white';

/** Panel de la Dirección de Protección Animal. Aquí sí se ven los datos reservados. */
export default function PanelAdmin() {
  const { esAdmin, usuarioActivo, addToast, recargar } = useTheme();
  const esHogar = usuarioActivo.rol === 'hogar_paso';
  const puedeVer = esAdmin || usuarioActivo.rol === 'refugio_admin' || esHogar;
  const [pestana, setPestana] = useState<Pestana>('adopciones');
  const [datos, setDatos] = useState<Record<Tabla, Fila[]>>({ hogares: [], mascotas: [], especial: [], donaciones: [] });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    if (!puedeVer || esHogar) { setCargando(false); return; }
    setCargando(true);
    try {
      const [hogares, mascotas, especial, donaciones] = await Promise.all([
        esAdmin ? api.get<Fila[]>('/admin/hogares') : Promise.resolve([]),
        api.get<Fila[]>('/mascotas-propias?todas=1'),
        esAdmin ? api.get<Fila[]>('/manejo-especial?todas=1') : Promise.resolve([]),
        api.get<Fila[]>('/donaciones'),
      ]);
      setDatos({ hogares, mascotas, especial, donaciones });
    } catch (e) { addToast('error', 'No se pudo cargar el panel', e instanceof Error ? e.message : ''); }
    finally { setCargando(false); }
  }, [puedeVer, esAdmin, esHogar, addToast]);
  useEffect(() => { cargar(); }, [cargar]);

  if (!puedeVer) return <p className="max-w-3xl mx-auto p-10 text-center text-sm text-gray-600">Esta sección es solo para el equipo de la Dirección de Protección Animal.</p>;

  const cambiar = async (ruta: string, cuerpo: unknown) => {
    try { await api.patch(ruta, cuerpo); await Promise.all([cargar(), recargar()]); addToast('success', 'Guardado', 'El estado quedó actualizado.'); }
    catch (e) { addToast('error', 'No se pudo guardar', e instanceof Error ? e.message : ''); }
  };

  const pestanas = ([
    ['adopciones', 'Seguimiento de adopciones', HeartHandshake, 0, true],
    ['hallazgos', 'Mapa de hallazgos', MapPinned, 0, true],
    ['hogares', 'Hogares de paso', Home, datos.hogares.filter((h) => h.estado === 'pendiente').length, esAdmin],
    ['mascotas', 'Mascotas registradas', PawPrint, 0, !esHogar],
    ['especial', 'Manejo especial', ShieldAlert, datos.especial.filter((r) => r.estado === 'Radicado').length, esAdmin],
    ['donaciones', 'Donaciones', HandHeart, datos.donaciones.filter((d) => d.estado === 'Nueva').length, !esHogar],
    ['refugios', 'Refugios', Building2, 0, esAdmin],
    ['usuarios', 'Usuarios', Users, 0, esAdmin],
  ] as const).filter((p) => p[4]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-2">
          <LayoutDashboard className="w-3.5 h-3.5" /> Panel institucional
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 font-heading tracking-tight">{esHogar ? usuarioActivo.nombreOrganizacion ?? 'Mi hogar de paso' : 'Dirección de Protección Animal'}</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="tablist">
        {pestanas.map(([id, titulo, Icono, pendientes]) => (
          <button key={id} role="tab" aria-selected={pestana === id} onClick={() => setPestana(id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${pestana === id ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <Icono className="w-4 h-4" /> {titulo}
            {pendientes > 0 && <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full">{pendientes}</span>}
          </button>
        ))}
      </div>

      {pestana === 'hogares' && (
        <p className="mb-4 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" /> Datos reservados: la dirección y el contacto de los hogares no se publican. Cada consulta de esta lista queda en el registro de auditoría.
        </p>
      )}

      {pestana === 'adopciones' && <PanelAdopciones />}
      {pestana === 'hallazgos' && <PanelHallazgos />}
      {pestana === 'usuarios' && <PanelUsuarios />}
      {pestana === 'refugios' && <PanelRefugios />}
      {pestana !== 'adopciones' && pestana !== 'hallazgos' && pestana !== 'usuarios' && pestana !== 'refugios' && (
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-x-auto">
        {cargando ? <p className="p-8 text-sm text-gray-500">Cargando…</p> : datos[pestana as Tabla].length === 0 ? <p className="p-8 text-sm text-gray-500">No hay registros todavía.</p> : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                {{ hogares: ['Código', 'Responsable y contacto', 'Dirección (reservada)', 'Cupos', 'Inscrito', 'Estado'],
                  mascotas: ['Radicado', 'Mascota', 'Propietario', 'Ubicación', 'Antirrábica', 'Esterilizado'],
                  especial: ['Radicado', 'Ejemplar', 'Propietario', 'Residencia', 'Póliza', 'Estado'],
                  donaciones: ['Radicado', 'Donante', 'Tipo', 'Descripción', 'Fecha', 'Estado'] }[pestana as Tabla].map((c) => <th key={c} className="py-3 px-4 whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 align-top">
              {pestana === 'hogares' && datos.hogares.map((h) => (
                <tr key={h.id}>
                  <td className="py-3 px-4 font-mono font-black text-sm">{h.codigo}</td>
                  <td className="py-3 px-4"><strong>{h.responsable}</strong><br />{h.nombre}<br />{h.telefono} · {h.correo}</td>
                  <td className="py-3 px-4">{h.direccion}<br /><span className="text-gray-500">{h.sector}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap">{h.ocupacion} / {h.capacidad}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{fecha(h.creado_en)}</td>
                  <td className="py-3 px-4">
                    <select aria-label={`Estado de ${h.codigo}`} value={h.estado} onChange={(e) => cambiar(`/admin/hogares/${h.id}`, { estado: e.target.value })} className={claseSelect}>
                      <option value="pendiente">Pendiente de visita</option><option value="verificado">Verificado</option><option value="suspendido">Suspendido</option><option value="rechazado">Rechazado</option>
                    </select>
                  </td>
                </tr>
              ))}
              {pestana === 'mascotas' && datos.mascotas.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{m.radicado}</td>
                  <td className="py-3 px-4"><strong>{m.nombre}</strong><br />{m.especie} · {m.raza} · {m.sexo}<br />{m.edad_anios} a {m.edad_meses} m{m.microchip_numero && ` · chip ${m.microchip_numero}`}</td>
                  <td className="py-3 px-4"><strong>{m.prop_nombre}</strong><br />{m.prop_tipo_doc} {m.prop_num_doc}<br />{m.prop_telefono}</td>
                  <td className="py-3 px-4">{m.prop_direccion}<br /><span className="text-gray-500">{m.prop_barrio} · {m.prop_zona}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap">{m.antirrabica ? <>Sí · {m.antirrabica_fecha ?? 's. f.'}{m.antirrabica_lote && <><br />Lote {m.antirrabica_lote}</>}</> : 'No'}</td>
                  <td className="py-3 px-4">{m.esterilizado ? 'Sí' : 'No'}</td>
                </tr>
              ))}
              {pestana === 'especial' && datos.especial.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{r.radicado}<br /><span className="font-sans text-gray-500">{fecha(r.creado_en)}</span></td>
                  <td className="py-3 px-4"><strong>{r.nombre}</strong><br />{r.raza} · {r.sexo}<br /><span className="text-gray-500">{String(r.categoria).replace('_', ' ')}</span></td>
                  <td className="py-3 px-4"><strong>{r.prop_nombre}</strong><br />{r.prop_tipo_doc} {r.prop_num_doc}<br />{r.prop_telefono}</td>
                  <td className="py-3 px-4">{r.residencia}<br /><span className="text-gray-500">{r.destino === 'guarda' ? 'Guarda / protección' : 'Convivencia'}</span></td>
                  <td className="py-3 px-4">{r.poliza_tiene ? <>{r.poliza_aseguradora}<br />N.º {r.poliza_numero}<br />Hasta {r.poliza_vigencia}</> : <span className="font-bold text-amber-700">Sin póliza</span>}</td>
                  <td className="py-3 px-4">
                    <select aria-label={`Estado de ${r.radicado}`} value={r.estado} onChange={(e) => cambiar(`/manejo-especial/${r.id}`, { estado: e.target.value, notas: r.notas })} className={claseSelect}>
                      {['Radicado', 'En revisión', 'Requiere ajustes', 'Aprobado'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {pestana === 'donaciones' && datos.donaciones.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{d.radicado}</td>
                  <td className="py-3 px-4"><strong>{d.nombre}</strong><br />{d.telefono}{d.correo && <><br />{d.correo}</>}</td>
                  <td className="py-3 px-4 font-bold">{d.tipo}</td>
                  <td className="py-3 px-4 max-w-xs">{d.descripcion}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{fecha(d.creado_en)}</td>
                  <td className="py-3 px-4">
                    <select aria-label={`Estado de ${d.radicado}`} value={d.estado} onChange={(e) => cambiar(`/donaciones/${d.id}`, { estado: e.target.value, notas: d.notas })} className={claseSelect}>
                      {['Nueva', 'Contactada', 'Recibida', 'Descartada'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}
    </section>
  );
}
