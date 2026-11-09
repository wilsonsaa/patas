-- PATAS 1.5 · Reportes ciudadanos de animales abandonados, heridos o en riesgo
CREATE TABLE reportes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radicado     text NOT NULL UNIQUE,
  especie      text NOT NULL CHECK (especie IN ('perro','gato','otro')),
  condicion    text NOT NULL CHECK (condicion IN ('Aparentemente sano','Herido','Desnutrido o enfermo','Cachorros o crías','Agresivo o asustado')),
  cantidad     integer NOT NULL DEFAULT 1 CHECK (cantidad BETWEEN 1 AND 30),
  descripcion  text NOT NULL,
  foto         text NOT NULL DEFAULT '',
  lat          double precision NOT NULL CHECK (lat BETWEEN 4.3 AND 5.1),
  lng          double precision NOT NULL CHECK (lng BETWEEN -74.6 AND -73.8),
  referencia   text NOT NULL DEFAULT '',
  nombre       text NOT NULL,
  telefono     text NOT NULL,
  correo       text NOT NULL DEFAULT '',
  usuario_id   uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  estado       text NOT NULL DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo','En atención','Rescatado','No encontrado','Cerrado')),
  notas        text NOT NULL DEFAULT '',
  atendido_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reportes_estado_idx ON reportes (estado, creado_en DESC);
CREATE INDEX reportes_usuario_idx ON reportes (usuario_id);
