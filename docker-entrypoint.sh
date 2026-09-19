#!/bin/sh
# Container entrypoint: migrate, then start the server as an unprivileged user.
set -e

if [ "$(id -u)" = "0" ]; then
  # Coolify mounts the persistent volume root-owned. Hand it to the app user,
  # then re-run this script without privileges.
  mkdir -p /app/db
  chown -R node:node /app/db
  exec su-exec node "$0" "$@"
fi

# Apply pending schema migrations (snapshotting the DB first) *before* serving,
# so a bad migration fails the deploy instead of every request. Idempotent.
node src/lib/migrate.js up

exec "$@"
