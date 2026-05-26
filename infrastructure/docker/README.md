# Infrastructure Setup

This document outlines the infrastructure systems for async processing, caching, and worker orchestration.

## Components Overview

### 1. Redis Infrastructure

**Location**: `infrastructure/docker/redis`

Redis is used for:
- Queue storage (BullMQ)
- Session caching
- Rate limiting
- General data caching

**Configuration**:
- Image: `redis:7`
- Port: `6379`
- Persistence: Enabled with volume `/data`
- Health Check: `redis-cli ping`

**Connection**:
```env
REDIS_URL=redis://localhost:6379
```

### 2. BullMQ Queue System

**Location**: `apps/api/src/queue/`

Three main queues for async job processing:

#### Generation Queue
- **Purpose**: Generate interview questions and content
- **Concurrency**: 5 workers
- **Retry**: 3 attempts with exponential backoff (2s initial delay)
- **File**: `apps/worker/src/queues/generation.queue.ts`

#### Evaluation Queue
- **Purpose**: Evaluate test submissions and responses
- **Concurrency**: 3 workers
- **Retry**: 3 attempts with exponential backoff
- **File**: `apps/worker/src/queues/evaluation.queue.ts`

#### Analytics Queue
- **Purpose**: Process analytics events
- **Concurrency**: 10 workers
- **Retry**: 5 attempts with exponential backoff
- **File**: `apps/worker/src/queues/analytics.queue.ts`

### 3. Queue Configuration

**Location**: `apps/api/src/queue/queue-config.ts`

#### Retry Strategy
```typescript
{
  attempts: 3,         // Maximum retry attempts
  backoff: {
    type: 'exponential',
    delay: 2000        // Initial delay in ms
  }
}
```

#### Job Cleanup
```typescript
removeOnComplete: {
  age: 3600            // Remove completed jobs after 1 hour
},
removeOnFail: {
  age: 7200            // Keep failed jobs for 2 hours
}
```

### 4. Redis Cache Service

**Location**: `apps/api/src/cache/`

High-performance caching with type safety.

#### Cache Key Patterns
```typescript
CACHE_KEY_PATTERNS = {
  QUESTION: (id) => `question:{id}`,
  SESSION: (id) => `session:{id}`,
  ASSEMBLY: (id) => `assembly:{id}`,
  TEST: (id) => `test:{id}`,
  USER: (id) => `user:{id}`,
  TEMPLATE: (id) => `template:{id}`,
  JOB_RESULT: (jobId) => `job:result:{jobId}`,
  JOB_METADATA: (jobId) => `job:meta:{jobId}`,
}
```

#### Default TTL Values
- Question: 1 hour (3600s)
- Session: 24 hours (86400s)
- Assembly: 2 hours (7200s)
- Test: 1 hour (3600s)
- User: 30 minutes (1800s)
- Template: 6 hours (21600s)
- Refresh Token: 7 days (604800s)

### 5. Docker Infrastructure

#### Dockerfiles

**api.Dockerfile**: Builds and runs the NestJS API server
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["npm", "run", "--workspace=@intervu-ai/api", "start"]
```

**worker.Dockerfile**: Builds and runs the queue worker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["npm", "run", "--workspace=@intervu-ai/worker", "start"]
```

### 6. Docker Compose

**Location**: `infrastructure/docker/docker-compose.yml`

#### Services

**PostgreSQL**
- Image: `postgres:16`
- Port: `5432`
- Health Check: `pg_isready`
- Volumes: `postgres_data`

**Redis**
- Image: `redis:7`
- Port: `6379`
- Health Check: `redis-cli ping`
- Volumes: `redis_data`

**API Service**
- Depends on: PostgreSQL, Redis
- Port: `3000`
- Health Check: `GET /api/v1/health`
- Environment: Production

**Worker Service**
- Depends on: Redis
- Environment:
  - `ENABLE_GENERATION_QUEUE=true`
  - `ENABLE_EVALUATION_QUEUE=true`
  - `ENABLE_ANALYTICS_QUEUE=true`
  - `WORKER_CONCURRENCY=5`

### 7. Logger System

**Location**: `packages/shared-logger/`

Centralized logging with correlation tracking.

#### Features
- Structured logging with Pino
- Request/Response logging
- Error logging with stack traces
- Correlation ID tracking
- Queue and worker logging

#### Logger Usage
```typescript
import { AppLogger } from '@intervu-ai/shared-logger';

const logger = new AppLogger({
  name: 'my-service',
  isDevelopment: process.env.NODE_ENV === 'development',
});

logger.setContext({
  correlationId: 'uuid-here',
  jobId: 'job-123',
  queueName: 'generation',
});

logger.info('Processing job', { data });
logger.error('Job failed', error, { metadata });
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intervu_ai

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=supersecret32charactersminimumhere
JWT_REFRESH_SECRET=superrefreshsecret32charactersminimumhere

# API
PORT=3000

# Worker Configuration
WORKER_CONCURRENCY=5
ENABLE_GENERATION_QUEUE=true
ENABLE_EVALUATION_QUEUE=true
ENABLE_ANALYTICS_QUEUE=true

# Node Environment
NODE_ENV=development|staging|production
```

## Getting Started

### Local Development

1. **Start Docker Compose**
```bash
cd infrastructure/docker
docker-compose up -d
```

2. **Verify Services**
```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Check Redis
redis-cli -u redis://localhost:6379 ping

# Check PostgreSQL
psql -U postgres -h localhost -d intervu_ai
```

3. **Install Dependencies**
```bash
npm install
```

4. **Run Development Server**
```bash
npm run dev
```

### Production Deployment

1. **Build Images**
```bash
docker-compose build
```

2. **Start Services**
```bash
docker-compose up -d
```

3. **Monitor Health**
```bash
docker-compose ps
docker-compose logs -f api
docker-compose logs -f worker
```

## Queue Payload Contracts

### Generation Queue
```typescript
{
  jobId: string;
  type: 'generation';
  timestamp: number;
  userId?: string;
  correlationId?: string;
  payload: {
    assemblyId: string;
    templateId?: string;
    difficulty?: string;
    customPrompt?: string;
    retryCount?: number;
  };
}
```

### Evaluation Queue
```typescript
{
  jobId: string;
  type: 'evaluation';
  timestamp: number;
  userId: string;
  correlationId?: string;
  payload: {
    testId: string;
    userId: string;
    evaluationCriteria?: Record<string, any>;
    retryCount?: number;
  };
}
```

### Analytics Queue
```typescript
{
  jobId: string;
  type: 'analytics';
  timestamp: number;
  correlationId?: string;
  payload: {
    eventType: string;
    eventData: Record<string, any>;
    batchId?: string;
  };
}
```

## Health Checks

### Redis Health Check
```bash
redis-cli -u redis://localhost:6379 ping
# Response: PONG
```

### API Health Check
```bash
curl http://localhost:3000/api/v1/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "intervu-api",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "uptime": 123.45,
    "dependencies": {
      "redis": {
        "status": "healthy",
        "responseTime": 5
      }
    }
  }
}
```

### Worker Health Check
Workers connect to Redis and process queue jobs. Health is verified by the Docker health check command.

## Monitoring

### Queue Monitoring
Access queue status via API:
```typescript
// Get queue counts
await queueService.getQueueCounts(QueueType.GENERATION);
// Returns: { waiting, active, completed, failed, delayed }

// Get job status
await queueService.getJobState(QueueType.GENERATION, jobId);

// Retry failed job
await queueService.retryFailedJob(QueueType.GENERATION, jobId);
```

### Logs
Development logs use Pino Pretty for readable output.
Production logs are JSON formatted for log aggregation systems.

## Performance Tuning

### Worker Concurrency
Adjust in `.env`:
```env
WORKER_CONCURRENCY=5  # Increase for high throughput
```

### Redis Memory
Monitor Redis memory usage:
```bash
redis-cli -u redis://localhost:6379 INFO memory
```

### Connection Pooling
Configure in Redis connection manager (max retries, connection timeout).

## Troubleshooting

### Redis Connection Failed
1. Check Redis is running: `docker-compose ps`
2. Verify REDIS_URL: `echo $REDIS_URL`
3. Test connection: `redis-cli -u $REDIS_URL ping`

### Jobs Not Processing
1. Check worker logs: `docker-compose logs worker`
2. Verify queue configuration
3. Check Redis connectivity
4. Ensure ENABLE_*_QUEUE=true

### Memory Leaks
1. Monitor with `docker stats`
2. Check for unclosed Redis connections
3. Verify job cleanup configuration (removeOnComplete, removeOnFail)

## References

- BullMQ Docs: https://docs.bullmq.io
- Redis Docs: https://redis.io/docs
- Docker Compose: https://docs.docker.com/compose
- Pino Logger: https://getpino.io
