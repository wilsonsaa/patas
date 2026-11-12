# PATAS 1.5 · Guía de despliegue en cPanel (versión PHP + MySQL)

Plataforma de Acogida Temporal y Adopción Segura · Alcaldía de Mosquera · Dirección de Protección Animal
Desarrollado por HostAddrees · https://hostaddrees.com

Esta versión hace lo mismo que la versión Docker y usa la misma aplicación web. Solo cambia el servidor:
la API está escrita en PHP y la base de datos es MySQL o MariaDB, así que corre en cualquier hosting con cPanel.

## Qué hay en el paquete

```
public_html.zip  → se extrae DENTRO de la carpeta pública del dominio (public_html o la del subdominio)
  index.html, assets/, fotos/, logos/   aplicación web ya compilada
  api/index.php                         puerta de entrada de la API (no contiene claves)
  uploads/                              fotos que suben los usuarios (bloqueada para código)
  .htaccess, .user.ini                  HTTPS, cabeceras de seguridad, rutas y límite de fotos

patas_app.zip    → se extrae en /home/TU_USUARIO, FUERA de public_html
  patas_app/
    .env            ← AQUÍ van la base de datos y las claves (ya trae los datos de la Dirección)
    .env.example    plantilla de referencia comentada
    bootstrap.php, src/   código de la API
    sql/001_esquema.sql   tablas (se crean solas en el primer acceso)
    cli.php               consola de administración (cPanel > Terminal)
    storage/              registros y secreto de sesión (no se publica)
```

**El único archivo donde van claves es `/home/TU_USUARIO/patas_app/.env`.** Nada de `public_html` contiene claves.

---

## Paso 1 · Versión de PHP

cPanel > **Select PHP Version** (o *MultiPHP Manager*): elige **PHP 8.3** (mínimo 8.1).
Confirma que estén activas las extensiones `pdo_mysql`, `curl`, `mbstring`, `openssl`, `fileinfo` e `intl`.

## Paso 2 · Base de datos MySQL

1. cPanel > **Asistente de bases de datos MySQL** (*MySQL Database Wizard*).
2. Nombre de la base: `patas` → cPanel la deja como `TUUSUARIO_patas`.
3. Usuario: `patas` → queda `TUUSUARIO_patas`. Usa el generador de contraseñas y **cópiala**.
4. Privilegios: marca **TODOS LOS PRIVILEGIOS**.

Las tablas no se crean a mano: la plataforma las crea sola en el primer acceso.

## Paso 3 · Subir la carpeta privada `patas_app`

1. cPanel > **Administrador de archivos** > entra a tu carpeta de inicio `/home/TU_USUARIO`
   (la que contiene `public_html`; **no** entres a `public_html`).
2. **Cargar** > sube `patas_app.zip`. Luego clic derecho > **Extract**.
3. Debe quedar `/home/TU_USUARIO/patas_app/`.
4. Arriba a la derecha, en **Configuración**, marca **Mostrar archivos ocultos (dotfiles)** para ver el `.env`.

## Paso 4 · Completar el `.env` (variables de la base de datos)

Clic derecho en `patas_app/.env` > **Edit** y completa:

| Variable | Valor |
|---|---|
| `DB_NAME` | La base del paso 2, por ejemplo `TUUSUARIO_patas` |
| `DB_USER` | El usuario del paso 2, por ejemplo `TUUSUARIO_patas` |
| `DB_PASS` | La contraseña que generaste en el paso 2 |
| `APP_URL` | La dirección del sitio con `https://` y sin barra final |
| `ADMIN_EMAIL` | Correo del administrador inicial |
| `ADMIN_PASSWORD` | Su contraseña (mínimo 12 caracteres). **Bórrala después del primer ingreso** |

`DB_HOST` se deja en `localhost`. Si un valor tiene espacios, `#` o `$`, va entre comillas simples: `DB_PASS='a$b#c'`.

Los datos de la Dirección (dirección, horario, teléfono, WhatsApp 311 485 4316, correo y la ubicación de la
oficina `4.707366, -74.230331`) ya vienen escritos.

> **Con Terminal (recomendado):** en lugar de la contraseña en texto, genera un hash y usa `ADMIN_PASSWORD_HASH`:
> `cd ~/patas_app && php cli.php hash` y copia la línea que entrega.

## Paso 5 · Subir la aplicación a `public_html`

1. Entra a `public_html` (o a la carpeta del subdominio, por ejemplo `/home/TU_USUARIO/patas.dominio.gov.co`).
2. Si había un sitio anterior, haz una copia (clic derecho > *Compress*) y vacía la carpeta.
3. **Cargar** > `public_html.zip` > clic derecho > **Extract** > borra el `.zip`.
4. Comprueba que quedaron `index.html`, `api/`, `uploads/` y el archivo oculto `.htaccess`.

`api/index.php` busca `patas_app` junto a la carpeta pública (`/home/TU_USUARIO/patas_app`).
Funciona igual para el dominio principal y para un subdominio.

## Paso 6 · Certificado SSL

cPanel > **SSL/TLS Status** > **Run AutoSSL**. El `.htaccess` envía todo a `https://`.
Mientras no haya certificado el inicio de sesión no funciona, porque la cookie solo viaja por HTTPS (`COOKIE_SECURE=true`).

## Paso 7 · Primer ingreso

1. Abre `https://TU_DOMINIO/api/salud`: debe responder `{"ok":true}`.
2. Abre `https://TU_DOMINIO/`. En la primera visita se crean las tablas y el administrador.
3. **Ingresar** con `ADMIN_EMAIL` y la contraseña.
4. **Borra `ADMIN_PASSWORD`** del `.env` (o déjalo vacío). El administrador ya quedó guardado.
5. **Panel → Refugios → Nuevo refugio**: pega `4.724340, -74.246247` en *Latitud* y se llenan las dos coordenadas.

## Paso 8 · reCAPTCHA v3 de la entidad

1. <https://www.google.com/recaptcha/admin> > nuevo sitio > **Basado en puntuaciones (v3)** > dominio del sitio.
2. En el `.env`: `RECAPTCHA_SITE_KEY` (clave del sitio) y `RECAPTCHA_SECRET_KEY` (clave secreta).
3. Se activa solo cuando están las dos. Los cambios del `.env` aplican de inmediato, sin reiniciar nada.

## Paso 9 · Correo (recuperación de contraseña y avisos)

1. cPanel > **Cuentas de correo** > crea `no-responder@TU_DOMINIO`.
2. En esa cuenta: **Connect Devices** muestra el servidor de salida (normalmente `mail.TU_DOMINIO`, puerto 465 SSL).
3. En el `.env`:

```
CORREO_TRANSPORTE=smtp
SMTP_HOST=mail.TU_DOMINIO
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-responder@TU_DOMINIO
SMTP_PASS='la clave de esa cuenta'
SMTP_FROM='PATAS Mosquera <no-responder@TU_DOMINIO>'
NOTIFICACIONES_CORREO=direcciondeproteccionybienestaranimal@mosquera-cundinamarca.gov.co
```

Probar: `php cli.php probar-correo tu@correo.com` (Terminal), o pide una recuperación de contraseña desde el sitio.
Sin correo configurado la plataforma funciona: el administrador genera el enlace de recuperación en **Panel → Usuarios**.

## Consola de administración (cPanel > Terminal)

```bash
cd ~/patas_app
php cli.php estado                      # qué está configurado (sin mostrar claves)
php cli.php hash                        # hash de contraseña para ADMIN_PASSWORD_HASH
php cli.php crear-admin correo@dominio "Nombre"   # crear o restablecer un administrador
php cli.php probar-correo correo@dominio
php cli.php instalar                    # crea las tablas sin abrir el sitio
```

## Copias de seguridad

- cPanel > **JetBackup** (si está disponible): copia completa diaria.
- Manual: **phpMyAdmin** > base `TUUSUARIO_patas` > *Exportar*, y descarga la carpeta `public_html/uploads` (fotos).
- Guarda también una copia del `.env` en un lugar seguro, fuera del servidor.

## Seguridad incluida

- Contraseñas con Argon2id (o bcrypt si el servidor no lo tiene); sesión en cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Cabecera anti-CSRF en toda escritura, límites de intentos por IP, reCAPTCHA v3 en los formularios públicos.
- Fotos validadas por su contenido real; la carpeta `uploads` no ejecuta código.
- Los hogares de paso **nunca** guardan coordenadas (la base de datos lo impide) ni publican dirección, responsable o teléfono.
- Auditoría de accesos a datos reservados, cambios de rol y restablecimientos.
- `.env`, `storage` y el código de la API quedan fuera de la carpeta pública.

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `/api/salud` dice *faltan DB_NAME y DB_USER* | El `.env` no está en `patas_app` o no tiene esos valores. |
| *No se pudo conectar a la base de datos* | Revisa `DB_NAME`, `DB_USER` y `DB_PASS` (con el prefijo de cPanel) y que el usuario tenga privilegios. |
| *Falta la carpeta privada patas_app* | `patas_app` no quedó junto a la carpeta pública. Muévela a `/home/TU_USUARIO/patas_app`. |
| Entra pero la sesión se pierde | El sitio no está en HTTPS. Activa AutoSSL (paso 6). |
| No se crea el administrador | `ADMIN_PASSWORD` con menos de 12 caracteres, o hash mal copiado. Revisa `patas_app/storage/logs/`. |
| La página carga sin estilos o da 404 en rutas | Falta el `.htaccess` (archivo oculto) en la carpeta pública. |
| No sube fotos grandes | El hosting limita la subida: en *Select PHP Version > Options* pon `upload_max_filesize` en 6M. |
| Error 500 | Revisa `patas_app/storage/logs/patas-AAAA-MM.log` y cPanel > *Errors*. |
