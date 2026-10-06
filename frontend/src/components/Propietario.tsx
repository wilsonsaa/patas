import React from 'react';
import { User } from 'lucide-react';
import { Campo, Seccion, claseInput, TIPOS_DOC } from './ui';

export interface DatosPropietario {
  propNombre: string; propTipoDoc: string; propNumDoc: string; propTelefono: string;
  propCorreo: string; propDireccion: string; propBarrio: string;
}

/** Bloque de datos del propietario, compartido por el registro de mascota y el de manejo especial. */
export default function Propietario<T extends DatosPropietario>({ f, setF, children }: { f: T; setF: (f: T) => void; children?: React.ReactNode }) {
  const set = (k: keyof DatosPropietario) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Seccion titulo="1. Datos del propietario o tenedor" icono={<User className="w-4 h-4 text-emerald-600" />}>
      <Campo etiqueta="Nombres y apellidos *" ancho><input required minLength={3} maxLength={120} value={f.propNombre} onChange={set('propNombre')} className={claseInput} autoComplete="name" /></Campo>
      <Campo etiqueta="Tipo de documento *">
        <select value={f.propTipoDoc} onChange={set('propTipoDoc')} className={claseInput}>{TIPOS_DOC.map((t) => <option key={t}>{t}</option>)}</select>
      </Campo>
      <Campo etiqueta="Número de documento *"><input required maxLength={20} value={f.propNumDoc} onChange={set('propNumDoc')} className={claseInput} /></Campo>
      <Campo etiqueta="Teléfono / celular *"><input required type="tel" maxLength={20} value={f.propTelefono} onChange={set('propTelefono')} className={claseInput} autoComplete="tel" /></Campo>
      <Campo etiqueta="Correo electrónico"><input type="email" maxLength={160} value={f.propCorreo} onChange={set('propCorreo')} className={claseInput} autoComplete="email" /></Campo>
      <Campo etiqueta="Dirección de residencia *"><input required minLength={5} maxLength={200} value={f.propDireccion} onChange={set('propDireccion')} className={claseInput} autoComplete="street-address" /></Campo>
      <Campo etiqueta="Barrio o vereda *"><input required minLength={2} maxLength={120} value={f.propBarrio} onChange={set('propBarrio')} className={claseInput} /></Campo>
      {children}
    </Seccion>
  );
}
