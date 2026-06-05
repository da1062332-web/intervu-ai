import Redis from "ioredis";
import { type ConnectionOptions } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import { GenerationQueueProcessor } from "./queues/generation.queue";
import { EvaluationQueueProcessor } from "./queues/evaluation.queue";
import { AnalyticsQueueProcessor } from "./queues/analytics.queue";
import { WorkerConfigService } from "./config/worker-config.service";

interface IQueueProcessor {
  close(): Promise<void>;
}

export class WorkerBootstrap {
  private config: WorkerConfigService;
  private logger: AppLogger;
  private redis!: Redis;
  private bullMqConnection!: ConnectionOptions;
  private processors: Array<{
    name: string;
    processor: IQueueProcessor;
  }> = [];

  constructor() {
    this.config = new WorkerConfigService();
    this.logger = new AppLogger({
      name: "intervu-worker",
      isDevelopment: this.config.isDevelopment,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Connect to Redis
      this.logger.info("Connecting to Redis", {
        redisUrl: this.config.redisUrl,
      });
      this.redis = new Redis(this.config.redisUrl);
      this.bullMqConnection = { url: this.config.redisUrl };

      await this.redis.ping();
      this.logger.info("Connected to Redis successfully");

      // Initialize processors based on config
      this.initializeProcessors();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.logger.info("Worker initialization complete", {
        concurrency: this.config.workerConcurrency,
        processors: this.processors.map((p) => p.name),
      });
    } catch (error) {
      this.logger.error("Failed to initialize worker", error);
      throw error;
    }
  }

  private initializeProcessors(): void {
    if (this.config.enableGenerationQueue) {
      const generationProcessor = new GenerationQueueProcessor(
        this.bullMqConnection,
        this.logger,
      );
      this.processors.push({
        name: "generation",
        processor: generationProcessor,
      });
      this.logger.info("Generation queue processor initialized");
    }

    if (this.config.enableEvaluationQueue) {
      const evaluationProcessor = new EvaluationQueueProcessor(
        this.bullMqConnection,
        this.logger,
      );
      this.processors.push({
        name: "evaluation",
        processor: evaluationProcessor,
      });
      this.logger.info("Evaluation queue processor initialized");
    }

    if (this.config.enableAnalyticsQueue) {
      const analyticsProcessor = new AnalyticsQueueProcessor(
        this.bullMqConnection,
        this.logger,
      );
      this.processors.push({
        name: "analytics",
        processor: analyticsProcessor,
      });
      this.logger.info("Analytics queue processor initialized");
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ["SIGTERM", "SIGINT"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, shutting down gracefully`);
        await this.shutdown();
        process.exit(0);
      });
    });
  }

  private async shutdown(): Promise<void> {
    try {
      this.logger.info("Shutting down worker");

      // Close all processors
      for (const { name, processor } of this.processors) {
        this.logger.info(`Closing processor: ${name}`);
        await processor.close();
      }

      // Close Redis connection
      if (this.redis) {
        await this.redis.quit();
        this.logger.info("Closed Redis connection");
      }

      this.logger.info("Worker shutdown complete");
    } catch (error) {
      this.logger.error("Error during shutdown", error);
      throw error;
    }
  }

  getLogger(): AppLogger {
    return this.logger;
  }

  getConfig(): WorkerConfigService {
    return this.config;
  }
}

export async function createWorkerBootstrap(): Promise<WorkerBootstrap> {
  return new WorkerBootstrap();
}
