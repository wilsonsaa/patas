-- PATAS · esquema inicial
-- gen_random_uuid() viene incluido en PostgreSQL 13 o superior (no requiere extensiones)

CREATE SEQUENCE IF NOT EXISTS seq_hogar_codigo;
CREATE SEQUENCE IF NOT EXISTS seq_radicado;

CREATE TABLE usuarios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  correo        text NOT NULL,
  telefono      text NOT NULL DEFAULT '',
  barrio        text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  rol           text NOT NULL DEFAULT 'adoptante'
                CHECK (rol IN ('adoptante','hogar_paso','refugio_admin','admin')),
  lugar_id      uuid,
  activo        boolean NOT NULL DEFAULT true,
  acepta_datos_en timestamptz,
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuarios_correo_uq ON usuarios (lower(correo));

-- Refugios institucionales y hogares de paso.
-- Los hogares de paso se identifican públicamente SOLO por su código (HP-0001).
-- direccion, sector, responsable, telefono y correo de un hogar son datos reservados.
CREATE TABLE lugares (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text NOT NULL CHECK (tipo IN ('refugio','hogar_paso')),
  codigo      text NOT NULL UNIQUE,
  nombre      text NOT NULL,
  responsable text NOT NULL DEFAULT '',
  telefono    text NOT NULL DEFAULT '',
  correo      text NOT NULL DEFAULT '',
  sector      text NOT NULL DEFAULT '',
  direccion   text NOT NULL DEFAULT '',
  descripcion text NOT NULL DEFAULT '',
  capacidad   integer NOT NULL DEFAULT 1 CHECK (capacidad BETWEEN 1 AND 500),
  horario     text NOT NULL DEFAULT '',
  lat         double precision,
  lng         double precision,
  estado      text NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente','verificado','rechazado','suspendido')),
  usuario_id  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  -- un hogar de paso nunca guarda coordenadas
  CONSTRAINT hogar_sin_coordenadas CHECK (tipo = 'refugio' OR (lat IS NULL AND lng IS NULL))
);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_lugar_fk FOREIGN KEY (lugar_id) REFERENCES lugares(id) ON DELETE SET NULL;

CREATE TABLE mascotas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL,
  especie         text NOT NULL CHECK (especie IN ('perro','gato','otro')),
  raza            text NOT NULL DEFAULT '',
  edad_categoria  text NOT NULL CHECK (edad_categoria IN ('Cachorro','Joven','Adulto','Senior')),
  edad_texto      text NOT NULL DEFAULT '',
  genero          text NOT NULL CHECK (genero IN ('Macho','Hembra')),
  tamano          text NOT NULL CHECK (tamano IN ('Pequeño','Mediano','Grande')),
  fotos           jsonb NOT NULL DEFAULT '[]',
  estado          text NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible','En proceso','Adoptado')),
  descripcion     text NOT NULL DEFAULT '',
  temperamento    jsonb NOT NULL DEFAULT '[]',
  vacunado        boolean NOT NULL DEFAULT false,
  esterilizado    boolean NOT NULL DEFAULT false,
  desparasitado   boolean NOT NULL DEFAULT false,
  microchip       boolean NOT NULL DEFAULT false,
  detalles_medicos text NOT NULL DEFAULT '',
  lugar_id        uuid NOT NULL REFERENCES lugares(id) ON DELETE RESTRICT,
  creado_por      uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mascotas_lugar_idx ON mascotas (lugar_id);

CREATE TABLE solicitudes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radicado        text NOT NULL UNIQUE,
  mascota_id      uuid NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  usuario_id      uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  cedula          text NOT NULL,
  telefono        text NOT NULL,
  correo          text NOT NULL,
  barrio          text NOT NULL,
  tipo_vivienda   text NOT NULL,
  tiene_otras_mascotas boolean NOT NULL,
  detalle_otras_mascotas text NOT NULL DEFAULT '',
  todos_de_acuerdo boolean NOT NULL,
  horas_solo      integer NOT NULL CHECK (horas_solo BETWEEN 0 AND 24),
  experiencia     text NOT NULL DEFAULT '',
  motivo          text NOT NULL,
  -- preguntas añadidas a solicitud de la Dirección de Protección Animal
  hay_ninos       boolean NOT NULL,
  edades_ninos    text NOT NULL DEFAULT '',
  hay_alergias    boolean NOT NULL,
  detalle_alergias text NOT NULL DEFAULT '',
  hay_embarazo    boolean NOT NULL,
  conoce_responsabilidades_ley boolean NOT NULL CHECK (conoce_responsabilidades_ley),
  estado          text NOT NULL DEFAULT 'Pendiente'
                  CHECK (estado IN ('Pendiente','En evaluación','Entrevista agendada','Aprobada','Rechazada')),
  notas_gestor    text NOT NULL DEFAULT '',
  fecha_entrevista text NOT NULL DEFAULT '',
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX solicitudes_usuario_idx ON solicitudes (usuario_id);
CREATE INDEX solicitudes_mascota_idx ON solicitudes (mascota_id);

CREATE TABLE adopciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id    uuid UNIQUE REFERENCES solicitudes(id) ON DELETE SET NULL,
  mascota_nombre  text NOT NULL,
  mascota_foto    text NOT NULL DEFAULT '',
  adoptante_nombre text NOT NULL,
  lugar_nombre    text NOT NULL DEFAULT '',
  testimonio      text NOT NULL DEFAULT '',
  seguimiento     text NOT NULL DEFAULT 'En adaptación'
                  CHECK (seguimiento IN ('Excelente','En adaptación','Visita completada')),
  fecha           date NOT NULL DEFAULT current_date
);

-- Registro de mascota propia (mismos datos del formato de vacunación)
CREATE TABLE mascotas_propias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radicado        text NOT NULL UNIQUE,
  usuario_id      uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  prop_nombre     text NOT NULL,
  prop_tipo_doc   text NOT NULL,
  prop_num_doc    text NOT NULL,
  prop_telefono   text NOT NULL,
  prop_correo     text NOT NULL DEFAULT '',
  prop_direccion  text NOT NULL,
  prop_barrio     text NOT NULL,
  prop_zona       text NOT NULL CHECK (prop_zona IN ('Urbana','Rural')),
  nombre          text NOT NULL,
  especie         text NOT NULL CHECK (especie IN ('perro','gato','otro')),
  raza            text NOT NULL,
  sexo            text NOT NULL CHECK (sexo IN ('Macho','Hembra')),
  edad_anios      integer NOT NULL DEFAULT 0 CHECK (edad_anios BETWEEN 0 AND 40),
  edad_meses      integer NOT NULL DEFAULT 0 CHECK (edad_meses BETWEEN 0 AND 11),
  color           text NOT NULL DEFAULT '',
  tamano          text NOT NULL DEFAULT '',
  peso_kg         numeric(5,1),
  senas           text NOT NULL DEFAULT '',
  esterilizado    boolean NOT NULL DEFAULT false,
  microchip_numero text NOT NULL DEFAULT '',
  foto            text NOT NULL DEFAULT '',
  antirrabica     boolean NOT NULL DEFAULT false,
  antirrabica_fecha date,
  antirrabica_lote text NOT NULL DEFAULT '',
  antirrabica_laboratorio text NOT NULL DEFAULT '',
  otras_vacunas   text NOT NULL DEFAULT '',
  desparasitacion_fecha date,
  veterinaria     text NOT NULL DEFAULT '',
  observaciones   text NOT NULL DEFAULT '',
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mascotas_propias_usuario_idx ON mascotas_propias (usuario_id);

-- Registro de ejemplares caninos de manejo especial (Ley 1801 de 2016, arts. 126 a 128)
CREATE TABLE manejo_especial (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radicado        text NOT NULL UNIQUE,
  usuario_id      uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  prop_nombre     text NOT NULL,
  prop_tipo_doc   text NOT NULL,
  prop_num_doc    text NOT NULL,
  prop_telefono   text NOT NULL,
  prop_correo     text NOT NULL DEFAULT '',
  prop_direccion  text NOT NULL,
  prop_barrio     text NOT NULL,
  prop_mayor_edad boolean NOT NULL CHECK (prop_mayor_edad),
  nombre          text NOT NULL,
  categoria       text NOT NULL CHECK (categoria IN ('raza','cruce','antecedente_agresion','adiestrado_ataque')),
  raza            text NOT NULL,
  sexo            text NOT NULL CHECK (sexo IN ('Macho','Hembra')),
  edad_texto      text NOT NULL DEFAULT '',
  color           text NOT NULL DEFAULT '',
  senas           text NOT NULL DEFAULT '',
  microchip_numero text NOT NULL DEFAULT '',
  foto            text NOT NULL DEFAULT '',
  residencia      text NOT NULL,
  destino         text NOT NULL CHECK (destino IN ('convivencia','guarda')),
  poliza_tiene    boolean NOT NULL DEFAULT false,
  poliza_aseguradora text NOT NULL DEFAULT '',
  poliza_numero   text NOT NULL DEFAULT '',
  poliza_vigencia date,
  vacunas_vigentes boolean NOT NULL DEFAULT false,
  antirrabica_fecha date,
  estado          text NOT NULL DEFAULT 'Radicado'
                  CHECK (estado IN ('Radicado','En revisión','Requiere ajustes','Aprobado')),
  notas           text NOT NULL DEFAULT '',
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE donaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radicado    text NOT NULL UNIQUE,
  nombre      text NOT NULL,
  telefono    text NOT NULL,
  correo      text NOT NULL DEFAULT '',
  tipo        text NOT NULL CHECK (tipo IN ('Alimento','Medicamentos e insumos','Cobijas y accesorios','Dinero','Tiempo o voluntariado','Otro')),
  descripcion text NOT NULL,
  estado      text NOT NULL DEFAULT 'Nueva' CHECK (estado IN ('Nueva','Contactada','Recibida','Descartada')),
  notas       text NOT NULL DEFAULT '',
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auditoria (
  id         bigserial PRIMARY KEY,
  usuario_id uuid,
  accion     text NOT NULL,
  entidad    text NOT NULL DEFAULT '',
  entidad_id text NOT NULL DEFAULT '',
  ip         text NOT NULL DEFAULT '',
  creado_en  timestamptz NOT NULL DEFAULT now()
);
