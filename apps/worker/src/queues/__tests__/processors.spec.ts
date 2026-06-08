import { GenerationQueueProcessor } from "../generation.queue";
import { EvaluationQueueProcessor } from "../evaluation.queue";
import { AnalyticsQueueProcessor } from "../analytics.queue";
import { AppLogger } from "@intervu-ai/shared-logger";
import { type ConnectionOptions, Queue } from "bullmq";
import Redis from "ioredis";

describe("Worker Queue Processors", () => {
  let redis: Redis;
  let connection: ConnectionOptions;
  let logger: AppLogger;
  let generationQueue: Queue;
  let evaluationQueue: Queue;
  let analyticsQueue: Queue;

  beforeAll(async () => {
    redis = new Redis({
      host: "localhost",
      port: 6379,
      retryStrategy: () => null,
      maxRetriesPerRequest: null,
    });
    connection = {
      host: "localhost",
      port: 6379,
    };

    logger = new AppLogger({
      name: "worker-test",
      isDevelopment: true,
    });

    // Create queues
    generationQueue = new Queue("generation", { connection });
    evaluationQueue = new Queue("evaluation", { connection });
    analyticsQueue = new Queue("analytics", { connection });
  });

  afterAll(async () => {
    await generationQueue.close();
    await evaluationQueue.close();
    await analyticsQueue.close();
    await redis.quit();
  });

  afterEach(async () => {
    // Clean up queues
    await generationQueue.drain();
    await evaluationQueue.drain();
    await analyticsQueue.drain();
  });

  describe("Generation Queue Processor", () => {
    it("should initialize without errors", async () => {
      const processor = new GenerationQueueProcessor(connection, logger);
      expect(processor).toBeDefined();
      await processor.close(true);
    });

    it("should add jobs to generation queue", async () => {
      const jobData = {
        jobId: "test-gen-001",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: {
          type: "generation" as const,
          assemblyId: "asm-123",
          difficulty: "medium",
        },
      };

      const job = await generationQueue.add("test-gen-001", jobData, {
        jobId: "test-gen-001",
      });
      expect(job.id).toBe("test-gen-001");

      const state = await job.getState();
      expect(["waiting", "delayed"]).toContain(state);
    });
  });

  describe("Evaluation Queue Processor", () => {
    it("should initialize without errors", async () => {
      const processor = new EvaluationQueueProcessor(connection, logger);
      expect(processor).toBeDefined();
      await processor.close(true);
    });

    it("should add jobs to evaluation queue", async () => {
      const jobData = {
        jobId: "test-eval-001",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: {
          type: "evaluation" as const,
          testId: "test-123",
          userId: "user-456",
        },
      };

      const job = await evaluationQueue.add("test-eval-001", jobData, {
        jobId: "test-eval-001",
      });
      expect(job.id).toBe("test-eval-001");

      const state = await job.getState();
      expect(["waiting", "delayed"]).toContain(state);
    });
  });

  describe("Analytics Queue Processor", () => {
    it("should initialize without errors", async () => {
      const processor = new AnalyticsQueueProcessor(connection, logger);
      expect(processor).toBeDefined();
      await processor.close(true);
    });

    it("should add jobs to analytics queue", async () => {
      const jobData = {
        jobId: "test-analytics-001",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: {
          type: "analytics" as const,
          eventType: "user_signup",
          eventData: {
            userId: "user-100",
          },
        },
      };

      const job = await analyticsQueue.add("test-analytics-001", jobData, {
        jobId: "test-analytics-001",
      });
      expect(job.id).toBe("test-analytics-001");

      const state = await job.getState();
      expect(["waiting", "delayed"]).toContain(state);
    });
  });

  describe("Multiple Processors", () => {
    it("should handle multiple processors simultaneously", async () => {
      const genProcessor = new GenerationQueueProcessor(connection, logger);
      const evalProcessor = new EvaluationQueueProcessor(connection, logger);
      const analyticsProcessor = new AnalyticsQueueProcessor(
        connection,
        logger,
      );

      // Add jobs to different queues
      await generationQueue.add("gen-1", {
        jobId: "gen-1",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: { type: "generation" as const, assemblyId: "asm-1" },
      });

      await evaluationQueue.add("eval-1", {
        jobId: "eval-1",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: {
          type: "evaluation" as const,
          testId: "test-1",
          userId: "user-1",
        },
      });

      await analyticsQueue.add("ana-1", {
        jobId: "ana-1",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: {
          type: "analytics" as const,
          eventType: "test_event",
          eventData: {},
        },
      });

      // Verify all jobs are queued
      const genCounts = await generationQueue.getJobCounts("wait", "active");
      const evalCounts = await evaluationQueue.getJobCounts("wait", "active");
      const anaCounts = await analyticsQueue.getJobCounts("wait", "active");

      expect((genCounts.wait || 0) + (genCounts.active || 0)).toBeGreaterThan(
        0,
      );
      expect((evalCounts.wait || 0) + (evalCounts.active || 0)).toBeGreaterThan(
        0,
      );
      expect((anaCounts.wait || 0) + (anaCounts.active || 0)).toBeGreaterThan(
        0,
      );

      // Cleanup
      await genProcessor.close(true);
      await evalProcessor.close(true);
      await analyticsProcessor.close(true);
    });
  });

  describe("Job Retry Behavior", () => {
    it("should respect retry configuration", async () => {
      const jobData = {
        jobId: "test-retry-001",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: { type: "generation" as const, assemblyId: "asm-123" },
      };

      const job = await generationQueue.add("test-retry-001", jobData, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      });

      expect(job.opts.attempts).toBe(3);
      const backoff = job.opts.backoff as { type: string; delay: number };
      expect(backoff?.type).toBe("exponential");
      expect(backoff?.delay).toBe(1000);
    });
  });

  describe("Job Removal", () => {
    it("should handle job removal", async () => {
      const jobData = {
        jobId: "test-remove-001",
        requestId: "req-1",
        correlationId: "cor-1",
        timestamp: new Date().toISOString(),
        payload: { type: "generation" as const, assemblyId: "asm-123" },
      };

      const job = await generationQueue.add("test-remove-001", jobData);
      await job.remove();

      const retrieved = await generationQueue.getJob("test-remove-001");
      expect(retrieved).toBeUndefined();
    });
  });
});
