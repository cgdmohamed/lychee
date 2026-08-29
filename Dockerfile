# syntax=docker/dockerfile:1

# ---- client build ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- server deps (native module build stage) ----
FROM node:20-alpine AS server-deps
RUN apk add --no-cache python3 make g++
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:20-alpine
RUN apk add --no-cache tini libstdc++ su-exec
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=server-deps --chown=node:node /app/server/node_modules ./server/node_modules
COPY --chown=node:node server/ ./server/
COPY --from=client-build --chown=node:node /app/client/dist ./client/dist
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN mkdir -p /app/server/data /app/server/uploads \
  && chown -R node:node /app \
  && chmod +x /app/docker-entrypoint.sh

# Deliberately no USER directive here — the entrypoint starts as root (needed to chown
# the mounted volumes on every boot, see docker-entrypoint.sh) and drops to the non-root
# `node` user itself via su-exec before running the app.

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||4000)+'/api/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]
