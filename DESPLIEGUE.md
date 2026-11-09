# PATAS · Guía de despliegue para la entidad

**Plataforma de Acogida Temporal y Adopción Segura** · versión 1.4

Esta guía explica cómo construir y poner en producción PATAS a partir del código fuente. La plataforma se
entrega **sin datos de prueba ni de ejemplo** y **sin claves dentro del código**: todas las contraseñas, claves y
datos de la entidad se definen en un único archivo `.env` que solo existe en el servidor.

---

## 1. Qué se despliega

Una sola imagen de Docker con tres piezas que corren en el mismo contenedor:

| Pieza | Tecnología | Detalle |
|---|---|---|
| Base de datos | PostgreSQL 17 | Sin puertos de red: solo un socket interno, protegido con contraseña (`DB_PASSWORD`). |
| API | Node.js 22 + Fastify 5 | Sesiones en cookie `HttpOnly`, contraseñas con scrypt, validación de toda entrada. |
| Aplicación web | React 19 + Vite + Tailwind | La sirve la misma API en el puerto 8080. |
| Mapas | Leaflet + OpenStreetMap | Librerías y datos abiertos, gratuitos y **sin clave**. |

Todo lo que no se puede perder queda en el volumen `/data`: la base de datos, las fotos que suben los usuarios y el
secreto de sesión.

## 2. Requisitos

- Servidor Linux con **Docker 24 o superior** y **Docker Compose v2** (`docker compose version`).
- 2 GB de RAM y 10 GB de disco como mínimo.
- Un **dominio** y un **proxy con HTTPS** delante del contenedor (Nginx, Traefik, Caddy, un balanceador o un
  Ingress de Kubernetes).
- Salida a internet desde el servidor hacia `www.google.com` (reCAPTCHA) y hacia el servidor de correo (SMTP).
- Una cuenta de correo para enviar notificaciones (SMTP) y las claves de reCAPTCHA v3 de la entidad.

## 3. Obtener el código

Descarga el paquete `patas-codigo-fuente-1.4.zip` y descomprímelo en el servidor, o clona el repositorio oficial:

```bash
unzip patas-codigo-fuente-1.4.zip -d patas && cd patas
```

## 4. Crear el archivo `.env`

```bash
cp .env.example .env
chmod 600 .env          # solo el administrador del servidor puede leerlo
nano .env
```

El archivo `.env.example` trae cada variable explicada. Estas son las más importantes:

### 4.1 Obligatorias

| Variable | Qué poner |
|---|---|
| `APP_URL` | Dirección pública con `https://` y sin barra final. Se usa en los enlaces de los correos. |
| `DB_PASSWORD` | Contraseña de la base de datos. Genérala con `openssl rand -base64 32`. |
| `ADMIN_EMAIL` | Correo del administrador inicial (control total). |
| `ADMIN_PASSWORD_HASH` | Hash de la contraseña del administrador (ver paso 5). |
| `COOKIE_SECURE` | `true` en producción (el sitio debe servirse por HTTPS). |
| `TRUST_PROXY` | `1` si hay un proxy o balanceador delante del contenedor. |

### 4.2 Recomendadas

| Variable | Para qué |
|---|---|
| `RECAPTCHA_SITE_KEY` y `RECAPTCHA_SECRET_KEY` | Protección contra robots (paso 6). |
| `SMTP_*` y `NOTIFICACIONES_CORREO` | Recuperación de contraseña y avisos por correo (paso 7). |
| `ENTIDAD_*` | Datos de contacto de la entidad que aparecen en el pie y en la política de privacidad. |
| `WHATSAPP_BIENESTAR` | Número de la línea de bienestar animal (57 + número, solo dígitos). |
| `JWT_SECRET` | Secreto de las sesiones. Si se deja vacío se genera solo y se guarda en el volumen. |

> **Generar secretos.** En Linux o macOS: `openssl rand -base64 32`. En Windows PowerShell:
> `[Convert]::ToBase64String((1..32 | % {Get-Random -Max 256}))`.
>
> **Caracteres especiales.** Si un valor contiene el símbolo `$`, escríbelo entre comillas simples: `SMTP_PASS='ab$cd'`.

## 5. Administrador inicial (control total)

El administrador se crea automáticamente en el **primer arranque**, solo si todavía no existe ninguno, con los datos
de `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH`. Tiene acceso a todo el panel: usuarios y roles, refugios, verificación de
hogares, solicitudes, seguimiento de adopciones, mapa de hallazgos, registros y donaciones.

### Opción A (recomendada): guardar solo el hash de la contraseña

La contraseña nunca queda escrita en el servidor; solo su hash, del que no se puede recuperar.

```bash
docker compose build
docker compose run --rm --no-deps --entrypoint node patas dist/cli.js hash
```

(En Windows PowerShell el comando es el mismo.)

El comando pide la contraseña dos veces (mínimo 12 caracteres, no se muestra en pantalla) e imprime una línea como:

```
ADMIN_PASSWORD_HASH=scrypt:Qm9n…:x7Yw…
```

Cópiala tal cual en el `.env`.

### Opción B: contraseña en texto

Escribe `ADMIN_PASSWORD=` (mínimo 12 caracteres), arranca la plataforma y **borra esa línea del `.env`** después
del primer arranque.

### Opción C: crear o restablecer un administrador con la plataforma ya en marcha

```bash
docker compose exec patas node dist/cli.js crear-admin correo@entidad.gov.co "Nombre del administrador"
```

Si el correo ya existe, la cuenta pasa a ser administradora y su contraseña se cambia. También sirve para
recuperar el acceso si se pierde la contraseña del administrador.

## 6. reCAPTCHA v3 de la entidad

1. Entra a <https://www.google.com/recaptcha/admin> con la cuenta de Google institucional.
2. Crea un sitio nuevo: etiqueta `PATAS`, tipo **Basado en puntuaciones (v3)**.
3. En **Dominios** agrega el dominio de producción (por ejemplo `patas.mosquera-cundinamarca.gov.co`).
4. Copia las dos claves en el `.env`:
   - **Clave del sitio** → `RECAPTCHA_SITE_KEY`
   - **Clave secreta** → `RECAPTCHA_SECRET_KEY`
5. Reinicia: `docker compose up -d`.

La protección se activa solo cuando están **las dos claves**. Desde ese momento el servidor verifica con Google el
ingreso, la creación de cuentas, la recuperación de contraseña y todos los formularios, y rechaza los envíos con
puntaje menor a `RECAPTCHA_MIN_SCORE` (0.5 por defecto). En la esquina inferior derecha aparece la insignia de Google
y el pie de página indica que el sitio está protegido por reCAPTCHA.

## 7. Correo electrónico (recuperación de contraseña y notificaciones)

Configura el servidor SMTP de la entidad en el `.env`:

| Proveedor | `SMTP_HOST` | `SMTP_PORT` | `SMTP_SECURE` | Notas |
|---|---|---|---|---|
| cPanel / hosting | `mail.dominio.gov.co` | `465` | `true` | Usuario y clave de la cuenta de correo. |
| Microsoft 365 | `smtp.office365.com` | `587` | `false` | El buzón debe tener habilitado «SMTP autenticado». |
| Google Workspace | `smtp.gmail.com` | `587` | `false` | Usa una «contraseña de aplicación». |

`SMTP_FROM` es el remitente que verán los ciudadanos y `NOTIFICACIONES_CORREO` la lista de correos de la entidad que
reciben los avisos (separados por coma). `APP_URL` es obligatoria para que los enlaces de los correos funcionen.

**Probar el envío:**

```bash
docker compose exec patas node dist/cli.js probar-correo tu-correo@entidad.gov.co
```

**Correos que envía la plataforma:**

| Evento | Ciudadano | Entidad |
|---|---|---|
| Recuperar contraseña (enlace de un solo uso, vence en 1 hora) | ✓ | |
| Recordar usuario (búsqueda por teléfono) | ✓ | |
| Solicitud de adopción radicada | ✓ | ✓ |
| Cambio de estado de la solicitud (evaluación, entrevista, aprobada, rechazada) | ✓ | |
| Inscripción de hogar de paso | | ✓ |
| Hogar verificado, rechazado o suspendido | ✓ | |
| Registro de mascota propia | ✓ | |
| Registro de canino de manejo especial y sus cambios de estado | ✓ | ✓ |
| Donación registrada | ✓ (si dejó correo) | ✓ |

Sin SMTP configurado la plataforma funciona igual: no envía correos y la recuperación de contraseña la hace el
administrador desde **Panel → Usuarios → Enlace para nueva contraseña**, que genera un enlace de un solo uso válido
por 24 horas para entregar por WhatsApp.

## 8. Construir y arrancar

```bash
docker compose up -d --build
docker compose logs -f patas                      # Ctrl+C para salir
docker compose exec patas node dist/cli.js estado # qué está configurado (sin mostrar secretos)
```

El primer arranque crea la base de datos, le asigna `DB_PASSWORD`, aplica las migraciones y crea el administrador.
Cuando el registro muestre `Administrador inicial listo` y `Server listening`, la plataforma está disponible en el
puerto `PUERTO_WEB` (8080 por defecto).

### HTTPS con un proxy inverso

El contenedor debe quedar detrás de HTTPS. Para que no sea accesible directamente desde internet, publícalo solo en
el equipo local con `PUERTO_WEB=127.0.0.1:8080`. Ejemplo con Nginx:

```nginx
server {
  listen 443 ssl http2;
  server_name patas.dominio.gov.co;
  ssl_certificate     /etc/letsencrypt/live/patas.dominio.gov.co/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/patas.dominio.gov.co/privkey.pem;
  client_max_body_size 6m;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

Con proxy: `COOKIE_SECURE=true` y `TRUST_PROXY=1`.

## 9. Primeros pasos dentro de la plataforma

La plataforma arranca vacía. Con el administrador:

1. **Ingresar** con el correo y la contraseña del administrador.
2. **Panel → Refugios → Nuevo refugio.** Crea el refugio o centro de bienestar animal del municipio, con su dirección,
   horario y ubicación en el mapa. Sin al menos un refugio u hogar verificado no se pueden publicar mascotas.
3. **Panel → Usuarios.** Asigna el rol **Gestor de refugio** al personal que publicará animales y gestionará solicitudes,
   y **Administrador** a quien deba tener control total.
4. **Publicar** los animales disponibles (botón *Publicar*), con su lugar de hallazgo si se conoce.
5. Revisar en **Panel → Hogares de paso** las inscripciones de la ciudadanía y marcarlas como *Verificado* después de
   la visita.

## 10. Roles y permisos

Registrarse siempre crea una cuenta de **ciudadano**. Los demás roles solo los asigna un administrador (o la
verificación de un hogar de paso), y el rol se lee de la base de datos en cada petición, así que un cambio aplica de
inmediato. Desactivar una cuenta cierra sus sesiones abiertas.

| Acción | Visitante | Ciudadano | Hogar de paso | Gestor de refugio | Administrador |
|---|:-:|:-:|:-:|:-:|:-:|
| Ver mascotas, refugios y mapa | ✓ | ✓ | ✓ | ✓ | ✓ |
| Registrar una donación | ✓ | ✓ | ✓ | ✓ | ✓ |
| Postularse a una adopción y ver sus solicitudes | | ✓ | ✓ | ✓ | ✓ |
| Registrar su mascota y caninos de manejo especial | | ✓ | ✓ | ✓ | ✓ |
| Inscribir un hogar de paso | | ✓ | | | |
| Publicar mascotas | | | Solo en su hogar | En cualquier refugio u hogar | En cualquier refugio u hogar |
| Gestionar solicitudes de adopción | | | Las de sus animales (sin ver la cédula) | Todas | Todas |
| Seguimiento de adopciones y mapa de hallazgos | | | Las de su hogar | Todas | Todas |
| Georreferenciar el lugar de hallazgo | | | Sus animales | Todos | Todos |
| Ver mascotas registradas y donaciones | | | | ✓ | ✓ |
| Revisar caninos de manejo especial | | | | | ✓ |
| Verificar hogares de paso y ver sus datos reservados | | | | | ✓ |
| Crear y editar refugios | | | | | ✓ |
| Usuarios: roles, desactivar, enlaces de contraseña | | | | | ✓ |

Reglas adicionales que aplica el servidor:

- Nadie puede gestionar su propia solicitud de adopción.
- Un administrador no puede quitarse su propio rol ni desactivar su propia cuenta, así que siempre queda al menos uno.
- El rol de hogar de paso solo se obtiene cuando la administración verifica el hogar; si se suspende, se retira.
- Una mascota con solicitudes activas o con adopción aprobada no se puede borrar, y solo el administrador puede
  cambiar el estado de un animal ya adoptado.
- Los hogares de paso se publican solo con su código: dirección, responsable y teléfono son reservados y cada
  consulta del administrador queda en la auditoría.

## 11. Copias de seguridad y restauración

**Copia de la base de datos** (programarla a diario con `cron`):

```bash
docker compose exec -T patas pg_dump -h /tmp/pg -U patas -Fc patas > patas-$(date +%F).dump
```

**Copia de las fotos:**

```bash
docker compose exec -T patas tar -C /data/fotos -cf - . > fotos-$(date +%F).tar
```

**Restaurar** (con la plataforma arrancada):

```bash
docker compose exec -T patas pg_restore -h /tmp/pg -U patas -d patas --clean --if-exists < patas-AAAA-MM-DD.dump
docker compose exec -T patas tar -C /data/fotos -xf - < fotos-AAAA-MM-DD.tar
docker compose restart
```

> El contenedor tiene el sistema de archivos en solo lectura, por eso las copias entran y salen por la entrada y
> salida estándar (`<` y `>`) y no con `docker cp`.

## 12. Mantenimiento

**Actualizar a una versión nueva:** reemplaza el código (conservando el `.env`) y ejecuta
`docker compose up -d --build`. Las migraciones de la base de datos se aplican solas al arrancar.

**Cambiar la contraseña de la base de datos:**

```bash
docker compose exec patas psql -h /tmp/pg -U patas -d postgres -c "ALTER ROLE patas PASSWORD 'NUEVA_CLAVE'"
# luego cambia DB_PASSWORD en el .env por la misma NUEVA_CLAVE
docker compose up -d
```

**Kubernetes:** la imagen corre sin privilegios y con sistema de archivos de solo lectura. Como la base de datos va
dentro del contenedor, despliega **una sola réplica** (`replicas: 1`, estrategia `Recreate`) con un
PersistentVolumeClaim montado en `/data`, un `emptyDir` en `/tmp` y las variables del `.env` en un `Secret`.

## 13. Mapas

Los mapas usan **Leaflet** (licencia BSD) y las teselas públicas de **OpenStreetMap** (datos abiertos ODbL): no
necesitan clave ni pago y muestran la atribución exigida. Para un tráfico alto, la política de uso de OpenStreetMap
recomienda un servidor de teselas propio o un proveedor: basta con indicar su dirección en `MAPA_TILES_URL` y su
atribución en `MAPA_ATRIBUCION`. La capa satelital es opcional (`MAPA_SATELITE_URL`) y debe venir de un proveedor
cuya licencia permita el uso institucional.

## 14. Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| `Define DB_PASSWORD en el archivo .env` | Falta `DB_PASSWORD` en el `.env`. |
| `password authentication failed` | Se cambió `DB_PASSWORD` sin cambiarla en la base de datos (ver paso 12). |
| El administrador no puede ingresar | Revisa el registro (`docker compose logs patas`). Si no se creó, usa la opción C del paso 5. |
| Los formularios dicen «No se pudo validar la protección anti-robots» | El dominio no está registrado en reCAPTCHA, las claves no corresponden o el servidor no llega a `www.google.com`. |
| No llegan los correos | Ejecuta `probar-correo` y revisa el registro; verifica puerto y `SMTP_SECURE`, y la carpeta de spam. |
| Los enlaces de los correos abren otra dirección | `APP_URL` debe ser la dirección pública exacta con `https://`. |
| La sesión se cierra al ingresar | Con `COOKIE_SECURE=true` el sitio debe abrirse por HTTPS. |

## 15. Lista de verificación antes de publicar

- [ ] `.env` completo, con permisos `600` y fuera de cualquier repositorio.
- [ ] `DB_PASSWORD` generada al azar y guardada en el gestor de contraseñas de la entidad.
- [ ] Administrador creado con hash (opción A) y `ADMIN_PASSWORD` vacía.
- [ ] Sitio servido por HTTPS, con `COOKIE_SECURE=true` y `TRUST_PROXY=1`.
- [ ] Claves de reCAPTCHA v3 de la entidad cargadas y el dominio registrado en Google.
- [ ] `probar-correo` recibido y `NOTIFICACIONES_CORREO` definido.
- [ ] Datos `ENTIDAD_*` completos (se ven en el pie y en la política de privacidad).
- [ ] Política de privacidad y términos validados por la oficina jurídica.
- [ ] Al menos un refugio creado en el panel.
- [ ] Copias de seguridad programadas.
