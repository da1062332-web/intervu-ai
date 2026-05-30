import { Worker, Job, type ConnectionOptions } from 'bullmq';
import { AppLogger } from '@intervu-ai/shared-logger';
import { AnalyticsQueuePayload } from '@intervu-ai/shared-types';

export class AnalyticsQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;

  constructor(connection: ConnectionOptions, logger: AppLogger) {
    this.logger = logger;

    this.worker = new Worker('analytics', this.processJob.bind(this), {
      connection,
      concurrency: 10,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<AnalyticsQueuePayload>): Promise<any> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      correlationId: job.data.correlationId,
      queueName: 'analytics',
    });

    try {
      this.logger.info('Processing analytics job', {
        eventType: job.data.payload.eventType,
        attempt: job.attemptsMade,
      });

      // Simulate analytics processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      const duration = Date.now() - startTime;

      const result = {
        success: true,
        jobId: job.id,
        duration,
        processed: true,
        completedAt: new Date().toISOString(),
      };

      this.logger.info('Analytics job completed', { duration, eventType: job.data.payload.eventType });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Analytics job failed', error, {
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        duration,
      });

      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      this.logger.debug('Analytics job completed', {
        jobId: job.id,
      });
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error('Analytics job failed', error, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      });
    });

    this.worker.on('error', (error) => {
      this.logger.error('Analytics worker error', error);
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
