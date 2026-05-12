# ── Build stage ─────────────────────────────────
FROM node:26.1-alpine3.22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev

# ── Runtime stage ───────────────────────────────
FROM node:26.1-alpine3.22 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Utility scripts (run manually via Coolify terminal)
COPY --from=builder /app/src/lib/seed.js ./src/lib/seed.js
COPY --from=builder /app/src/lib/backup.js ./src/lib/backup.js
COPY --from=builder /app/src/lib/reset-admin.js ./src/lib/reset-admin.js

RUN mkdir -p /app/db
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "dist/server/entry.mjs"]
