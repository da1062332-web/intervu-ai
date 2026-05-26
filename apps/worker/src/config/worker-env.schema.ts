import { z } from 'zod';

export const workerEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  REDIS_URL: z.string().url().describe('Redis connection string'),
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  ENABLE_ANALYTICS_QUEUE: z.coerce.boolean().default(true),
  ENABLE_GENERATION_QUEUE: z.coerce.boolean().default(true),
  ENABLE_EVALUATION_QUEUE: z.coerce.boolean().default(true),
});

export type WorkerEnvConfig = z.infer<typeof workerEnvSchema>;
