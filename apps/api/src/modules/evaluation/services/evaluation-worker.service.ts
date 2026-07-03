import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Worker, Job } from "bullmq";
import { AppConfigService } from "../../../config/config.service";
import { ReEvaluationService } from "./re-evaluation.service";

@Injectable()
export class EvaluationWorkerService implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;
  private readonly logger = new Logger("EvaluationWorkerService");

  constructor(
    private readonly configService: AppConfigService,
    private readonly reEvaluationService: ReEvaluationService,
  ) {}

  onModuleInit() {
    // Only start the worker in development or test environment, or if explicit env configuration is active
    const isTest = process.env.NODE_ENV === "test";
    const enableWorker = process.env.ENABLE_EVALUATION_WORKER !== "false";

    if (!enableWorker && !isTest) {
      this.logger.log(
        "Background Evaluation Worker is disabled in environment config",
      );
      return;
    }

    const redisUrlString = this.configService.redisUrl;
    this.logger.log(
      `Initializing BullMQ Evaluation worker. Redis URL: ${redisUrlString}`,
    );

    try {
      const redisUrl = new URL(redisUrlString);
      const connection = {
        host: redisUrl.hostname,
        port: Number(redisUrl.port) || 6379,
        password: redisUrl.password || undefined,
        maxRetriesPerRequest: null,
      };

      this.worker = new Worker(
        "evaluation",
        async (job: Job) => {
          const attemptId = job.data.payload.testId;
          this.logger.log(
            `Worker received job ${job.id} for attempt ${attemptId}`,
          );
          await this.reEvaluationService.reprocess(
            attemptId,
            "BACKGROUND_WORKER",
          );
        },
        {
          connection,
          concurrency: 5,
        },
      );

      this.worker.on("completed", (job) => {
        this.logger.log(`Evaluation job ${job.id} completed successfully`);
      });

      this.worker.on("failed", (job, error) => {
        this.logger.error(`Evaluation job ${job?.id} failed: ${error.message}`);
      });

      this.worker.on("error", (error) => {
        this.logger.error(`Evaluation worker error: ${error.message}`);
      });
    } catch (err) {
      this.logger.error("Failed to start BullMQ Evaluation worker", err);
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log("BullMQ Evaluation worker closed successfully");
    }
  }
}
