import React from 'react';
import { useTheme } from '../context/ThemeContext';

const enlace = (numero: string, mensaje: string) => `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

export function IconoWhatsApp({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.3.6 4.5 1.8 6.4L3 29l7.2-1.9c1.8 1 3.8 1.5 5.9 1.5 7 0 12.7-5.6 12.7-12.6S23 3 16 3Zm0 23.1c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.3 1.1 1.1-4.1-.3-.4a10.4 10.4 0 0 1-1.6-5.5C5.1 9.8 10 5 16 5s10.8 4.8 10.8 10.6S22 26.1 16 26.1Zm5.9-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.4-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.1 1.1-1.1 2.7 1.2 3.1 1.3 3.3 2.3 3.5 5.6 4.9c2.1.9 2.9 1 4 .8.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5-.3-.3-.6-.4Z" />
    </svg>
  );
}

/** Botón flotante para escribir a la línea de bienestar animal. Solo aparece si WHATSAPP_BIENESTAR está configurado. */
export default function BotonWhatsApp() {
  const { whatsappBienestar } = useTheme();
  if (!whatsappBienestar) return null;
  return (
    <a
      href={enlace(whatsappBienestar, 'Hola, me comunico desde PATAS con la línea de bienestar animal de Mosquera.')}
      target="_blank" rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp a la línea de bienestar animal"
      title="Línea de bienestar animal"
      className="fixed z-40 right-3 sm:right-5 bottom-[148px] sm:bottom-24 group flex items-center gap-2 bg-[#25D366] text-white rounded-full shadow-xl pl-3 pr-3 sm:pr-4 py-3 hover:brightness-95 active:scale-95 transition"
    >
      <IconoWhatsApp className="w-6 h-6" />
      <span className="hidden sm:inline text-sm font-bold">Bienestar animal</span>
    </a>
  );
}

export function BotonWhatsAppTexto({ mensaje, texto = 'Escribir a la línea de bienestar animal' }: { mensaje: string; texto?: string }) {
  const { whatsappBienestar } = useTheme();
  if (!whatsappBienestar) return <p className="text-xs text-gray-500">La línea de WhatsApp aún no está configurada. Acércate a la Dirección de Protección Animal.</p>;
  return (
    <a href={enlace(whatsappBienestar, mensaje)} target="_blank" rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:brightness-95">
      <IconoWhatsApp className="w-5 h-5" /> {texto}
    </a>
  );
}
