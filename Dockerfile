# ── Build stage ─────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ── Runtime stage ───────────────────────────────
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
# node_modules pruned to prod-only deps in builder (better-sqlite3 native bindings intact)
COPY --from=builder /app/node_modules ./node_modules

# Built server + seed script (run manually: node src/lib/seed.js)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/lib/seed.js ./src/lib/seed.js

# Setup DB directory
RUN mkdir -p /app/db
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "dist/server/entry.mjs"]
