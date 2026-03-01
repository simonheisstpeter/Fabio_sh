# ── Build stage ─────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage ───────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
# Copy pre-built node_modules (better-sqlite3 native bindings compiled in builder)
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the built files
COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/src/lib/seed.js ./src/lib/seed.js

# Setup DB directory
RUN mkdir -p /app/db
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "dist/server/entry.mjs"]