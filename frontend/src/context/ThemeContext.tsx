import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pet, RefugioHogar, SolicitudAdopcion, AdopcionExitosa, UsuarioActivo, Vista } from '../types';
import { api } from '../api';

interface ThemeConfig {
  nombre: string;
  linea_multicolor: boolean;
  color_acento: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  description: string;
}

export type NuevaMascota = Omit<Pet, 'id' | 'fechaPublicacion' | 'estado' | 'hogarOrefugioNombre' | 'esHogarPaso' | 'municipio' | 'contactoWhatsapp'>;
export type NuevaSolicitud = Record<string, unknown>;

interface ThemeContextType {
  config: ThemeConfig;
  cargando: boolean;
  recargar: () => Promise<void>;
  // Datos
  pets: Pet[];
  addPet: (mascota: NuevaMascota) => Promise<boolean>;
  updatePetStatus: (petId: string, newStatus: Pet['estado']) => Promise<void>;
  deletePet: (petId: string) => Promise<void>;
  refugios: RefugioHogar[];
  solicitudes: SolicitudAdopcion[];
  submitSolicitud: (solicitud: NuevaSolicitud) => Promise<SolicitudAdopcion | null>;
  updateSolicitudEstado: (solicitudId: string, nuevoEstado: SolicitudAdopcion['estado'], notas?: string, fechaEntrevista?: string) => Promise<void>;
  adopcionesExitosas: AdopcionExitosa[];
  // Sesión
  usuarioActivo: UsuarioActivo;
  autenticado: boolean;
  esGestor: boolean;
  esAdmin: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<boolean>;
  registrar: (datos: Record<string, unknown>) => Promise<boolean>;
  actualizarPerfil: (datos: Record<string, unknown>) => Promise<boolean>;
  cerrarSesion: () => Promise<void>;
  refrescarUsuario: () => Promise<void>;
  /** Devuelve true si hay sesión; si no, abre el acceso y avisa. */
  requerirSesion: (motivo?: string) => boolean;
  // Modales y navegación
  mascotaSeleccionada: Pet | null;
  setMascotaSeleccionada: (pet: Pet | null) => void;
  mascotaParaAdoptar: Pet | null;
  setMascotaParaAdoptar: (pet: Pet | null) => void;
  modalRegistroHogarAbierto: boolean;
  setModalRegistroHogarAbierto: (open: boolean) => void;
  modalSubirMascotaAbierto: boolean;
  setModalSubirMascotaAbierto: (open: boolean) => void;
  modalRegistroAdoptanteAbierto: boolean;
  setModalRegistroAdoptanteAbierto: (open: boolean) => void;
  modalMascotaPropiaAbierto: boolean;
  setModalMascotaPropiaAbierto: (open: boolean) => void;
  modalManejoEspecialAbierto: boolean;
  setModalManejoEspecialAbierto: (open: boolean) => void;
  modalDonarAbierto: boolean;
  setModalDonarAbierto: (open: boolean) => void;
  vistaActiva: Vista;
  setVistaActiva: (vista: Vista) => void;
  // Avisos
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'error', title: string, description: string) => void;
  removeToast: (id: string) => void;
}

const VISITANTE: UsuarioActivo = { id: '', nombre: 'Invitado', correo: '', telefono: '', rol: 'visitante', municipio: '' };
const mensaje = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error. Intenta de nuevo.');

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const config: ThemeConfig = {
    nombre: 'PATAS (Plataforma de Acogida Temporal y Adopción Segura)',
    linea_multicolor: true,
    color_acento: '#059669',
  };

  const [cargando, setCargando] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [refugios, setRefugios] = useState<RefugioHogar[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAdopcion[]>([]);
  const [adopcionesExitosas, setAdopcionesExitosas] = useState<AdopcionExitosa[]>([]);
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioActivo>(VISITANTE);

  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<Pet | null>(null);
  const [mascotaParaAdoptarInterna, setMascotaParaAdoptarInterna] = useState<Pet | null>(null);
  const [modalRegistroHogar, setModalRegistroHogar] = useState(false);
  const [modalSubirMascota, setModalSubirMascota] = useState(false);
  const [modalRegistroAdoptanteAbierto, setModalRegistroAdoptanteAbierto] = useState(false);
  const [modalMascotaPropia, setModalMascotaPropia] = useState(false);
  const [modalManejoEspecial, setModalManejoEspecial] = useState(false);
  const [modalDonarAbierto, setModalDonarAbierto] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<Vista>('inicio');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const autenticado = usuarioActivo.rol !== 'visitante';
  const esAdmin = usuarioActivo.rol === 'admin';
  const esGestor = esAdmin || usuarioActivo.rol === 'refugio_admin' || usuarioActivo.rol === 'hogar_paso';

  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const addToast = useCallback((type: 'success' | 'info' | 'error', title: string, description: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => removeToast(id), 5500);
  }, [removeToast]);

  const cargarPublico = useCallback(async () => {
    const [m, l, a] = await Promise.all([
      api.get<Pet[]>('/mascotas'), api.get<RefugioHogar[]>('/lugares'), api.get<AdopcionExitosa[]>('/adopciones'),
    ]);
    setPets(m); setRefugios(l); setAdopcionesExitosas(a);
  }, []);

  const cargarSolicitudes = useCallback(async (hayUsuario: boolean) => {
    setSolicitudes(hayUsuario ? await api.get<SolicitudAdopcion[]>('/solicitudes') : []);
  }, []);

  const recargar = useCallback(async () => {
    try {
      await Promise.all([cargarPublico(), cargarSolicitudes(autenticado)]);
    } catch (e) {
      addToast('error', 'No se pudo actualizar', mensaje(e));
    }
  }, [cargarPublico, cargarSolicitudes, autenticado, addToast]);

  const refrescarUsuario = useCallback(async () => {
    const u = await api.get<UsuarioActivo | null>('/auth/yo');
    setUsuarioActivo(u ?? VISITANTE);
    await cargarSolicitudes(!!u);
  }, [cargarSolicitudes]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([cargarPublico(), refrescarUsuario()]);
      } catch (e) {
        addToast('error', 'No se pudo cargar la plataforma', mensaje(e));
      } finally {
        setCargando(false);
      }
    })();
  }, [cargarPublico, refrescarUsuario, addToast]);

  const requerirSesion = useCallback((motivo?: string) => {
    if (autenticado) return true;
    addToast('info', 'Inicia sesión para continuar', motivo ?? 'Crea tu cuenta gratuita o inicia sesión para realizar este trámite.');
    setModalRegistroAdoptanteAbierto(true);
    return false;
  }, [autenticado, addToast]);

  // Los modales de trámites solo se abren con sesión iniciada
  const conSesion = (abrir: (v: boolean) => void, motivo: string) => (open: boolean) => {
    if (open && !requerirSesion(motivo)) return;
    abrir(open);
  };
  const setModalRegistroHogarAbierto = conSesion(setModalRegistroHogar, 'Para inscribir tu hogar de paso necesitas una cuenta.');
  const setModalMascotaPropiaAbierto = conSesion(setModalMascotaPropia, 'Para registrar tu mascota necesitas una cuenta.');
  const setModalManejoEspecialAbierto = conSesion(setModalManejoEspecial, 'Para registrar un ejemplar de manejo especial necesitas una cuenta.');
  const setMascotaParaAdoptar = (pet: Pet | null) => {
    if (pet && !requerirSesion('Para postularte a una adopción necesitas una cuenta. Así podrás seguir el estado de tu solicitud.')) return;
    setMascotaParaAdoptarInterna(pet);
  };
  const setModalSubirMascotaAbierto = (open: boolean) => {
    if (open) {
      if (!requerirSesion('Solo los hogares de paso verificados y los refugios pueden publicar mascotas.')) return;
      if (!esGestor) {
        addToast('info', 'Aún no puedes publicar mascotas', 'Inscribe tu hogar de paso; cuando la Dirección de Protección Animal lo verifique podrás publicar.');
        return;
      }
    }
    setModalSubirMascota(open);
  };

  const iniciarSesion = async (correo: string, password: string) => {
    try {
      const u = await api.post<UsuarioActivo>('/auth/login', { correo, password });
      setUsuarioActivo(u);
      await cargarSolicitudes(true);
      addToast('success', `¡Hola, ${u.nombre.split(' ')[0]}!`, 'Iniciaste sesión correctamente.');
      return true;
    } catch (e) { addToast('error', 'No se pudo iniciar sesión', mensaje(e)); return false; }
  };

  const registrar = async (datos: Record<string, unknown>) => {
    try {
      const u = await api.post<UsuarioActivo>('/auth/registro', datos);
      setUsuarioActivo(u);
      await cargarSolicitudes(true);
      addToast('success', '¡Cuenta creada!', 'Ya puedes postularte a adopciones y registrar a tus mascotas.');
      return true;
    } catch (e) { addToast('error', 'No se pudo crear la cuenta', mensaje(e)); return false; }
  };

  const actualizarPerfil = async (datos: Record<string, unknown>) => {
    try {
      setUsuarioActivo(await api.patch<UsuarioActivo>('/auth/perfil', datos));
      addToast('success', 'Perfil actualizado', 'Tus datos de contacto quedaron guardados.');
      return true;
    } catch (e) { addToast('error', 'No se pudo guardar', mensaje(e)); return false; }
  };

  const cerrarSesion = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUsuarioActivo(VISITANTE);
    setSolicitudes([]);
    setVistaActiva('inicio');
    addToast('info', 'Sesión cerrada', 'Vuelve pronto.');
  };

  const addPet = async (mascota: NuevaMascota) => {
    try {
      const nueva = await api.post<Pet>('/mascotas', mascota);
      await cargarPublico();
      addToast('success', '¡Mascota publicada!', `${nueva.nombre} ya está visible para las familias adoptantes.`);
      return true;
    } catch (e) { addToast('error', 'No se pudo publicar', mensaje(e)); return false; }
  };

  const updatePetStatus = async (petId: string, newStatus: Pet['estado']) => {
    try {
      await api.patch(`/mascotas/${petId}/estado`, { estado: newStatus });
      await cargarPublico();
      addToast('info', 'Estado actualizado', `La mascota ahora está: ${newStatus}`);
    } catch (e) { addToast('error', 'No se pudo actualizar', mensaje(e)); }
  };

  const deletePet = async (petId: string) => {
    try {
      await api.del(`/mascotas/${petId}`);
      await cargarPublico();
      addToast('info', 'Mascota retirada', 'La publicación fue removida.');
    } catch (e) { addToast('error', 'No se pudo retirar', mensaje(e)); }
  };

  const submitSolicitud = async (solicitud: NuevaSolicitud) => {
    try {
      const creada = await api.post<SolicitudAdopcion>('/solicitudes', solicitud);
      await Promise.all([cargarPublico(), cargarSolicitudes(true)]);
      addToast('success', '¡Solicitud radicada!', `Radicado ${creada.radicado}. Revisaremos tu postulación para ${creada.mascotaNombre}.`);
      return creada;
    } catch (e) { addToast('error', 'No se pudo enviar la solicitud', mensaje(e)); return null; }
  };

  const updateSolicitudEstado = async (solicitudId: string, nuevoEstado: SolicitudAdopcion['estado'], notas?: string, fechaEntrevista?: string) => {
    try {
      await api.patch(`/solicitudes/${solicitudId}`, { estado: nuevoEstado, notas, fechaEntrevista });
      await Promise.all([cargarPublico(), cargarSolicitudes(true)]);
      addToast('info', 'Solicitud actualizada', `La solicitud quedó como "${nuevoEstado}".`);
    } catch (e) { addToast('error', 'No se pudo actualizar', mensaje(e)); }
  };

  const valor = useMemo<ThemeContextType>(() => ({
    config, cargando, recargar,
    pets, addPet, updatePetStatus, deletePet, refugios,
    solicitudes, submitSolicitud, updateSolicitudEstado, adopcionesExitosas,
    usuarioActivo, autenticado, esGestor, esAdmin,
    iniciarSesion, registrar, actualizarPerfil, cerrarSesion, refrescarUsuario, requerirSesion,
    mascotaSeleccionada, setMascotaSeleccionada,
    mascotaParaAdoptar: mascotaParaAdoptarInterna, setMascotaParaAdoptar,
    modalRegistroHogarAbierto: modalRegistroHogar, setModalRegistroHogarAbierto,
    modalSubirMascotaAbierto: modalSubirMascota, setModalSubirMascotaAbierto,
    modalRegistroAdoptanteAbierto, setModalRegistroAdoptanteAbierto,
    modalMascotaPropiaAbierto: modalMascotaPropia, setModalMascotaPropiaAbierto,
    modalManejoEspecialAbierto: modalManejoEspecial, setModalManejoEspecialAbierto,
    modalDonarAbierto, setModalDonarAbierto,
    vistaActiva, setVistaActiva,
    toasts, addToast, removeToast,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cargando, pets, refugios, solicitudes, adopcionesExitosas, usuarioActivo, mascotaSeleccionada, mascotaParaAdoptarInterna,
    modalRegistroHogar, modalSubirMascota, modalRegistroAdoptanteAbierto, modalMascotaPropia, modalManejoEspecial,
    modalDonarAbierto, vistaActiva, toasts]);

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
