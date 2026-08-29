#!/bin/sh
set -e

# Runs as root (see Dockerfile — no static USER directive). Named volumes only inherit
# ownership from the image at their *first* mount; an existing volume from a prior
# deploy (e.g. before this container ran as non-root) stays root-owned otherwise,
# which would make every write from the non-root `node` user below fail with EACCES.
# Fixing it here, on every boot, handles both a fresh volume and an existing one.
chown -R node:node /app/server/data /app/server/uploads

exec su-exec node sh -c "node server/src/db/seed.js && node server/src/index.js"
