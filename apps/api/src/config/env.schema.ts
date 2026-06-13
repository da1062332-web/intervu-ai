import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().describe("PostgreSQL connection string"),
  REDIS_URL: z.string().url().describe("Redis connection string"),
  JWT_SECRET: z.string().min(32).describe("JWT signing secret"),
  JWT_REFRESH_SECRET: z.string().min(32).describe("JWT refresh token secret"),
  OPENAI_API_KEY: z.string().startsWith("sk-").describe("OpenAI API key"),
  AUTH_LIMIT: z.coerce.number().default(10),
  AUTH_TTL: z.coerce.number().default(60000), // 60s
  ASSESSMENT_LIMIT: z.coerce.number().default(60),
  ASSESSMENT_TTL: z.coerce.number().default(60000), // 60s
  SUBMISSION_LIMIT: z.coerce.number().default(5),
  SUBMISSION_TTL: z.coerce.number().default(60000), // 60s
  DEFAULT_LIMIT: z.coerce.number().default(100),
  DEFAULT_TTL: z.coerce.number().default(60000), // 60s
});

export type EnvConfig = z.infer<typeof envSchema>;
