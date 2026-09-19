# ── Build stage ─────────────────────────────────
FROM node:26.3-alpine3.24 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev

# ── Runtime stage ───────────────────────────────
FROM node:26.3-alpine3.24 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Utility scripts (run manually via Coolify terminal)
COPY --from=builder /app/src/lib/seed.js ./src/lib/seed.js
COPY --from=builder /app/src/lib/backup.js ./src/lib/backup.js
COPY --from=builder /app/src/lib/reset-admin.js ./src/lib/reset-admin.js

# Migration CLI. The entrypoint runs `migrate.js up` before the server starts;
# these copies also let `npm run migrate:status` work in a shell.
COPY --from=builder /app/src/lib/migrate.js ./src/lib/migrate.js
COPY --from=builder /app/src/lib/migrate-runner.js ./src/lib/migrate-runner.js
COPY --from=builder /app/src/lib/migrations.js ./src/lib/migrations.js

# su-exec lets the entrypoint chown the mounted volume, then drop root.
RUN apk add --no-cache su-exec && mkdir -p /app/db
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

# robots.txt is served without touching the DB or any upstream API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4321/robots.txt || exit 1

# Runs migrations, then starts the server as the unprivileged `node` user.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server/entry.mjs"]
