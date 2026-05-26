import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  REDIS_URL: z.string().url().describe('Redis connection string'),
  JWT_SECRET: z.string().min(32).describe('JWT signing secret'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .describe('JWT refresh token secret'),
});

export type EnvConfig = z.infer<typeof envSchema>;
