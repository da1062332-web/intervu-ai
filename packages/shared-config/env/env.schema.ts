import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum([
    'development',
    'production',
    'test'
  ]),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string(),

  JWT_SECRET: z.string(),

  OPENAI_API_KEY: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;