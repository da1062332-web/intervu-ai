import { Worker, Job, type ConnectionOptions } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import { QueuePayload } from "@intervu-ai/contracts";

export class AnalyticsQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;

  constructor(connection: ConnectionOptions, logger: AppLogger) {
    this.logger = logger;

    this.worker = new Worker("analytics", this.processJob.bind(this), {
      connection,
      concurrency: 10,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<QueuePayload>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      correlationId: job.data.correlationId,
      queue: "analytics",
    });

    try {
      this.logger.info(`Processing job ${job.id}`);

      // Simulate analytics processing delay
      await new Promise((resolve) =>
        setTimeout(resolve, process.env.NODE_ENV === "test" ? 10 : 500),
      );

      this.logger.info(`Successfully completed analytics job ${job.id}`, {
        duration: Date.now() - startTime,
      });
      return { status: "completed" };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error("Analytics job failed", error, {
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        duration,
      });

      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on("completed", (job) => {
      this.logger.info("Analytics job completed", {
        jobId: job.id,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error("Analytics job failed", error, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      });
    });

    this.worker.on("error", (error) => {
      this.logger.error("Analytics worker error", error);
    });
  }

  async close(force: boolean = false): Promise<void> {
    await this.worker.close(force);
  }
}
