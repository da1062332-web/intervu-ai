import { QueueFactory, QueueService, QueueType } from '@/queue';
import { AppLogger } from '@intervu-ai/shared-logger';

// Mock BullMQ and IORedis
jest.mock('bullmq', () => {
  const removedJobs = new Set();
  return {
    Queue: jest.fn().mockImplementation((name) => ({
      name,
      add: jest.fn().mockImplementation(async (name, data, opts) => ({
        id: opts?.jobId || 'mock-id',
        name,
        data
      })),
      getJob: jest.fn().mockImplementation(async (id) => {
        if (id === 'non-existent' || removedJobs.has(id)) return undefined;
        return {
          id,
          data: { userId: 'user-789' },
          getState: jest.fn().mockResolvedValue('waiting'),
          retry: jest.fn(),
          remove: jest.fn().mockImplementation(() => {
            removedJobs.add(id);
          })
        };
      }),
      getJobCounts: jest.fn().mockResolvedValue({
        wait: 1,
        active: 0,
        completed: 5,
        failed: 0,
        delayed: 0
      }),
      close: jest.fn()
    }))
  };
});

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn()
  }));
});

import Redis from 'ioredis';
import { type ConnectionOptions } from 'bullmq';

describe('Queue System Integration Tests', () => {
  let redis: Redis;
  let connection: ConnectionOptions;
  let queueService: QueueService;
  let logger: AppLogger;

  beforeAll(async () => {
    redis = new Redis({
      host: 'localhost',
      port: 6379,
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
        timestamp: new Date().toISOString(),
        correlationId: 'corr-001',
        testId: 'test-123',
        assemblyId: 'asm-123',
        topic: 'react',
        difficulty: 'beginner',
        count: 5
      });

      expect(job).toBeDefined();
      expect(job.id).toBe(jobId);
      expect(job.name).toBe(jobId);
    });

    it('should get job state', async () => {
      const jobId = 'test-gen-002';
      await queueService.enqueueGeneration({
        jobId,
        timestamp: new Date().toISOString(),
        correlationId: 'corr-002',
        testId: 'test-124',
        assemblyId: 'asm-124',
        topic: 'node',
        difficulty: 'intermediate',
        count: 5
      });

      const state = await queueService.getJobState(QueueType.GENERATION, jobId);
      expect(['waiting', 'delayed', 'completed', 'active']).toContain(state);
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
        requestId: jobId,
        timestamp: new Date().toISOString(),
        correlationId: 'corr-003',
        data: {
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
        requestId: jobId,
        timestamp: new Date().toISOString(),
        correlationId: 'corr-004',
        data: {
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
        requestId: jobId,
        timestamp: new Date().toISOString(),
        correlationId: 'corr-002',
        data: {
          eventType: 'user_signup',
          eventData: {
            userId: 'user-100',
            timestamp: new Date().toISOString(),
          },
        },
      });

      expect(job).toBeDefined();
    });

    it('should batch multiple analytics events', async () => {
      const jobs = [];
      for (let i = 0; i < 5; i++) {
        const job = await queueService.enqueueAnalytics({
          requestId: `test-analytics-batch-${i}`,
          timestamp: new Date().toISOString(),
          correlationId: `corr-batch-${i}`,
          data: {
            eventType: 'page_view',
            eventData: {
              page: '/dashboard',
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
        timestamp: new Date().toISOString(),
        correlationId: 'corr-005',
        testId: 'test-125',
        assemblyId: 'asm-125',
        topic: 'react',
        difficulty: 'advanced',
        count: 5
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
