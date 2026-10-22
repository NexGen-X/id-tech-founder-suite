# ==============================================================
# ID-Tech Cloud — Founder & CEO Executive Suite Dockerfile
# Air-gapped Standalone C-Level Operations & Governance
# ==============================================================

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies across workspaces
RUN npm install

# Copy source trees
COPY server ./server
COPY client ./client

# Compile server and client bundles
RUN npm run build -w server
RUN npm run build -w client

# --------------------------------------------------------------
# Production Runtime Container
# --------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests & production server modules
COPY package.json ./
COPY server/package.json ./server/
RUN npm install --omit=dev --prefix server

# Copy compiled artifacts from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Non-root user for security
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-3001}/healthz || exit 1

CMD ["node", "server/dist/index.js"]
