import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserCircle2, LogIn, UserPlus, Save, LogOut, KeyRound, ArrowLeft, MailCheck } from 'lucide-react';
import { api } from '../api';
import { BotonWhatsAppTexto } from './BotonWhatsApp';
import { AvisoDatos, Campo, Casilla, ErrorFormulario, Modal, BotonesFormulario, claseInput } from './ui';

const ROLES: Record<string, string> = {
  adoptante: 'Ciudadano', hogar_paso: 'Hogar de paso verificado', refugio_admin: 'Gestor de refugio', admin: 'Dirección de Protección Animal',
};

/** Acceso a la plataforma: iniciar sesión, crear cuenta o editar el perfil. */
export default function ModalRegistroAdoptante() {
  const { modalRegistroAdoptanteAbierto, setModalRegistroAdoptanteAbierto, usuarioActivo, autenticado, iniciarSesion, registrar, actualizarPerfil, cerrarSesion } = useTheme();
  const [modo, setModo] = useState<'entrar' | 'crear' | 'olvide' | 'olvide-correo'>('entrar');
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

  if (modo === 'olvide' || modo === 'olvide-correo') {
    return <Recuperar tipo={modo} onVolver={() => { setModo('entrar'); setError(''); }} onCerrar={cerrar} />;
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
        {modo === 'entrar' && (
          <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold">
            <button type="button" onClick={() => setModo('olvide')} className="text-emerald-700 hover:underline cursor-pointer">¿Olvidaste tu contraseña?</button>
            <button type="button" onClick={() => setModo('olvide-correo')} className="text-gray-500 hover:underline cursor-pointer">¿Olvidaste tu usuario?</button>
          </div>
        )}
        {modo === 'crear' && <Casilla checked={acepta} onChange={setAcepta}><AvisoDatos /> Acepto también los <a href="#/terminos" target="_blank" rel="noopener" className="font-bold text-emerald-700 underline">términos de uso</a>.</Casilla>}
        <BotonesFormulario onCancelar={cerrar} texto={modo === 'entrar' ? 'Entrar' : 'Crear cuenta'} enviando={enviando} icono={modo === 'entrar' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />} />
      </form>
    </Modal>
  );
}

/** Recuperar la contraseña (por correo) o recordar el usuario (se busca por teléfono). */
function Recuperar({ tipo, onVolver, onCerrar }: { tipo: 'olvide' | 'olvide-correo'; onVolver: () => void; onCerrar: () => void }) {
  const { recuperacionPorCorreo } = useTheme();
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState('');
  const [error, setError] = useState('');
  const esCorreo = tipo === 'olvide';

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      const r = await api.post<{ mensaje: string }>(esCorreo ? '/auth/olvide' : '/auth/olvide-correo', esCorreo ? { correo: valor } : { telefono: valor });
      setListo(r.mensaje);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar.'); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo={esCorreo ? 'Recuperar contraseña' : 'Recordar mi usuario'} sobretitulo="PATAS Mosquera"
      subtitulo={esCorreo ? 'Te enviamos un enlace para crear una nueva' : 'Tu usuario es el correo con el que te registraste'}
      icono={<KeyRound className="w-6 h-6 text-emerald-200" />} ancho="max-w-md" onClose={onCerrar}>
      <div className="p-5 sm:p-8 space-y-4">
        {!recuperacionPorCorreo ? (
          <>
            <p className="text-sm text-gray-700 leading-relaxed">
              Para restablecer tu acceso escríbele a la línea de bienestar animal. El equipo verificará tu identidad y te enviará un enlace seguro
              para crear una contraseña nueva.
            </p>
            <BotonWhatsAppTexto mensaje="Hola, necesito recuperar el acceso a mi cuenta de PATAS." />
          </>
        ) : listo ? (
          <div className="text-center space-y-3">
            <MailCheck className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-sm text-gray-700 leading-relaxed">{listo}</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <ErrorFormulario mensaje={error} />
            {esCorreo ? (
              <Campo etiqueta="Correo con el que te registraste"><input required type="email" maxLength={160} value={valor} onChange={(e) => setValor(e.target.value)} className={claseInput} autoComplete="email" /></Campo>
            ) : (
              <Campo etiqueta="Teléfono con el que te registraste" ayuda="Si encontramos tu cuenta, te enviamos un correo recordándote tu usuario.">
                <input required type="tel" maxLength={20} value={valor} onChange={(e) => setValor(e.target.value)} className={claseInput} autoComplete="tel" placeholder="310 123 4567" />
              </Campo>
            )}
            <BotonesFormulario onCancelar={onVolver} texto={esCorreo ? 'Enviar enlace' : 'Enviar recordatorio'} enviando={enviando} icono={<MailCheck className="w-4 h-4" />} />
          </form>
        )}
        <button type="button" onClick={onVolver} className="w-full text-xs font-bold text-gray-600 py-2 flex items-center justify-center gap-1.5 cursor-pointer"><ArrowLeft className="w-4 h-4" /> Volver a iniciar sesión</button>
      </div>
    </Modal>
  );
}
