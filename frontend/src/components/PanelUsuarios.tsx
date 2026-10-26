import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Search, KeyRound, Copy, Check } from 'lucide-react';
import { api } from '../api';
import { claseInput } from './ui';
import { IconoWhatsApp } from './BotonWhatsApp';

interface U { id: string; nombre: string; correo: string; telefono: string; rol: string; activo: boolean; creado_en: string; lugar_codigo: string | null }
const ROL: Record<string, string> = { adoptante: 'Ciudadano', hogar_paso: 'Hogar de paso', refugio_admin: 'Gestor de refugio', admin: 'Administrador' };

/** Usuarios: buscar, asignar rol, desactivar y generar enlaces para restablecer la contraseña. */
export default function PanelUsuarios() {
  const { addToast, usuarioActivo } = useTheme();
  const [buscar, setBuscar] = useState('');
  const [lista, setLista] = useState<U[]>([]);
  const [enlace, setEnlace] = useState<{ id: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async (b: string) => {
    try { setLista(await api.get<U[]>(`/admin/usuarios?buscar=${encodeURIComponent(b)}`)); }
    catch (e) { addToast('error', 'No se pudo cargar', e instanceof Error ? e.message : ''); }
  }, [addToast]);
  useEffect(() => { const t = setTimeout(() => cargar(buscar), 300); return () => clearTimeout(t); }, [buscar, cargar]);

  const cambiar = async (u: U, cuerpo: Record<string, unknown>) => {
    try { await api.patch(`/admin/usuarios/${u.id}`, cuerpo); addToast('success', 'Usuario actualizado', u.nombre); cargar(buscar); }
    catch (e) { addToast('error', 'No se pudo actualizar', e instanceof Error ? e.message : ''); }
  };
  const generar = async (u: U) => {
    try {
      const r = await api.post<{ token: string }>(`/admin/usuarios/${u.id}/enlace`);
      setEnlace({ id: u.id, url: `${location.origin}/#/restablecer?t=${r.token}` }); setCopiado(false);
    } catch (e) { addToast('error', 'No se pudo generar el enlace', e instanceof Error ? e.message : ''); }
  };

  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre, correo o teléfono" className={`${claseInput} pl-9`} />
      </div>
      <div className="bg-white rounded-3xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-[10px] tracking-wider">
            <tr>{['Persona', 'Contacto', 'Rol', 'Estado', 'Acceso'].map((c) => <th key={c} className="py-3 px-4">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 align-top">
            {lista.map((u) => (
              <React.Fragment key={u.id}>
                <tr className={u.activo ? '' : 'opacity-60'}>
                  <td className="py-3 px-4"><strong>{u.nombre}</strong><br /><span className="text-gray-500">Desde {new Date(u.creado_en).toLocaleDateString('es-CO')}</span></td>
                  <td className="py-3 px-4">{u.correo}<br />{u.telefono}</td>
                  <td className="py-3 px-4">
                    {u.rol === 'hogar_paso' || u.id === usuarioActivo.id ? (
                      <span className="font-bold">{ROL[u.rol]}{u.lugar_codigo ? ` ${u.lugar_codigo}` : ''}</span>
                    ) : (
                      <select aria-label={`Rol de ${u.nombre}`} value={u.rol} onChange={(e) => cambiar(u, { rol: e.target.value })} className="text-xs font-bold p-1.5 rounded-lg border border-gray-300 bg-white">
                        <option value="adoptante">Ciudadano</option><option value="refugio_admin">Gestor de refugio</option><option value="admin">Administrador</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {u.id === usuarioActivo.id ? 'Tú' : (
                      <button onClick={() => cambiar(u, { activo: !u.activo })} className={`font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${u.activo ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                        {u.activo ? 'Activa' : 'Desactivada'}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => generar(u)} className="font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                      <KeyRound className="w-3.5 h-3.5" /> Enlace para nueva contraseña
                    </button>
                  </td>
                </tr>
                {enlace?.id === u.id && (
                  <tr>
                    <td colSpan={5} className="px-4 pb-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                        <p className="text-amber-900">Enlace de un solo uso, válido por 24 horas. Entrégalo solo a la persona, después de verificar su identidad.</p>
                        <div className="flex flex-wrap gap-2">
                          <input readOnly value={enlace.url} className="flex-1 min-w-[220px] text-[11px] font-mono p-2 rounded-lg border border-amber-200 bg-white" onFocus={(e) => e.target.select()} />
                          <button onClick={() => { navigator.clipboard?.writeText(enlace.url); setCopiado(true); }} className="font-bold px-3 py-2 rounded-lg bg-white border border-gray-300 flex items-center gap-1.5 cursor-pointer">
                            {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copiado ? 'Copiado' : 'Copiar'}
                          </button>
                          {u.telefono && (
                            <a href={`https://wa.me/57${u.telefono.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hola ${u.nombre.split(' ')[0]}, este es tu enlace para crear una nueva contraseña en PATAS (vence en 24 horas): ${enlace.url}`)}`}
                              target="_blank" rel="noopener noreferrer" className="font-bold px-3 py-2 rounded-lg bg-[#25D366] text-white flex items-center gap-1.5">
                              <IconoWhatsApp className="w-3.5 h-3.5" /> Enviar por WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
