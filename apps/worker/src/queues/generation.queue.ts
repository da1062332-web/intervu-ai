import { Worker, Job, type ConnectionOptions } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import {
  QueuePayloadSchema,
  QueuePayload,
  WorkerResponseSchema,
  WorkerResponse,
} from "@intervu-ai/contracts";
import { AiWorkerService } from "../services/ai.service";
import { PrismaClient, Prisma } from "@prisma/client";

export class GenerationQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;
  private aiService: AiWorkerService;
  private prisma: PrismaClient;

  constructor(connection: ConnectionOptions, logger: AppLogger) {
    this.logger = logger;
    this.aiService = new AiWorkerService(logger);
    this.prisma = new PrismaClient();

    this.worker = new Worker("generation", this.processJob.bind(this), {
      connection,
      concurrency: 5,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<QueuePayload>): Promise<WorkerResponse> {
    const startTime = Date.now();

    // We are trusting the schema here or parsing it securely
    const payloadData = job.data;

    this.logger.setContext({
      jobId: job.id,
      correlationId: payloadData.correlationId,
      queue: "generation",
    });

    try {
      this.logger.info(`Processing job ${job.id}`);

      // Input Validation Test via Shared Contract
      let payload;
      try {
        payload = QueuePayloadSchema.parse(payloadData);
        this.logger.info("Payload validated against schema", {
          correlationId: payload.correlationId,
        });
      } catch (err) {
        this.logger.error("Invalid queue payload contract", err as Error);
        throw err;
      }

      if (payload.payload.type !== "generation") {
        throw new Error("Invalid payload type for generation queue");
      }

      const generationRequest = payload.payload.data;

      // Invoke AI Layer
      // Pass correlationId to AI Service for tracing
      const aiResponse = await this.aiService.generateQuestions(
        generationRequest,
        payload.correlationId,
      );

      const duration = Date.now() - startTime;

      // Persist to Database
      this.logger.info(
        `Persisting generated questions for testId: ${payload.payload.testId}`,
      );
      await this.prisma.test.update({
        where: { id: payload.payload.testId },
        data: {
          questions: aiResponse as Prisma.InputJsonValue,
          status: "ONGOING", // Update status to reflect generation complete
        },
      });
      this.logger.info(
        `Successfully persisted generated questions for testId: ${payload.payload.testId}`,
      );

      this.logger.info(`Successfully completed generation job ${job.id}`, {
        duration,
      });

      const workerResponse: WorkerResponse = {
        success: true,
        jobId: job.id!,
        result: aiResponse,
        durationMs: duration,
      };

      // Validate worker response contract
      return WorkerResponseSchema.parse(workerResponse);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error("Generation job failed", error, {
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        duration,
      });

      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on("completed", (job, result) => {
      this.logger.info("Generation job completed", {
        jobId: job.id,
        result,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error("Generation job failed", error, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      });
    });

    this.worker.on("error", (error) => {
      this.logger.error("Generation worker error", error);
    });
  }

  async close(force: boolean = false): Promise<void> {
    await this.worker.close(force);
    await this.prisma.$disconnect();
  }
}
