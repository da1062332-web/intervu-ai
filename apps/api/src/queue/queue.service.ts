import { Job } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import { QueueFactory } from "./queue-config";
import {
  QueueMessage,
  QueueType,
  GenerationQueueMessage,
  EvaluationQueueMessage,
  AnalyticsQueueMessage,
  ValidationQueueMessage,
  GenerationJobSchema,
  EvaluationJobSchema,
  AnalyticsJobSchema,
  ValidationJobSchema,
  GenerationJobInput,
  EvaluationJobInput,
  AnalyticsJobInput,
  ValidationJobInput,
} from "./queue-payloads";
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface AllQueueMetrics {
  generation: QueueMetrics;
  evaluation: QueueMetrics;
  analytics: QueueMetrics;
  validation: QueueMetrics;
}

export class QueueService {
  private readonly logger: AppLogger;
  private readonly prisma?: PrismaService;

  constructor(logger: AppLogger, prisma?: PrismaService) {
    this.logger = logger;
    this.prisma = prisma;
  }

  // ─── Enqueue Methods ─────────────────────────────────────────────────────────

  async enqueueGeneration(
    payload: Omit<GenerationJobInput, "type">,
  ): Promise<Job> {
    // 1. validate() — Fail Fast via Zod
    const fullPayload: GenerationQueueMessage = {
      ...payload,
      type: QueueType.GENERATION,
    };
    const result = GenerationJobSchema.safeParse(fullPayload);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid generation job payload",
          details: result.error.format(),
        },
      });
    }
    return this.enqueue(QueueType.GENERATION, result.data);
  }

  async enqueueEvaluation(
    payload: Omit<EvaluationJobInput, "type">,
  ): Promise<Job> {
    // 1. validate() — Fail Fast via Zod
    const fullPayload: EvaluationQueueMessage = {
      ...payload,
      type: QueueType.EVALUATION,
    };
    const result = EvaluationJobSchema.safeParse(fullPayload);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid evaluation job payload",
          details: result.error.format(),
        },
      });
    }
    return this.enqueue(QueueType.EVALUATION, result.data);
  }

  async enqueueAnalytics(
    payload: Omit<AnalyticsJobInput, "type">,
  ): Promise<Job> {
    // 1. validate() — Fail Fast via Zod
    const fullPayload: AnalyticsQueueMessage = {
      ...payload,
      type: QueueType.ANALYTICS,
    };
    const result = AnalyticsJobSchema.safeParse(fullPayload);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid analytics job payload",
          details: result.error.format(),
        },
      });
    }
    return this.enqueue(QueueType.ANALYTICS, result.data);
  }

  async enqueueValidation(
    payload: Omit<ValidationJobInput, "type">,
  ): Promise<Job> {
    // 1. validate() — Fail Fast via Zod
    const fullPayload: ValidationQueueMessage = {
      ...payload,
      type: QueueType.VALIDATION,
    };
    const result = ValidationJobSchema.safeParse(fullPayload);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid validation job payload",
          details: result.error.format(),
        },
      });
    }
    return this.enqueue(QueueType.VALIDATION, result.data);
  }

  // ─── Job Inspection ──────────────────────────────────────────────────────────

  async getJob(queueType: QueueType, jobId: string): Promise<Job | undefined> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      return await queue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Failed to get job`, error, {
        jobId,
        queueName: queueType,
      });
      return undefined;
    }
  }

  async getJobState(
    queueType: QueueType,
    jobId: string,
  ): Promise<string | undefined> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.getJob(jobId);
      return job?.getState();
    } catch (error) {
      this.logger.error(`Failed to get job state`, error, {
        jobId,
        queueName: queueType,
      });
      return undefined;
    }
  }

  async reconcileGenerationJob(jobId: string): Promise<{
    jobId: string;
    dbStatus?: string;
    bullmqState?: string;
    updated: boolean;
    reason: string;
  }> {
    if (!this.prisma) {
      return {
        jobId,
        updated: false,
        reason: "prisma-unavailable",
      };
    }

    const dbJob = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
    });

    if (!dbJob) {
      return {
        jobId,
        updated: false,
        reason: "db-job-not-found",
      };
    }

    const bullmqState = await this.getJobState(QueueType.GENERATION, jobId);

    if (!bullmqState) {
      return {
        jobId,
        dbStatus: dbJob.status ?? undefined,
        updated: false,
        reason: "bullmq-job-not-found",
      };
    }

    const dbStatus = String(dbJob.status ?? "");
    const normalizedDbStatus = dbStatus.toUpperCase();
    const normalizedBullmqState = bullmqState.toLowerCase();

    const isTerminalDbStatus = ["COMPLETED", "FAILED", "FALLBACK"].includes(
      normalizedDbStatus,
    );

    if (normalizedBullmqState === "completed") {
      if (isTerminalDbStatus) {
        return {
          jobId,
          dbStatus,
          bullmqState,
          updated: false,
          reason: "db-already-terminal",
        };
      }

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "COMPLETED" },
      });

      return {
        jobId,
        dbStatus,
        bullmqState,
        updated: true,
        reason: "bullmq-completed",
      };
    }

    if (normalizedBullmqState === "failed") {
      if (isTerminalDbStatus) {
        return {
          jobId,
          dbStatus,
          bullmqState,
          updated: false,
          reason: "db-already-terminal",
        };
      }

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "FAILED" },
      });

      return {
        jobId,
        dbStatus,
        bullmqState,
        updated: true,
        reason: "bullmq-failed",
      };
    }

    if (normalizedBullmqState === "active" && normalizedDbStatus === "QUEUED") {
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "RUNNING" },
      });

      return {
        jobId,
        dbStatus,
        bullmqState,
        updated: true,
        reason: "bullmq-active",
      };
    }

    return {
      jobId,
      dbStatus,
      bullmqState,
      updated: false,
      reason: "no-safe-reconciliation",
    };
  }

  // ─── Queue Metrics ───────────────────────────────────────────────────────────

  async getQueueCounts(queueType: QueueType): Promise<QueueMetrics> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const counts = await queue.getJobCounts(
        "wait",
        "active",
        "completed",
        "failed",
        "delayed",
      );
      return {
        waiting: counts.wait ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue counts`, error, {
        queueName: queueType,
      });
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  /**
   * Returns metrics for all 4 queues in a single call.
   * Used by the Queue Monitor endpoint.
   */
  async getQueueMetrics(): Promise<AllQueueMetrics> {
    const [generation, evaluation, analytics, validation] = await Promise.all([
      this.getQueueCounts(QueueType.GENERATION),
      this.getQueueCounts(QueueType.EVALUATION),
      this.getQueueCounts(QueueType.ANALYTICS),
      this.getQueueCounts(QueueType.VALIDATION),
    ]);
    return { generation, evaluation, analytics, validation };
  }

  // ─── Job Operations ───────────────────────────────────────────────────────────

  async retryFailedJob(queueType: QueueType, jobId: string): Promise<boolean> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.getJob(jobId);
      if (!job) {
        this.logger.warn(`Job not found for retry`, {
          jobId,
          queueName: queueType,
        });
        return false;
      }
      await job.retry();
      this.logger.info(`Job retried successfully`, {
        jobId,
        queueName: queueType,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to retry job`, error, {
        jobId,
        queueName: queueType,
      });
      return false;
    }
  }

  async removeJob(queueType: QueueType, jobId: string): Promise<boolean> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.getJob(jobId);
      if (!job) {
        this.logger.warn(`Job not found for removal`, {
          jobId,
          queueName: queueType,
        });
        return false;
      }
      await job.remove();
      this.logger.info(`Job removed successfully`, {
        jobId,
        queueName: queueType,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove job`, error, {
        jobId,
        queueName: queueType,
      });
      return false;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async enqueue(
    queueType: QueueType,
    payload: QueueMessage,
  ): Promise<Job> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.add(payload.jobId, payload, {
        jobId: payload.jobId,
      });
      this.logger.info(`Job enqueued successfully`, {
        jobId: payload.jobId,
        queueName: queueType,
        correlationId: payload.correlationId,
      });
      return job;
    } catch (error) {
      this.logger.error(`Failed to enqueue job`, error, {
        jobId: payload.jobId,
        queueName: queueType,
      });
      throw error;
    }
  }
}
