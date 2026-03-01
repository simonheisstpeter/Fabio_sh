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

# FIX: Copy BOTH package.json AND package-lock.json
COPY --from=builder /app/package*.json ./

# Now npm ci will work
RUN npm ci --omit=dev

# Copy the rest of the built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/lib/seed.js ./src/lib/seed.js

# Setup DB directory
RUN mkdir -p /app/db
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321

CMD ["node", "dist/server/entry.mjs"]