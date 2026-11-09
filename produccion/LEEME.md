# PATAS 1.5 · Imagen de producción

Esta carpeta trae la imagen de PATAS **ya construida** para probarla y publicarla sin compilar nada.

| Archivo | Qué es |
|---|---|
| `patas-1.5.tar.gz` | La imagen Docker completa (PostgreSQL 17 + API + aplicación web), para `linux/amd64`. **No se sube a git.** |
| `patas-1.5.tar.gz.sha256` | Huella para comprobar que el archivo llegó completo. |
| `docker-compose.yml` | Arranca la imagen sin compilar (`image:` en lugar de `build:`). |
| `.env.example` | Plantilla de configuración con los datos públicos de la Dirección de Protección Animal ya puestos. |

La imagen **no contiene claves, datos de prueba ni datos de ejemplo**: todo lo sensible se pone en `.env`.

---

## 1. Cargar la imagen

```bash
cd produccion
sha256sum -c patas-1.5.tar.gz.sha256          # Linux; en Windows: Get-FileHash patas-1.5.tar.gz
docker load -i patas-1.5.tar.gz               # deja disponible la imagen patas:1.5
docker images patas
```

## 2. Configurar el `.env`

```bash
cp .env.example .env
```

Completa como mínimo:

| Variable | Valor |
|---|---|
| `DB_PASSWORD` | Contraseña larga para la base de datos (`openssl rand -base64 32`). |
| `ADMIN_EMAIL` | Correo del administrador inicial. |
| `ADMIN_PASSWORD_HASH` | Hash de su contraseña (ver abajo). |
| `APP_URL` | Para probar en el equipo: `http://localhost:8080`. En producción, el dominio con `https://`. |
| `COOKIE_SECURE` | `false` **solo** para probar en `http://localhost`; `true` en producción con HTTPS. |

Generar el hash de la contraseña del administrador (mínimo 12 caracteres; mejor una frase larga):

```bash
docker run --rm -it --entrypoint node patas:1.5 dist/cli.js hash
```

Copia la línea que empieza por `scrypt:` en `ADMIN_PASSWORD_HASH` (si contiene `$`, ponla entre comillas simples).

Los datos de la Dirección (dirección, horario, teléfono, WhatsApp 311 485 4316, correo y coordenadas de la oficina
`4.707366, -74.230331`) ya vienen en la plantilla. Las claves de reCAPTCHA y del correo SMTP son opcionales para
la prueba y obligatorias para producción (ver `DESPLIEGUE.md`, pasos 6 y 7).

## 3. Arrancar

```bash
docker compose up -d
docker compose logs -f          # espera "Server listening"
```

Abre <http://localhost:8080> (o el puerto definido en `PUERTO_WEB`).

## 4. Lista de pruebas

1. **Ingresar** con el correo y la contraseña del administrador.
2. **Panel → Refugios → Nuevo refugio**: crea el refugio municipal y pega en *Latitud* `4.724340, -74.246247`
   (llena las dos coordenadas). Guarda.
3. **Mapa**: deben verse el refugio y la oficina de la Dirección (🏛️). Nada más.
4. **Hogares de paso**: con otra cuenta de ciudadano inscribe un hogar; verifícalo desde **Panel → Hogares de paso**.
   Vuelve al **Mapa**: el hogar **no** aparece, y en *Hogares* solo se ve su código `HP-…`.
5. **Reportar un animal abandonado**: sin iniciar sesión, en Inicio pulsa *Reportar ahora*, marca el punto en el mapa,
   describe el animal y envía. Debes ver el radicado `RAB-…`, el mapa del reporte, *Abrir en Google Maps* y el botón
   *Escribir por WhatsApp* con el mensaje listo para la Dirección.
6. **Panel → Reportes**: el reporte aparece en el mapa; cambia su estado a *En atención* y agrega una nota.
7. **Adopción**: publica una mascota, postúlate con la cuenta de ciudadano y apruébala desde el Panel.

## 5. Publicar en GitHub

### 5.1 El código

En la carpeta raíz del proyecto (la que contiene `Dockerfile`):

```bash
git init -b main
git add .
git status                      # comprueba que NO aparecen .env ni produccion/*.tar.gz
git commit -m "PATAS 1.5"
git remote add origin https://github.com/<organizacion>/patas.git
git push -u origin main
```

El `.gitignore` ya excluye `.env`, `node_modules`, `dist` y la imagen de esta carpeta.

### 5.2 La imagen, automáticamente (recomendado)

El repositorio incluye `.github/workflows/imagen.yml`. Al crear una etiqueta de versión, GitHub construye la imagen y
la publica en `ghcr.io/<organizacion>/patas`:

```bash
git tag v1.5.0
git push origin v1.5.0
```

Revisa el avance en la pestaña **Actions** del repositorio. La imagen queda en **Packages**; por defecto es privada
(se puede cambiar en *Package settings → Change visibility*).

### 5.3 La imagen, a mano (con este mismo archivo)

Crea un token en GitHub (*Settings → Developer settings → Personal access tokens*) con el permiso
`write:packages` y:

```bash
docker login ghcr.io -u <usuario-github>                  # pega el token como contraseña
docker tag patas:1.5 ghcr.io/<organizacion>/patas:1.5
docker push ghcr.io/<organizacion>/patas:1.5
```

### 5.4 Usar la imagen publicada en el servidor

En el `.env` del servidor agrega `PATAS_IMAGEN=ghcr.io/<organizacion>/patas:1.5` y:

```bash
docker login ghcr.io            # solo si el paquete es privado
docker compose pull && docker compose up -d
```

## 6. Copias de seguridad, actualización y problemas

Ver `DESPLIEGUE.md` en la raíz del proyecto (pasos 11 a 15). Los datos viven en el volumen `patas_datos`:
**no ejecutes `docker compose down -v`**, porque borra la base de datos y las fotos.
