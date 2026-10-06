import React, { useEffect, useState } from 'react';
import { X, AlertCircle, UploadCloud, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export const claseInput =
  'w-full text-base sm:text-sm p-3 sm:p-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

export function Campo({ etiqueta, ayuda, children, ancho }: { etiqueta: string; ayuda?: string; children: React.ReactNode; ancho?: boolean }) {
  return (
    <label className={`block ${ancho ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs font-semibold text-gray-700 mb-1">{etiqueta}</span>
      {children}
      {ayuda && <span className="block text-[11px] text-gray-500 mt-1">{ayuda}</span>}
    </label>
  );
}

export function Seccion({ titulo, icono, children }: { titulo: string; icono?: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="pt-4 border-t border-gray-100 first:border-t-0 first:pt-0">
      <legend className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        {icono}
        {titulo}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </fieldset>
  );
}

/** Pregunta de Sí / No obligatoria: no trae respuesta marcada por defecto. */
export function SiNo({ pregunta, valor, onChange, ayuda }: { pregunta: string; valor: boolean | null; onChange: (v: boolean) => void; ayuda?: string }) {
  return (
    <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
      <div>
        <p className="text-sm sm:text-xs font-semibold text-gray-800">{pregunta}</p>
        {ayuda && <p className="text-[11px] text-gray-500 mt-0.5">{ayuda}</p>}
      </div>
      <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden shrink-0 self-start sm:self-auto" role="radiogroup" aria-label={pregunta}>
        {[true, false].map((op) => (
          <button
            key={String(op)}
            type="button"
            role="radio"
            aria-checked={valor === op}
            onClick={() => onChange(op)}
            className={`px-5 sm:px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs font-bold transition-colors cursor-pointer ${
              valor === op ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {op ? 'Sí' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Casilla({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="sm:col-span-2 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 sm:w-4 sm:h-4 mt-0.5 accent-emerald-600 shrink-0" />
      <span className="text-sm sm:text-xs text-gray-800 leading-relaxed">{children}</span>
    </label>
  );
}

export function AvisoDatos() {
  return (
    <>
      He leído la{' '}
      <a href="#/privacidad" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="font-bold text-emerald-700 underline">política de privacidad</a>{' '}
      y autorizo el tratamiento de mis datos personales conforme a la <strong>Ley 1581 de 2012</strong>, únicamente para gestionar este trámite ante la
      Dirección de Protección Animal de Mosquera.
    </>
  );
}

export function ErrorFormulario({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  );
}

export function Modal({ titulo, subtitulo, sobretitulo, icono, onClose, children, ancho = 'max-w-2xl', color = 'from-emerald-700 to-emerald-900' }: {
  titulo: string; subtitulo?: string; sobretitulo?: string; icono?: React.ReactNode; onClose: () => void;
  children: React.ReactNode; ancho?: string; color?: string;
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', alTeclear);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', alTeclear); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-6 overscroll-contain" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className={`bg-white rounded-3xl ${ancho} w-full overflow-hidden shadow-2xl border border-gray-100 relative my-auto`}>
        <div className={`bg-gradient-to-r ${color} text-white p-5 sm:p-6 relative`}>
          <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            {icono && <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">{icono}</div>}
            <div>
              {sobretitulo && <span className="text-white/75 text-[11px] font-bold uppercase tracking-wider">{sobretitulo}</span>}
              <h2 className="text-xl sm:text-2xl font-black font-heading leading-tight">{titulo}</h2>
              {subtitulo && <p className="text-white/85 text-xs mt-0.5">{subtitulo}</p>}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function BotonesFormulario({ onCancelar, texto, enviando, icono }: { onCancelar: () => void; texto: string; enviando: boolean; icono?: React.ReactNode }) {
  return (
    <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
      <button type="button" onClick={onCancelar} className="px-4 py-3 sm:py-2.5 text-sm sm:text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
        Cancelar
      </button>
      <button type="submit" disabled={enviando} className="px-6 py-3.5 sm:py-3 text-sm sm:text-xs font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait" style={{ backgroundColor: 'var(--color-acento)' }}>
        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : icono}
        {enviando ? 'Enviando…' : texto}
      </button>
    </div>
  );
}

export function Radicado({ titulo, radicado, children, onClose }: { titulo: string; radicado: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
        <ShieldCheck className="w-9 h-9" />
      </div>
      <h3 className="text-2xl font-black text-gray-900 font-heading">{titulo}</h3>
      <p className="inline-block font-mono text-sm font-bold bg-gray-100 border border-gray-200 rounded-xl px-4 py-2">Radicado {radicado}</p>
      <div className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">{children}</div>
      <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md cursor-pointer" style={{ backgroundColor: 'var(--color-acento)' }}>
        Entendido
      </button>
    </div>
  );
}

/** Selector de foto: sube el archivo al servidor y devuelve su ruta. */
export function SubirFoto({ valor, onChange, etiqueta = 'Fotografía' }: { valor: string; onChange: (url: string) => void; etiqueta?: string }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const alElegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError(''); setSubiendo(true);
    try { onChange(await api.subirFoto(archivo)); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.'); }
    finally { setSubiendo(false); }
  };
  return (
    <div className="sm:col-span-2 flex items-center gap-3">
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-2xl">
        {valor ? <img src={valor} alt="Vista previa" className="w-full h-full object-cover" /> : '🐾'}
      </div>
      <div>
        <span className="block text-xs font-semibold text-gray-700 mb-1">{etiqueta}</span>
        <label className="inline-flex text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg cursor-pointer transition-colors items-center gap-1.5">
          {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          {subiendo ? 'Subiendo…' : valor ? 'Cambiar foto' : 'Subir foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={alElegir} className="hidden" disabled={subiendo} />
        </label>
        <span className="block text-[11px] text-gray-500 mt-1">JPG, PNG o WebP · máximo 5 MB</span>
        {error && <span className="block text-[11px] text-red-600 mt-1">{error}</span>}
      </div>
    </div>
  );
}

export const TIPOS_DOC = ['CC', 'CE', 'TI', 'PPT', 'Pasaporte'];
export const SECTORES = ['Centro', 'El Trébol', 'Porvenir Río', 'Serrezuela', 'Ciudad Sabana', 'Villa Nueva', 'Planadas', 'Las Brisas / Cuatro Caminos', 'El Diamante', 'Zona rural / veredas', 'Otro'];
