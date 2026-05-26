import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { AppLogger } from '@intervu-ai/shared-logger';
import { GenerationQueuePayload } from '@intervu-ai/shared-types';

export class GenerationQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;

  constructor(redis: Redis, logger: AppLogger) {
    this.logger = logger;

    this.worker = new Worker('generation', this.processJob.bind(this), {
      connection: redis,
      concurrency: 5,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<GenerationQueuePayload>): Promise<any> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      correlationId: job.data.correlationId,
      queueName: 'generation',
    });

    try {
      this.logger.info('Processing generation job', {
        payload: job.data.payload,
        attempt: job.attemptsMade,
      });

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;

      const result = {
        success: true,
        jobId: job.id,
        duration,
        generatedCount: Math.floor(Math.random() * 10) + 1,
        completedAt: new Date().toISOString(),
      };

      this.logger.info('Generation job completed', { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Generation job failed', error, {
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        duration,
      });

      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      this.logger.info('Generation job completed', {
        jobId: job.id,
        result,
      });
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error('Generation job failed', error, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      });
    });

    this.worker.on('error', (error) => {
      this.logger.error('Generation worker error', error);
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
