-- PATAS 1.3 · donaciones solo en especie, recuperación de contraseña,
-- seguimiento de adopciones y georreferenciación del lugar de hallazgo.

-- Donaciones: ya no se recibe dinero ('Dinero' se conserva solo para registros históricos)
ALTER TABLE donaciones DROP CONSTRAINT IF EXISTS donaciones_tipo_check;
ALTER TABLE donaciones ADD CONSTRAINT donaciones_tipo_check CHECK (tipo IN
  ('Alimento','Medicamentos e insumos','Cobijas y accesorios','Elementos de aseo','Tiempo o voluntariado','Otro','Dinero'));

-- Recuperación de contraseña: se guarda solo el hash del enlace, de un solo uso y con vencimiento
CREATE TABLE restablecimientos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expira_en   timestamptz NOT NULL,
  usado_en    timestamptz,
  creado_por  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX restablecimientos_usuario_idx ON restablecimientos (usuario_id);

-- Seguimiento posterior a la adopción
ALTER TABLE adopciones ADD COLUMN lugar_id uuid REFERENCES lugares(id) ON DELETE SET NULL;
ALTER TABLE adopciones ADD COLUMN proxima_visita date;
ALTER TABLE adopciones DROP CONSTRAINT IF EXISTS adopciones_seguimiento_check;
ALTER TABLE adopciones ADD CONSTRAINT adopciones_seguimiento_check CHECK (seguimiento IN
  ('En adaptación','Visita completada','Excelente','Requiere atención','Sin contacto','Cerrado'));
UPDATE adopciones a SET lugar_id = m.lugar_id
  FROM solicitudes s JOIN mascotas m ON m.id = s.mascota_id WHERE s.id = a.solicitud_id;

CREATE TABLE seguimientos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adopcion_id     uuid NOT NULL REFERENCES adopciones(id) ON DELETE CASCADE,
  fecha           date NOT NULL DEFAULT current_date,
  tipo            text NOT NULL CHECK (tipo IN ('Visita','Llamada','Mensaje','Fotos o video')),
  estado          text NOT NULL CHECK (estado IN ('En adaptación','Visita completada','Excelente','Requiere atención','Sin contacto','Cerrado')),
  notas           text NOT NULL DEFAULT '',
  proxima_visita  date,
  usuario_id      uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX seguimientos_adopcion_idx ON seguimientos (adopcion_id);

-- Lugar donde se encontró o recogió cada animal (dato interno: no se publica la coordenada exacta)
ALTER TABLE mascotas ADD COLUMN hallazgo_lat double precision CHECK (hallazgo_lat BETWEEN -90 AND 90);
ALTER TABLE mascotas ADD COLUMN hallazgo_lng double precision CHECK (hallazgo_lng BETWEEN -180 AND 180);
ALTER TABLE mascotas ADD COLUMN hallazgo_fecha date;
ALTER TABLE mascotas ADD COLUMN hallazgo_referencia text NOT NULL DEFAULT '';
ALTER TABLE mascotas ADD COLUMN hallazgo_por uuid REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE mascotas ADD CONSTRAINT hallazgo_completo CHECK ((hallazgo_lat IS NULL) = (hallazgo_lng IS NULL));

-- Versión de sesión: al cambiar o restablecer la contraseña se cierran todas las sesiones abiertas
ALTER TABLE usuarios ADD COLUMN sesion_version integer NOT NULL DEFAULT 0;

-- Datos de demostración: reemplaza las fotos de banco de imágenes por fotos de animales criollos
UPDATE mascotas SET fotos = '["/fotos/perro-labrador.webp"]' WHERE fotos::text LIKE '%1552053831-71594a27632d%';
UPDATE mascotas SET fotos = '["/fotos/gato-naranja.webp"]'   WHERE fotos::text LIKE '%1514888286974-6c03e2ca1dba%';
UPDATE mascotas SET fotos = '["/fotos/perro-calle.webp"]'    WHERE fotos::text LIKE '%1587300003388-59208cc962cb%';
UPDATE mascotas SET fotos = '["/fotos/gato-atigrado.webp"]'  WHERE fotos::text LIKE '%1533738363-b7f9aef128ce%';
UPDATE mascotas SET fotos = '["/fotos/perro-cachorro.webp"]' WHERE fotos::text LIKE '%1583511655857-d19b40a7a54e%';
UPDATE mascotas SET fotos = '["/fotos/perro-panoleta.webp"]' WHERE fotos::text LIKE '%1543466835-00a7907e9de1%';
