# Multi-stage Docker build for Eve Bookkeeping Extraction Server
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package manifests and generated lockfile
COPY package*.json ./

# Install all build dependencies
RUN npm ci || npm install

# Copy source tree
COPY . .

# Build Vite frontend bundle and standalone backend server & worker bundles
RUN npm run build

# Stage 2: Production runtime image
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy manifests and install production-only dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled production artifacts
COPY --from=builder /app/dist ./dist

# Create storage directory for uploads
RUN mkdir -p /app/storage/worker_uploads && chmod 777 /app/storage/worker_uploads

EXPOSE 8080

# Production start command launching the Express server and extraction worker
CMD ["node", "dist/server.cjs"]
