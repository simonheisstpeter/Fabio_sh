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

# Migration CLI. The server migrates itself on boot (these are bundled into
# dist/ too) — these copies exist so `npm run migrate:status` works in a shell.
COPY --from=builder /app/src/lib/migrate.js ./src/lib/migrate.js
COPY --from=builder /app/src/lib/migrate-runner.js ./src/lib/migrate-runner.js
COPY --from=builder /app/src/lib/migrations.js ./src/lib/migrations.js

RUN mkdir -p /app/db
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "dist/server/entry.mjs"]
