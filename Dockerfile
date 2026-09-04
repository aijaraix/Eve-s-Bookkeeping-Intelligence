# Multi-stage Docker build for Eve Bookkeeping & Dedicated Extraction Worker
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package manifests and canonical lockfile
COPY package.json package-lock.json ./

# Deterministic build dependency installation
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite client assets and compile backend server and dedicated extraction worker
RUN npm run build

# Stage 2: Production runtime image
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifests and canonical lockfile
COPY package.json package-lock.json ./

# Install production runtime dependencies strictly from lockfile
RUN npm ci --omit=dev

# Copy compiled production artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create storage directories for local document parsing and worker uploads
RUN mkdir -p /app/storage/worker_uploads /app/storage/uploads && chmod -R 777 /app/storage

# Default container port (Zeabur passes dynamic PORT at runtime)
ENV PORT=8080
EXPOSE 8080

# Production start command launching the Express server and extraction worker
CMD ["node", "dist/server.cjs"]
