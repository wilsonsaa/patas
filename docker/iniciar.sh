#!/bin/sh
# Arranque del contenedor único de PATAS: PostgreSQL (solo socket local) y luego la API + web.
set -eu

: "${PGDATA:=/data/postgres}" "${PGHOST:=/tmp/pg}" "${PGUSER:=patas}" "${PGDATABASE:=patas}" "${UPLOAD_DIR:=/data/fotos}"
export PGDATA PGHOST PGUSER PGDATABASE UPLOAD_DIR
DATOS=$(dirname "$PGDATA")

if [ ! -w "$DATOS" ]; then
  echo "ERROR: no puedo escribir en $DATOS. Monta un volumen de Docker (-v patas_datos:/data)." >&2
  exit 1
fi
mkdir -p "$PGHOST" "$UPLOAD_DIR"
chmod 700 "$PGHOST"

# Secreto de sesión: si no se define JWT_SECRET, se genera una vez y se conserva en el volumen
if [ -z "${JWT_SECRET:-}" ]; then
  [ -s "$DATOS/secreto_sesion" ] || (umask 077; node -e "process.stdout.write(require('crypto').randomBytes(48).toString('hex'))" > "$DATOS/secreto_sesion")
  JWT_SECRET=$(cat "$DATOS/secreto_sesion")
  export JWT_SECRET
fi

# Primera vez: crear la base de datos
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "Creando la base de datos en $PGDATA ..."
  initdb -D "$PGDATA" -U "$PGUSER" -E UTF8 --locale=C --auth-local=trust --auth-host=reject >/dev/null
  NUEVA=1
fi

# PostgreSQL no abre puertos de red: solo el socket local, accesible únicamente dentro del contenedor
postgres -D "$PGDATA" -c listen_addresses='' -c unix_socket_directories="$PGHOST" -c unix_socket_permissions=0700 &
PG_PID=$!

i=0
until pg_isready -q -h "$PGHOST" -d postgres; do
  i=$((i + 1))
  if [ "$i" -gt 60 ] || ! kill -0 "$PG_PID" 2>/dev/null; then echo "ERROR: PostgreSQL no arrancó." >&2; exit 1; fi
  sleep 1
done
[ -z "${NUEVA:-}" ] || createdb -h "$PGHOST" -U "$PGUSER" "$PGDATABASE"

# Contraseña de la base de datos (DB_PASSWORD en el .env, llega como PGPASSWORD).
# La primera vez se asigna al usuario de PostgreSQL y desde ese momento toda conexión la exige.
if [ -n "${PGPASSWORD:-}" ] && grep -Eq '^local[[:space:]].*trust' "$PGDATA/pg_hba.conf"; then
  printf 'ALTER ROLE "%s" WITH PASSWORD :'"'"'clave'"'"';\n' "$PGUSER" | psql -q -h "$PGHOST" -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 -v clave="$PGPASSWORD" >/dev/null
  sed -i -E 's/^(local[[:space:]].*)trust[[:space:]]*$/\1scram-sha-256/' "$PGDATA/pg_hba.conf"
  pg_ctl reload -D "$PGDATA" >/dev/null
  echo "Contraseña de la base de datos configurada."
elif [ -z "${PGPASSWORD:-}" ]; then
  echo "AVISO: DB_PASSWORD no está definida; la base de datos solo está protegida por estar dentro del contenedor." >&2
fi

node "${APP_DIR:-/app}/dist/server.js" &
APP_PID=$!

apagar() {
  kill -TERM "$APP_PID" 2>/dev/null || true
  wait "$APP_PID" 2>/dev/null || true
  kill -INT "$PG_PID" 2>/dev/null || true      # apagado rápido y limpio de PostgreSQL
  wait "$PG_PID" 2>/dev/null || true
}
trap 'apagar; exit 0' TERM INT

# Si cualquiera de los dos procesos termina, se apaga el contenedor para que Docker lo reinicie
while kill -0 "$APP_PID" 2>/dev/null && kill -0 "$PG_PID" 2>/dev/null; do sleep 2; done
echo "Un proceso terminó de forma inesperada; apagando el contenedor." >&2
apagar
exit 1
