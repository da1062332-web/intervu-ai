# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy lockfiles and configurations
COPY package*.json ./
COPY tsconfig*.json ./
COPY turbo.json ./

# Copy internal packages and apps
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the API and Worker using Turborepo
RUN npx turbo run build --filter=@intervu-ai/api --filter=@intervu-ai/worker

# Prune devDependencies to keep image size small
RUN npm prune --production

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy compiled files and required node_modules from builder
COPY --from=builder /app /app

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV WORKER_CONCURRENCY=1

# Expose port
EXPOSE 10000

# Start the combined process
CMD ["node", "scripts/start-combined.js"]
