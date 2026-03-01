# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
# Install all deps including devDeps (needed for build)
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Copy built output and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy seed script (run manually: node src/lib/seed.js)
COPY --from=builder /app/src/lib/seed.js ./src/lib/seed.js

# Ensure the db directory exists (volume will be mounted here)
RUN mkdir -p /app/db

EXPOSE 4321

ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "dist/server/entry.mjs"]
