import { Worker, Job, type ConnectionOptions } from "bullmq";
import { AppLogger } from "@intervu-ai/shared-logger";
import { QueuePayload } from "@intervu-ai/contracts";

/**
 * EvaluationQueueProcessor
 *
 * Listens on the "evaluation" BullMQ queue.
 * On receiving a job, extracts the testInstanceId (attemptId) from the payload
 * and calls the API's internal reprocess endpoint to trigger real evaluation.
 *
 * The full evaluation logic (ObjectiveEvaluatorService, SectionScoringService,
 * ResultGeneratorService etc.) lives in the API, not in this worker.
 * The worker's role is purely to: dequeue → delegate → report result.
 */
export class EvaluationQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;

  /** Internal API base URL — defaults to localhost in dev, overridden by env in prod */
  private readonly apiBaseUrl: string;
  /** Shared service token for worker→API calls to bypass JWT auth */
  private readonly internalServiceToken: string;

  constructor(connection: ConnectionOptions, logger: AppLogger) {
    this.logger = logger;
    this.apiBaseUrl =
      process.env.INTERNAL_API_URL || "http://localhost:3000";
    this.internalServiceToken =
      process.env.INTERNAL_SERVICE_TOKEN || "";

    this.worker = new Worker("evaluation", this.processJob.bind(this), {
      connection,
      concurrency: 3,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<QueuePayload>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      correlationId: job.data.correlationId,
      queueName: "evaluation",
    });

    this.logger.info("Processing evaluation job", {
      jobId: job.id,
      correlationId: job.data.correlationId,
      attempt: job.attemptsMade,
    });

    // Extract the attempt/testInstance ID from the job payload.
    // The API publishes: { payload: { testId, userId, answers } }
    const payload = job.data as any;
    const attemptId: string | undefined =
      payload?.payload?.testId ?? payload?.testId;

    if (!attemptId) {
      const err = new Error(
        `Evaluation job ${job.id} missing payload.testId — cannot trigger evaluation`,
      );
      this.logger.error("Missing attemptId in evaluation job payload", err, {
        jobData: JSON.stringify(payload),
      });
      throw err;
    }

    try {
      // Delegate to the API's reprocess endpoint which runs the full evaluation
      // pipeline: ObjectiveEvaluatorService → SectionScoringService →
      // ResultGeneratorService → persists TestResult to DB.
      const response = await fetch(
        `${this.apiBaseUrl}/evaluation/reprocess/${attemptId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Internal service token bypasses JWT guard on this admin-only endpoint.
            // The API's JwtAuthGuard must check x-internal-service-token header.
            ...(this.internalServiceToken
              ? { "x-internal-service-token": this.internalServiceToken }
              : {}),
          },
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `API reprocess returned HTTP ${response.status}: ${body}`,
        );
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      this.logger.info("Evaluation job completed — API reprocess succeeded", {
        jobId: job.id,
        attemptId,
        duration,
      });

      return {
        success: true,
        jobId: job.id,
        attemptId,
        duration,
        completedAt: new Date().toISOString(),
        apiResult: result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error("Evaluation job failed — API reprocess error", error, {
        jobId: job.id,
        attemptId,
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        duration,
      });
      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on("completed", (job, result) => {
      this.logger.info("Evaluation job completed", {
        jobId: job.id,
        result,
      });
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error("Evaluation job failed", error, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      });
    });

    this.worker.on("error", (error) => {
      this.logger.error("Evaluation worker error", error);
    });
  }

  async close(force: boolean = false): Promise<void> {
    await this.worker.close(force);
  }
}
