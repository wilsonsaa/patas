# PATAS · Plataforma de Acogida Temporal y Adopción Segura

Plataforma del municipio de Mosquera (Cundinamarca) que conecta adoptantes, refugios, hogares de paso y los
servicios de la Secretaría de Ambiente y la Dirección de Protección Animal.

## Puesta en marcha (un solo contenedor)

Toda la plataforma vive en **una imagen y un contenedor**: PostgreSQL, la API y la aplicación web.

```bash
cp .env.example .env        # define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres)
docker compose up -d --build
```

Abre <http://localhost:8080>. O sin compose:

```bash
docker build -t patas:1.1 .
docker run -d --name patas -p 8080:8080 -v patas_datos:/data \
  -e ADMIN_EMAIL=admin@tu-dominio.gov.co -e ADMIN_PASSWORD='UnaClaveLarga2026' -e SEED_DEMO=true patas:1.1
```

El volumen `/data` guarda **todo lo que no se puede perder**: la base de datos, las fotos y el secreto de sesión.
Sin ese volumen los datos desaparecen al borrar el contenedor. Copia de seguridad:

```bash
docker exec patas pg_dump -h /tmp/pg -U patas patas > respaldo.sql
```

Al ser un contenedor con la base adentro, corre **una sola réplica** (en Kubernetes: `replicas: 1` con un
PersistentVolumeClaim en `/data`); no se puede escalar horizontalmente.

## Estructura

| Ruta | Contenido |
|---|---|
| `Dockerfile` | Imagen única: compila la web y la API, e instala PostgreSQL 17. |
| `docker/iniciar.sh` | Arranque: crea la base la primera vez, levanta PostgreSQL (solo socket local) y la API. |
| `frontend/` | Aplicación web: React 19 + Vite + Tailwind 4 + Leaflet. La sirve la propia API. |
| `backend/` | API: Node 22 + Fastify 5. Migraciones en `backend/sql/`. Pruebas en `backend/test/`. |
| `_respaldo_prototipo/` | Prototipo original de AI Studio y archivos de la versión de tres contenedores. |

## Qué hace

- **Adopción**: galería de mascotas, hoja de vida, solicitud con radicado y seguimiento del estado.
- **Hogares de paso**: inscripción con visita de verificación. Públicamente solo existe un código (`HP-0001`).
- **Registro de mascota propia**: datos del propietario, de la mascota y de vacunación.
- **Caninos de manejo especial**: registro según la Ley 1801 de 2016 (arts. 126 a 128), con póliza y vacunas.
- **Quiero donar**: formulario de intención; la plataforma no recibe dinero.
- **Panel institucional**: verificación de hogares, registros, donaciones y gestión de solicitudes.

### Roles

| Rol | Puede |
|---|---|
| Visitante | Ver mascotas, refugios, mapa; registrar una donación. |
| Ciudadano (`adoptante`) | Postularse a adopciones, registrar mascotas, inscribir un hogar, ver sus trámites. |
| Hogar de paso verificado | Publicar mascotas de su hogar y gestionar sus solicitudes (sin ver la cédula). |
| Gestor de refugio (`refugio_admin`) | Gestionar todas las mascotas y solicitudes, ver registros y donaciones. |
| Administrador (`admin`) | Todo lo anterior, verificar hogares y ver sus datos reservados. |

El rol `refugio_admin` se asigna por base de datos:
`UPDATE usuarios SET rol='refugio_admin' WHERE correo='...';`

## Seguridad

- **Ubicación de hogares protegida**: la API pública no entrega dirección, sector, responsable, teléfono ni correo de
  un hogar de paso, y la base de datos impide guardarles coordenadas. Solo el administrador los consulta, y cada
  consulta queda en la tabla `auditoria`.
- Sesión en cookie `HttpOnly` + `SameSite=Lax` (JWT de 8 h). Contraseñas con scrypt. El rol se lee de la base en cada petición.
- Anti-CSRF por cabecera propia y sin CORS; límite de peticiones global y más estricto en acceso y formularios.
- Toda entrada se valida con esquemas (zod) y todo SQL es parametrizado.
- Fotos: solo JPG/PNG/WebP verificados por contenido, máximo 5 MB, nombre aleatorio.
- Content-Security-Policy y cabeceras de seguridad desde la API; el contenedor corre sin root, con sistema de archivos
  de solo lectura y sin capacidades. PostgreSQL no abre puertos: solo un socket local dentro del contenedor.
- Datos personales: autorización expresa (Ley 1581 de 2012) en cada formulario; en lo público solo aparece el primer
  nombre de quien adoptó.

### Antes de salir a producción

1. Servir por **HTTPS** (Ingress o proxy) y poner `COOKIE_SECURE=true` y `TRUST_PROXY=1`.
2. `SEED_DEMO=false` y reemplazar los datos del refugio (están en `backend/src/seed.ts`) y las líneas de atención
   del pie de página (`frontend/src/components/Footer.tsx`), que hoy son de ejemplo.
3. Programar copias de seguridad del volumen `/data`.
4. Que el área jurídica valide los textos legales y la política de tratamiento de datos.
5. Ajustar el formulario de mascota propia a los campos exactos del formato de vacunación de Salud
   (`frontend/src/components/ModalMascotaPropia.tsx` y `backend/sql/`).

## Desarrollo sin Docker

```bash
# API (necesita PostgreSQL)
cd backend && npm install
DATABASE_URL=postgres://usuario:clave@localhost:5432/patas JWT_SECRET=$(openssl rand -hex 32) \
  ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD=UnaClaveLarga2026 SEED_DEMO=true npm run dev

# Web (otra terminal)
cd frontend && npm install && npm run dev      # http://localhost:5173

# Pruebas de extremo a extremo contra la API en marcha
cd backend && API_URL=http://localhost:3000 ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD=UnaClaveLarga2026 npm test
```
