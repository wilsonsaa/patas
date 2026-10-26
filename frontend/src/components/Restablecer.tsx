import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { KeyRound, CheckCircle2, Save } from 'lucide-react';
import { api } from '../api';
import { BotonesFormulario, Campo, ErrorFormulario, claseInput } from './ui';

/** Página a la que llega el enlace de recuperación: #/restablecer?t=… */
export default function Restablecer() {
  const { setVistaActiva, setModalRegistroAdoptanteAbierto } = useTheme();
  const token = new URLSearchParams(location.hash.split('?')[1] ?? '').get('t') ?? '';
  const [clave, setClave] = useState('');
  const [repetir, setRepetir] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clave !== repetir) return setError('Las dos contraseñas no coinciden.');
    setError(''); setEnviando(true);
    try { await api.post('/auth/restablecer', { token, password: clave }); setListo(true); history.replaceState(null, '', '#/restablecer'); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.'); }
    finally { setEnviando(false); }
  };

  return (
    <section className="max-w-md mx-auto px-4 py-12 sm:py-20 w-full">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
          {listo ? <CheckCircle2 className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
        </div>
        {listo ? (
          <>
            <h1 className="text-2xl font-black text-gray-900 font-heading">Contraseña actualizada</h1>
            <p className="text-sm text-gray-600 mt-2">Por seguridad cerramos las sesiones abiertas en otros dispositivos. Ya puedes ingresar con tu nueva contraseña.</p>
            <button onClick={() => { setVistaActiva('inicio'); setModalRegistroAdoptanteAbierto(true); }} className="mt-6 w-full py-3 rounded-xl text-white font-bold cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>Ingresar</button>
          </>
        ) : !token ? (
          <>
            <h1 className="text-2xl font-black text-gray-900 font-heading">Enlace incompleto</h1>
            <p className="text-sm text-gray-600 mt-2">Abre el enlace completo que recibiste o solicita uno nuevo desde «Ingresar» → «¿Olvidaste tu contraseña?».</p>
          </>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <h1 className="text-2xl font-black text-gray-900 font-heading">Crea tu nueva contraseña</h1>
            <ErrorFormulario mensaje={error} />
            <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 10 caracteres."><input required type="password" minLength={10} maxLength={128} value={clave} onChange={(e) => setClave(e.target.value)} className={claseInput} autoComplete="new-password" /></Campo>
            <Campo etiqueta="Repítela"><input required type="password" minLength={10} maxLength={128} value={repetir} onChange={(e) => setRepetir(e.target.value)} className={claseInput} autoComplete="new-password" /></Campo>
            <BotonesFormulario onCancelar={() => setVistaActiva('inicio')} texto="Guardar contraseña" enviando={enviando} icono={<Save className="w-4 h-4" />} />
          </form>
        )}
      </div>
    </section>
  );
}
