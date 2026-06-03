import { QueueFactory, QueueService, QueueType } from '@/queue';
import { AppLogger } from '@intervu-ai/shared-logger';
import { type ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

describe('Queue System Integration Tests', () => {
  let redis: Redis;
  let connection: ConnectionOptions;
  let queueService: QueueService;
  let logger: AppLogger;

  beforeAll(async () => {
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => null,
    });
    connection = {
      host: 'localhost',
      port: 6379,
    };

    logger = new AppLogger({
      name: 'test',
      isDevelopment: true,
    });

    // Create queues
    QueueFactory.createQueue(QueueType.GENERATION, connection);
    QueueFactory.createQueue(QueueType.EVALUATION, connection);
    QueueFactory.createQueue(QueueType.ANALYTICS, connection);

    queueService = new QueueService(logger);
  });

  afterAll(async () => {
    await QueueFactory.closeAll();
    await redis.quit();
  });

  describe('Generation Queue', () => {
    it('should enqueue a generation job', async () => {
      const jobId = 'test-gen-001';
      const job = await queueService.enqueueGeneration({
        jobId,
        timestamp: Date.now(),
        correlationId: 'corr-001',
        payload: {
          assemblyId: 'asm-123',
          difficulty: 'medium',
        },
      });

      expect(job).toBeDefined();
      expect(job.id).toBe(jobId);
      expect(job.name).toBe(jobId);
    });

    it('should get job state', async () => {
      const jobId = 'test-gen-002';
      await queueService.enqueueGeneration({
        jobId,
        timestamp: Date.now(),
        payload: {
          assemblyId: 'asm-124',
        },
      });

      const state = await queueService.getJobState(QueueType.GENERATION, jobId);
      expect(['waiting', 'delayed', 'completed']).toContain(state);
    });

    it('should get queue counts', async () => {
      const counts = await queueService.getQueueCounts(QueueType.GENERATION);

      expect(counts).toHaveProperty('waiting');
      expect(counts).toHaveProperty('active');
      expect(counts).toHaveProperty('completed');
      expect(counts).toHaveProperty('failed');
      expect(counts).toHaveProperty('delayed');

      expect(counts.waiting).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Evaluation Queue', () => {
    it('should enqueue an evaluation job', async () => {
      const jobId = 'test-eval-001';
      const job = await queueService.enqueueEvaluation({
        jobId,
        timestamp: Date.now(),
        payload: {
          testId: 'test-123',
          userId: 'user-456',
        },
      });

      expect(job).toBeDefined();
      expect(job.id).toBe(jobId);
    });

    it('should track user context in job', async () => {
      const jobId = 'test-eval-002';
      const userId = 'user-789';

      await queueService.enqueueEvaluation({
        jobId,
        timestamp: Date.now(),
        userId,
        payload: {
          testId: 'test-124',
          userId,
        },
      });

      const retrieved = await queueService.getJob(QueueType.EVALUATION, jobId);
      expect(retrieved?.data.userId).toBe(userId);
    });
  });

  describe('Analytics Queue', () => {
    it('should enqueue analytics events', async () => {
      const jobId = 'test-analytics-001';
      const job = await queueService.enqueueAnalytics({
        jobId,
        timestamp: Date.now(),
        correlationId: 'corr-002',
        payload: {
          eventType: 'user_signup',
          eventData: {
            userId: 'user-100',
            timestamp: Date.now(),
          },
        },
      });

      expect(job).toBeDefined();
    });

    it('should batch multiple analytics events', async () => {
      const jobs = [];
      for (let i = 0; i < 5; i++) {
        const job = await queueService.enqueueAnalytics({
          jobId: `test-analytics-batch-${i}`,
          timestamp: Date.now(),
          payload: {
            eventType: 'page_view',
            eventData: {
              page: '/dashboard',
              userId: `user-${i}`,
            },
          },
        });
        jobs.push(job);
      }

      expect(jobs).toHaveLength(5);
      expect(jobs.every((j) => j)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle job removal', async () => {
      const jobId = 'test-remove-001';
      await queueService.enqueueGeneration({
        jobId,
        timestamp: Date.now(),
        payload: {
          assemblyId: 'asm-125',
        },
      });

      const removed = await queueService.removeJob(QueueType.GENERATION, jobId);
      expect(removed).toBe(true);

      const retrieved = await queueService.getJob(QueueType.GENERATION, jobId);
      expect(retrieved).toBeUndefined();
    });

    it('should handle non-existent job operations gracefully', async () => {
      const state = await queueService.getJobState(QueueType.GENERATION, 'non-existent');
      expect(state).toBeUndefined();

      const removed = await queueService.removeJob(QueueType.GENERATION, 'non-existent');
      expect(removed).toBe(false);
    });
  });
});
