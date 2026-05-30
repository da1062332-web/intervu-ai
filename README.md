# InterVu AI

InterVu AI is a monorepo for an interview preparation platform built with:

- Next.js for the web app
- NestJS for the API
- BullMQ for background jobs
- Prisma for database access
- Turborepo for workspace orchestration

This repository is organized so new developers can work on the UI, API, worker, and shared packages in one place.

## Repository Structure

- `apps/web` - Next.js frontend
- `apps/api` - NestJS backend API
- `apps/worker` - background job worker
- `packages/database` - Prisma client, schema, migrations, and studio scripts
- `packages/shared-types` - shared TypeScript types
- `packages/shared-config` - shared config and env helpers
- `packages/shared-logger` - shared logging utilities
- `packages/shared-validation` - shared validation utilities
- `packages/shared-constants` - shared constants
- `packages/shared-errors` - shared error helpers
- `packages/shared-events` - shared event contracts
- `packages/shared-testing` - shared testing helpers
- `packages/ai-sdk` - AI-related shared utilities
- `infrastructure/docker` - Docker Compose and infrastructure docs

## Prerequisites

Install these before starting:

- Node.js 20.x
- npm 10.8.2
- Git
- Docker Desktop, or local PostgreSQL 16 and Redis 7

The repo includes `.nvmrc` with the Node version used by the project.

## Service Ports

By default this project uses:

- Web app: `http://localhost:3001`
- API: `http://localhost:3000`
- API health check: `http://localhost:3000/api/v1/health`
- API Swagger: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Environment Files

Create and configure the following files:

- `apps/api/.env` from `apps/api/.env.example`
- `apps/web/.env.local` from `apps/web/.env.example`

The API expects:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

The worker reads environment variables directly from the process, so you must provide the same core values in your terminal session before starting it:

- `NODE_ENV`
- `DATABASE_URL`
- `REDIS_URL`
- `WORKER_CONCURRENCY`
- `ENABLE_GENERATION_QUEUE`
- `ENABLE_EVALUATION_QUEUE`
- `ENABLE_ANALYTICS_QUEUE`

For local development, the web app should point to the API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Install

From the repository root:

```bash
npm install
```

## Local Setup

### 1. Start PostgreSQL and Redis

The easiest local path is Docker:

```bash
cd infrastructure/docker
docker compose up -d postgres redis
```

If you already have PostgreSQL and Redis running locally, you can skip Docker and use your own services instead.

### 2. Prepare the API env file

Create `apps/api/.env` with values similar to:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intervu_ai
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-long-secret-at-least-32-chars
JWT_REFRESH_SECRET=replace-with-another-long-secret-at-least-32-chars
```

Important:

- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be at least 32 characters.
- The API loads `.env` from the `apps/api` workspace when you start it from that workspace.

### 3. Prepare the web env file

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Set worker env vars

In PowerShell, set the worker environment for the current session before starting it:

```powershell
$env:NODE_ENV = "development"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intervu_ai"
$env:REDIS_URL = "redis://localhost:6379"
$env:WORKER_CONCURRENCY = "5"
$env:ENABLE_GENERATION_QUEUE = "true"
$env:ENABLE_EVALUATION_QUEUE = "true"
$env:ENABLE_ANALYTICS_QUEUE = "true"
$env:JWT_SECRET = "replace-with-a-long-secret-at-least-32-chars"
$env:JWT_REFRESH_SECRET = "replace-with-another-long-secret-at-least-32-chars"
```

## Database Setup

The Prisma workspace handles schema and migration tasks.

Generate the Prisma client:

```bash
npm run prisma:generate --workspace=@intervu-ai/database
```

Run migrations:

```bash
npm run prisma:migrate --workspace=@intervu-ai/database
```

Open Prisma Studio:

```bash
npm run prisma:studio --workspace=@intervu-ai/database
```

## Run the Apps

Run each service in its own terminal.

### API

```bash
npm run start:dev --workspace=@intervu-ai/api
```

### Web

```bash
npm run dev --workspace=@intervu-ai/web
```

The web script is configured to run on port `3001`.

### Worker

After setting the worker env vars in the same terminal session:

```bash
npm run start:dev --workspace=@intervu-ai/worker
```

## Useful Commands

Run these from the repository root:

```bash
npm run build
npm run lint
npm run type-check
npm run test
```

Workspace-level commands also work, for example:

```bash
npm run type-check --workspace=@intervu-ai/web
npm run type-check --workspace=@intervu-ai/api
npm run type-check --workspace=@intervu-ai/worker
```

## Common Checks

- If signup or login returns `404`, confirm the web app is on port `3001` and `NEXT_PUBLIC_API_URL` points to `http://localhost:3000`.
- If the API fails on startup with environment validation errors, check `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`.
- If the worker fails to start, verify that the environment variables are set in the same shell session before running the command.

## Suggested Development Flow

1. Install dependencies.
2. Start PostgreSQL and Redis.
3. Configure the API and web env files.
4. Generate Prisma client and run migrations.
5. Start the API, web app, and worker in separate terminals.
6. Open the web app at `http://localhost:3001`.

## Notes

- The root scripts are optimized for workspace-wide build, lint, type-check, and test tasks.
- The web app runs independently from the API, so the ports must stay separated.
- The worker currently reads from `process.env`, so it needs environment variables in the shell before launch.
