import { GenerationQueueProcessor } from '../queues/generation.queue';
import { EvaluationQueueProcessor } from '../queues/evaluation.queue';
import { AnalyticsQueueProcessor } from '../queues/analytics.queue';
import { AppLogger } from '@intervu-ai/shared-logger';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

describe('Worker Queue Processors', () => {
  let redis: Redis;
  let logger: AppLogger;
  let generationQueue: Queue;
  let evaluationQueue: Queue;
  let analyticsQueue: Queue;

  beforeAll(async () => {
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => null,
      maxRetriesPerRequest: null,
    });

    logger = new AppLogger({
      name: 'worker-test',
      isDevelopment: true,
    });

    // Create queues
    generationQueue = new Queue('generation', { connection: redis });
    evaluationQueue = new Queue('evaluation', { connection: redis });
    analyticsQueue = new Queue('analytics', { connection: redis });
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

  describe('Generation Queue Processor', () => {
    it('should initialize without errors', async () => {
      const processor = new GenerationQueueProcessor(redis, logger);
      expect(processor).toBeDefined();
      await processor.close();
    });

    it('should add jobs to generation queue', async () => {
      const jobData = {
        jobId: 'test-gen-001',
        type: 'generation' as const,
        timestamp: Date.now(),
        payload: {
          assemblyId: 'asm-123',
          difficulty: 'medium',
        },
      };

      const job = await generationQueue.add('test-gen-001', jobData);
      expect(job.id).toBe('test-gen-001');

      const state = await job.getState();
      expect(['waiting', 'delayed']).toContain(state);
    });
  });

  describe('Evaluation Queue Processor', () => {
    it('should initialize without errors', async () => {
      const processor = new EvaluationQueueProcessor(redis, logger);
      expect(processor).toBeDefined();
      await processor.close();
    });

    it('should add jobs to evaluation queue', async () => {
      const jobData = {
        jobId: 'test-eval-001',
        type: 'evaluation' as const,
        timestamp: Date.now(),
        payload: {
          testId: 'test-123',
          userId: 'user-456',
        },
      };

      const job = await evaluationQueue.add('test-eval-001', jobData);
      expect(job.id).toBe('test-eval-001');

      const state = await job.getState();
      expect(['waiting', 'delayed']).toContain(state);
    });
  });

  describe('Analytics Queue Processor', () => {
    it('should initialize without errors', async () => {
      const processor = new AnalyticsQueueProcessor(redis, logger);
      expect(processor).toBeDefined();
      await processor.close();
    });

    it('should add jobs to analytics queue', async () => {
      const jobData = {
        jobId: 'test-analytics-001',
        type: 'analytics' as const,
        timestamp: Date.now(),
        payload: {
          eventType: 'user_signup',
          eventData: {
            userId: 'user-100',
          },
        },
      };

      const job = await analyticsQueue.add('test-analytics-001', jobData);
      expect(job.id).toBe('test-analytics-001');

      const state = await job.getState();
      expect(['waiting', 'delayed']).toContain(state);
    });
  });

  describe('Multiple Processors', () => {
    it('should handle multiple processors simultaneously', async () => {
      const genProcessor = new GenerationQueueProcessor(redis, logger);
      const evalProcessor = new EvaluationQueueProcessor(redis, logger);
      const analyticsProcessor = new AnalyticsQueueProcessor(redis, logger);

      // Add jobs to different queues
      await generationQueue.add('gen-1', {
        jobId: 'gen-1',
        type: 'generation' as const,
        timestamp: Date.now(),
        payload: { assemblyId: 'asm-1' },
      });

      await evaluationQueue.add('eval-1', {
        jobId: 'eval-1',
        type: 'evaluation' as const,
        timestamp: Date.now(),
        payload: { testId: 'test-1', userId: 'user-1' },
      });

      await analyticsQueue.add('ana-1', {
        jobId: 'ana-1',
        type: 'analytics' as const,
        timestamp: Date.now(),
        payload: { eventType: 'test_event', eventData: {} },
      });

      // Verify all jobs are queued
      const genCounts = await generationQueue.getCountsPerState('wait', 'active');
      const evalCounts = await evaluationQueue.getCountsPerState('wait', 'active');
      const anaCounts = await analyticsQueue.getCountsPerState('wait', 'active');

      expect((genCounts.wait || 0) + (genCounts.active || 0)).toBeGreaterThan(0);
      expect((evalCounts.wait || 0) + (evalCounts.active || 0)).toBeGreaterThan(0);
      expect((anaCounts.wait || 0) + (anaCounts.active || 0)).toBeGreaterThan(0);

      // Cleanup
      await genProcessor.close();
      await evalProcessor.close();
      await analyticsProcessor.close();
    });
  });

  describe('Job Retry Behavior', () => {
    it('should respect retry configuration', async () => {
      const jobData = {
        jobId: 'test-retry-001',
        type: 'generation' as const,
        timestamp: Date.now(),
        payload: { assemblyId: 'asm-123' },
      };

      const job = await generationQueue.add('test-retry-001', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });

      expect(job.opts.attempts).toBe(3);
      expect(job.opts.backoff?.type).toBe('exponential');
      expect(job.opts.backoff?.delay).toBe(1000);
    });
  });

  describe('Job Removal', () => {
    it('should handle job removal', async () => {
      const jobData = {
        jobId: 'test-remove-001',
        type: 'generation' as const,
        timestamp: Date.now(),
        payload: { assemblyId: 'asm-123' },
      };

      const job = await generationQueue.add('test-remove-001', jobData);
      await job.remove();

      const retrieved = await generationQueue.getJob('test-remove-001');
      expect(retrieved).toBeUndefined();
    });
  });
});
