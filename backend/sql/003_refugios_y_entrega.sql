-- PATAS 1.4 · versión de entrega
-- Códigos consecutivos para los refugios que crea la administración (REF-0001, REF-0002…)
CREATE SEQUENCE IF NOT EXISTS seq_refugio_codigo;
SELECT setval('seq_refugio_codigo', GREATEST(1, (SELECT count(*) FROM lugares WHERE tipo = 'refugio')),
  (SELECT count(*) FROM lugares WHERE tipo = 'refugio') > 0);
