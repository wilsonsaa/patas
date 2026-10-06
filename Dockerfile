# PATAS · imagen única: PostgreSQL + API + aplicación web en un solo contenedor.
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS api
WORKDIR /api
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
RUN apk add --no-cache postgresql17 tini \
 && addgroup -S patas && adduser -S -G patas -h /app patas \
 && mkdir -p /data && chown patas:patas /data
ENV NODE_ENV=production PORT=8080 \
    STATIC_DIR=/app/web UPLOAD_DIR=/data/fotos \
    PGDATA=/data/postgres PGHOST=/tmp/pg PGUSER=patas PGDATABASE=patas
WORKDIR /app
COPY --from=api /api/node_modules ./node_modules
COPY --from=api /api/dist ./dist
COPY backend/package.json ./
COPY backend/sql ./sql
COPY --from=web /web/dist ./web
COPY --chmod=755 docker/iniciar.sh /app/iniciar.sh
# Todo corre con un usuario sin privilegios; /data guarda la base de datos, las fotos y el secreto de sesión
USER patas
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=4s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/salud').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--", "/app/iniciar.sh"]
