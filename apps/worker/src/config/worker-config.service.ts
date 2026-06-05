import { workerEnvSchema, WorkerEnvConfig } from "./worker-env.schema";

export class WorkerConfigService {
  private config: WorkerEnvConfig;

  constructor() {
    try {
      this.config = workerEnvSchema.parse(process.env);
    } catch (error) {
      console.error("Invalid environment variables:", error);
      throw error;
    }
  }

  get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  get redisUrl(): string {
    return this.config.REDIS_URL;
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get workerConcurrency(): number {
    return this.config.WORKER_CONCURRENCY;
  }

  get enableAnalyticsQueue(): boolean {
    return this.config.ENABLE_ANALYTICS_QUEUE;
  }

  get enableGenerationQueue(): boolean {
    return this.config.ENABLE_GENERATION_QUEUE;
  }

  get enableEvaluationQueue(): boolean {
    return this.config.ENABLE_EVALUATION_QUEUE;
  }

  get isDevelopment(): boolean {
    return this.config.NODE_ENV === "development";
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === "production";
  }
}
