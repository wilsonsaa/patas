import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserCircle2, LogIn, UserPlus, Save, LogOut } from 'lucide-react';
import { AvisoDatos, Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, claseInput } from './ui';

const ROLES: Record<string, string> = {
  adoptante: 'Ciudadano', hogar_paso: 'Hogar de paso verificado', refugio_admin: 'Gestor de refugio', admin: 'Dirección de Protección Animal',
};

/** Acceso a la plataforma: iniciar sesión, crear cuenta o editar el perfil. */
export default function ModalRegistroAdoptante() {
  const { modalRegistroAdoptanteAbierto, setModalRegistroAdoptanteAbierto, usuarioActivo, autenticado, iniciarSesion, registrar, actualizarPerfil, cerrarSesion } = useTheme();
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar');
  const [f, setF] = useState({ nombre: '', correo: '', telefono: '', barrio: '', password: '' });
  const [perfil, setPerfil] = useState<{ nombre: string; telefono: string; barrio: string } | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!modalRegistroAdoptanteAbierto) return null;
  const cerrar = () => { setModalRegistroAdoptanteAbierto(false); setF({ nombre: '', correo: '', telefono: '', barrio: '', password: '' }); setPerfil(null); setError(''); setAcepta(false); };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  if (autenticado) {
    const p = perfil ?? { nombre: usuarioActivo.nombre, telefono: usuarioActivo.telefono, barrio: usuarioActivo.municipio === 'Mosquera, Cundinamarca' ? '' : usuarioActivo.municipio };
    const guardar = async (e: React.FormEvent) => {
      e.preventDefault(); setEnviando(true);
      const ok = await actualizarPerfil(p);
      setEnviando(false);
      if (ok) cerrar();
    };
    return (
      <Modal titulo="Mi cuenta" sobretitulo={ROLES[usuarioActivo.rol]} subtitulo={usuarioActivo.correo} icono={<UserCircle2 className="w-6 h-6 text-emerald-200" />} ancho="max-w-md" onClose={cerrar}>
        <form onSubmit={guardar} className="p-5 sm:p-8 space-y-4">
          {usuarioActivo.nombreOrganizacion && (
            <p className="text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900">Gestionas: <strong>{usuarioActivo.nombreOrganizacion}</strong></p>
          )}
          <Campo etiqueta="Nombre completo"><input required minLength={3} maxLength={120} value={p.nombre} onChange={(e) => setPerfil({ ...p, nombre: e.target.value })} className={claseInput} /></Campo>
          <Campo etiqueta="Teléfono / WhatsApp"><input required type="tel" maxLength={20} value={p.telefono} onChange={(e) => setPerfil({ ...p, telefono: e.target.value })} className={claseInput} /></Campo>
          <Campo etiqueta="Barrio o sector"><input maxLength={120} value={p.barrio} onChange={(e) => setPerfil({ ...p, barrio: e.target.value })} className={claseInput} /></Campo>
          <BotonesFormulario onCancelar={cerrar} texto="Guardar" enviando={enviando} icono={<Save className="w-4 h-4" />} />
          <button type="button" onClick={async () => { await cerrarSesion(); cerrar(); }} className="w-full text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </form>
      </Modal>
    );
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'crear' && !acepta) return setError('Debes autorizar el tratamiento de datos personales.');
    setError(''); setEnviando(true);
    const ok = modo === 'entrar' ? await iniciarSesion(f.correo, f.password) : await registrar({ ...f, aceptaDatos: true });
    setEnviando(false);
    if (ok) cerrar();
  };

  return (
    <Modal titulo={modo === 'entrar' ? 'Iniciar sesión' : 'Crear mi cuenta'} sobretitulo="PATAS Mosquera" subtitulo="Una sola cuenta para adoptar, registrar tus mascotas y seguir tus trámites"
      icono={<UserCircle2 className="w-6 h-6 text-emerald-200" />} ancho="max-w-md" onClose={cerrar}>
      <form onSubmit={enviar} className="p-5 sm:p-8 space-y-4">
        <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-xl text-xs font-bold" role="tablist">
          {(['entrar', 'crear'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => { setModo(m); setError(''); }}
              className={`py-2 rounded-lg cursor-pointer ${modo === m ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'}`}>
              {m === 'entrar' ? 'Ya tengo cuenta' : 'Soy nuevo'}
            </button>
          ))}
        </div>
        <ErrorFormulario mensaje={error} />
        {modo === 'crear' && (
          <>
            <Campo etiqueta="Nombre completo *"><input required minLength={3} maxLength={120} value={f.nombre} onChange={set('nombre')} className={claseInput} autoComplete="name" /></Campo>
            <Campo etiqueta="Teléfono / WhatsApp *"><input required type="tel" maxLength={20} value={f.telefono} onChange={set('telefono')} className={claseInput} autoComplete="tel" placeholder="310 123 4567" /></Campo>
            <Campo etiqueta="Barrio o sector en Mosquera"><input maxLength={120} value={f.barrio} onChange={set('barrio')} className={claseInput} /></Campo>
          </>
        )}
        <Campo etiqueta="Correo electrónico *"><input required type="email" maxLength={160} value={f.correo} onChange={set('correo')} className={claseInput} autoComplete="email" /></Campo>
        <Campo etiqueta="Contraseña *" ayuda={modo === 'crear' ? 'Mínimo 10 caracteres.' : undefined}>
          <input required type="password" minLength={modo === 'crear' ? 10 : 1} maxLength={128} value={f.password} onChange={set('password')} className={claseInput} autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} />
        </Campo>
        {modo === 'crear' && <Casilla checked={acepta} onChange={setAcepta}><AvisoDatos /></Casilla>}
        <BotonesFormulario onCancelar={cerrar} texto={modo === 'entrar' ? 'Entrar' : 'Crear cuenta'} enviando={enviando} icono={modo === 'entrar' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} />
      </form>
    </Modal>
  );
}
