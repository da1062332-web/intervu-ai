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
import { z } from "zod";

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

  private async processJob(job: Job<any>): Promise<WorkerResponse> {
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

      // Input Validation matching the API's actual payload shape
      const localSchema = z.object({
        jobId: z.string(),
        timestamp: z.number(),
        correlationId: z.string().optional(),
        type: z.literal("generation"),
        payload: z.object({
          assemblyId: z.string(),
          difficulty: z.string().optional(),
          count: z.number().optional(),
          topicId: z.string().optional(),
        }),
      });

      let parsedPayload;
      try {
        parsedPayload = localSchema.parse(payloadData);
        this.logger.info("Payload validated against local schema", {
          correlationId: parsedPayload.correlationId,
        });
      } catch (err) {
        this.logger.error("Invalid queue payload contract", err as Error);
        throw err;
      }

      // Map API payload difficulty to worker expected enum
      let difficulty: "beginner" | "intermediate" | "advanced" | "expert" = "intermediate";
      const incomingDiff = (parsedPayload.payload.difficulty || "").toUpperCase();
      if (incomingDiff === "EASY") {
        difficulty = "beginner";
      } else if (incomingDiff === "MEDIUM") {
        difficulty = "intermediate";
      } else if (incomingDiff === "HARD") {
        difficulty = "advanced";
      }

      const generationRequest = {
        topic: parsedPayload.payload.topicId || "default-topic",
        difficulty,
        count: parsedPayload.payload.count || 10,
      };

      // Invoke AI Layer
      // Pass correlationId to AI Service for tracing
      const aiResponse = await this.aiService.generateQuestions(
        generationRequest,
        parsedPayload.correlationId || "system-trace",
      );

      const duration = Date.now() - startTime;

      // Persist to Database (wrapped in try/catch to gracefully handle missing Test record)
      const testId = parsedPayload.payload.assemblyId || "test_123";
      this.logger.info(
        `Persisting generated questions for testId: ${testId}`,
      );
      try {
        await this.prisma.test.update({
          where: { id: testId },
          data: {
            questions: aiResponse as Prisma.InputJsonValue,
            status: "ONGOING", // Update status to reflect generation complete
          },
        });
        this.logger.info(
          `Successfully persisted generated questions for testId: ${testId}`,
        );
      } catch (dbErr) {
        this.logger.warn(
          `Failed to persist generated questions for testId: ${testId} (record not found). Continuing as success.`,
        );
      }

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
