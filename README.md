# PATAS · Plataforma de Acogida Temporal y Adopción Segura

Plataforma del municipio de Mosquera (Cundinamarca) que conecta adoptantes, refugios, hogares de paso y los
servicios de la Secretaría de Ambiente y la Dirección de Protección Animal.

## Puesta en marcha

Toda la plataforma vive en **una imagen y un contenedor**: PostgreSQL, la API y la aplicación web.

```bash
cp .env.example .env                 # completar: ver DESPLIEGUE.md
docker compose run --rm --no-deps --entrypoint node patas dist/cli.js hash   # hash del administrador
docker compose up -d --build
```

**La guía completa para la entidad está en [DESPLIEGUE.md](DESPLIEGUE.md)**: variables de entorno, administrador
inicial, reCAPTCHA, correo, HTTPS, roles y permisos, copias de seguridad y solución de problemas.

La plataforma arranca vacía (sin datos de ejemplo) y no contiene claves en el código.

## Estructura

| Ruta | Contenido |
|---|---|
| `Dockerfile` | Imagen única: compila la web y la API, e instala PostgreSQL 17. |
| `DESPLIEGUE.md` | Guía de despliegue y operación para la entidad. |
| `.env.example` | Plantilla de configuración: todas las claves y datos de la entidad. |
| `docker/iniciar.sh` | Arranque: crea la base la primera vez, levanta PostgreSQL (solo socket local) y la API. |
| `frontend/` | Aplicación web: React 19 + Vite + Tailwind 4 + Leaflet. La sirve la propia API. |
| `backend/` | API: Node 22 + Fastify 5. Migraciones en `backend/sql/`. Pruebas en `backend/test/`. |

## Qué hace

- **Adopción**: galería de mascotas, hoja de vida, solicitud con radicado y seguimiento del estado.
- **Hogares de paso**: inscripción con visita de verificación. Públicamente solo existe un código (`HP-0001`).
- **Registro de mascota propia**: datos del propietario, de la mascota y de vacunación.
- **Caninos de manejo especial**: registro según la Ley 1801 de 2016 (arts. 126 a 128), con póliza y vacunas.
- **Quiero donar**: solo en especie y voluntariado; la plataforma no recibe dinero.
- **Seguimiento de adopciones** (Panel): historial de visitas, llamadas y reportes, con la próxima visita programada.
- **Lugar de hallazgo**: administración, refugios y hogares de paso marcan en un mapa dónde se encontró cada animal. La
  coordenada es interna (Panel > Mapa de hallazgos); en la hoja de vida solo se publica la referencia escrita.
- **Recuperar contraseña o usuario**: por correo si hay SMTP configurado; si no, el administrador genera un enlace de un
  solo uso en Panel > Usuarios y lo envía por WhatsApp.
- **WhatsApp de la línea de bienestar animal**: botón flotante y en el pie, con `WHATSAPP_BIENESTAR`.
- **Panel institucional**: refugios, usuarios y roles, verificación de hogares, solicitudes, seguimiento, registros y donaciones.
- **Notificaciones por correo** a la ciudadanía y a la entidad (ver DESPLIEGUE.md, paso 7).

### Roles

| Rol | Puede |
|---|---|
| Visitante | Ver mascotas, refugios, mapa; registrar una donación. |
| Ciudadano (`adoptante`) | Postularse a adopciones, registrar mascotas, inscribir un hogar, ver sus trámites. |
| Hogar de paso verificado | Publicar mascotas de su hogar y gestionar sus solicitudes (sin ver la cédula). |
| Gestor de refugio (`refugio_admin`) | Gestionar todas las mascotas y solicitudes, ver registros y donaciones. |
| Administrador (`admin`) | Control total: usuarios y roles, refugios, verificación de hogares y sus datos reservados. |

Los roles se asignan desde Panel > Usuarios. Matriz completa de permisos: DESPLIEGUE.md, paso 10.

## Seguridad

- **Ubicación de hogares protegida**: la API pública no entrega dirección, sector, responsable, teléfono ni correo de
  un hogar de paso, y la base de datos impide guardarles coordenadas. Solo el administrador los consulta, y cada
  consulta queda en la tabla `auditoria`.
- Sesión en cookie `HttpOnly` + `SameSite=Lax` (JWT de 8 h). Contraseñas con scrypt. El rol se lee de la base en cada petición.
- Anti-CSRF por cabecera propia y sin CORS; límite de peticiones global y más estricto en acceso y formularios.
- **reCAPTCHA v3** en el acceso y en todos los formularios: el servidor verifica cada envío con Google (acción y
  puntaje mínimo 0.5). Se activa al definir `RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY` de la entidad; el
  contenedor necesita salida a internet hacia `www.google.com`.
- Toda entrada se valida con esquemas (zod) y todo SQL es parametrizado.
- Fotos: solo JPG/PNG/WebP verificados por contenido, máximo 5 MB, nombre aleatorio.
- Content-Security-Policy y cabeceras de seguridad desde la API; el contenedor corre sin root, con sistema de archivos
  de solo lectura y sin capacidades. PostgreSQL no abre puertos: solo un socket local dentro del contenedor, con
  contraseña (`DB_PASSWORD`).
- Ningún secreto vive en el código: todo se configura en el `.env` (ver `.env.example`).
- Datos personales: autorización expresa (Ley 1581 de 2012) en cada formulario; en lo público solo aparece el primer
  nombre de quien adoptó.

### Antes de salir a producción

Ver la lista de verificación en DESPLIEGUE.md, paso 15.

## Desarrollo sin Docker

```bash
# API (necesita PostgreSQL)
cd backend && npm install
DATABASE_URL=postgres://usuario:clave@localhost:5432/patas JWT_SECRET=$(openssl rand -hex 32) \
  ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD=UnaClaveLarga2026 npm run dev

# Web (otra terminal)
cd frontend && npm install && npm run dev      # http://localhost:5173

# Pruebas de extremo a extremo contra la API en marcha
cd backend && API_URL=http://localhost:3000 ADMIN_EMAIL=admin@local.test ADMIN_PASSWORD=UnaClaveLarga2026 npm test
```
