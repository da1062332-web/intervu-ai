# --- Build Stage ---
FROM node:20-alpine AS builder

# Install build dependencies for Prisma and native C++ modules (like bcrypt)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy lockfiles and configurations
COPY package*.json ./
COPY tsconfig*.json ./
COPY turbo.json ./

# Copy all workspaces (packages, apps, generation, scripts)
COPY packages ./packages
COPY apps ./apps
COPY generation ./generation
COPY scripts ./scripts

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the API and Worker using Turborepo
RUN npx turbo run build --filter=@intervu-ai/api --filter=@intervu-ai/worker

# Prune devDependencies to keep image size small
RUN npm prune --production

# Re-install only the prisma CLI (needed at runtime for migrations in start-combined.js)
RUN npm install prisma@5 --save-dev --workspace=@intervu-ai/database --ignore-scripts

# --- Production Stage ---
FROM node:20-alpine AS runner

# Install compatibility libraries for running Prisma and native binaries in Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy compiled files and required node_modules from builder with correct ownership
COPY --from=builder --chown=node:node /app /app

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=7860
ENV WORKER_CONCURRENCY=1

# Expose port (Hugging Face Spaces expects port 7860)
EXPOSE 7860

# Switch to the non-root 'node' user for security compliance on Hugging Face
USER node

# Start the combined process
CMD ["node", "scripts/start-combined.js"]
