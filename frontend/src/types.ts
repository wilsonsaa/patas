export type PetSpecies = 'perro' | 'gato' | 'otro';
export type PetAgeCategory = 'Cachorro' | 'Joven' | 'Adulto' | 'Senior';
export type PetSize = 'Pequeño' | 'Mediano' | 'Grande';
export type PetStatus = 'Disponible' | 'En proceso' | 'Adoptado';

export interface Pet {
  id: string;
  nombre: string;
  especie: PetSpecies;
  raza: string;
  edadCategoria: PetAgeCategory;
  edadTexto: string;
  genero: 'Macho' | 'Hembra';
  tamano: PetSize;
  fotos: string[];
  estado: PetStatus;
  descripcion: string;
  temperamento: string[];
  salud: {
    vacunado: boolean;
    esterilizado: boolean;
    desparasitado: boolean;
    microchip: boolean;
    detallesMedicos?: string;
  };
  hogarOrefugioId: string;
  hogarOrefugioNombre: string;
  esHogarPaso: boolean;
  municipio: string;
  fechaPublicacion: string;
  contactoWhatsapp?: string;
}

// Un hogar de paso se identifica públicamente SOLO por su código (HP-0001):
// la API no entrega dirección, coordenadas, responsable ni teléfono de un hogar.
export interface RefugioHogar {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'refugio' | 'hogar_paso';
  municipio: string;
  descripcion: string;
  capacidad: number;
  mascotasActuales: number;
  verificado: boolean;
  // solo refugios institucionales
  responsable?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  horario?: string;
  lat?: number;
  lng?: number;
}

export type SolicitudEstado = 'Pendiente' | 'En evaluación' | 'Entrevista agendada' | 'Aprobada' | 'Rechazada';

export interface SolicitudAdopcion {
  id: string;
  radicado: string;
  mascotaId: string;
  mascotaNombre: string;
  mascotaFoto: string;
  mascotaEspecie: PetSpecies;
  solicitanteNombre: string;
  solicitanteCedula: string;
  solicitanteTelefono: string;
  solicitanteCorreo: string;
  solicitanteMunicipio: string;
  tipoVivienda: 'Casa con patio' | 'Apartamento' | 'Finca' | 'Casa sin patio';
  tieneOtrasMascotas: boolean;
  detalleOtrasMascotas?: string;
  todosEnCasaDeAcuerdo: boolean;
  horasSoloAlDia: number;
  experienciaPrevia: string;
  motivoAdopcion: string;
  hayNinos: boolean;
  edadesNinos: string;
  hayAlergias: boolean;
  detalleAlergias: string;
  hayEmbarazo: boolean;
  conoceResponsabilidadesLey: boolean;
  fechaSolicitud: string;
  estado: SolicitudEstado;
  notasGestor?: string;
  fechaEntrevista?: string;
  hogarOrefugioId: string;
}

export interface AdopcionExitosa {
  id: string;
  mascotaNombre: string;
  mascotaFoto: string;
  adoptanteNombre: string;
  municipio: string;
  fechaAdopcion: string;
  refugioOHogar: string;
  testimonio: string;
  estadoSeguimiento: 'Excelente' | 'En adaptación' | 'Visita completada';
}

export type UserRole = 'visitante' | 'adoptante' | 'hogar_paso' | 'refugio_admin' | 'admin';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: UserRole;
  municipio: string;
  lugarId?: string | null;
  nombreOrganizacion?: string;
}

export type Vista = 'inicio' | 'mascotas' | 'hogares' | 'solicitudes' | 'refugios_personas' | 'mapa' | 'servicios' | 'panel';

