import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Cookie } from 'lucide-react';

const CLAVE = 'patas_aviso_privacidad_v1';
const leer = () => { try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; } };

/** Aviso informativo: solo hay una cookie de sesión necesaria y reCAPTCHA, así que no se pide elegir. */
export default function AvisoCookies() {
  const { setVistaActiva } = useTheme();
  const [visto, setVisto] = useState(leer);
  if (visto) return null;
  const cerrar = () => { try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento: se mostrará de nuevo */ } setVisto(true); };
  return (
    <div role="region" aria-label="Aviso de privacidad" className="fixed z-40 bottom-20 sm:bottom-5 left-3 right-3 sm:left-5 sm:right-auto sm:max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex gap-3">
      <Cookie className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div className="text-xs text-gray-700 leading-relaxed">
        Usamos solo una cookie necesaria para mantener tu sesión y Google reCAPTCHA para protegernos de robots. Sin publicidad ni rastreo.{' '}
        <button onClick={() => { setVistaActiva('privacidad'); cerrar(); }} className="font-bold text-emerald-700 underline cursor-pointer">Política de privacidad</button>
        <div className="mt-2.5">
          <button onClick={cerrar} className="px-4 py-2 rounded-lg text-white text-xs font-bold cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>Entendido</button>
        </div>
      </div>
    </div>
  );
}
