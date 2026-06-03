import { Worker, Job, type ConnectionOptions } from 'bullmq';
import { AppLogger } from '@intervu-ai/shared-logger';
import { EvaluationQueueRequest } from '@intervu/shared';

export class EvaluationQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;

  constructor(connection: ConnectionOptions, logger: AppLogger) {
    this.logger = logger;

    this.worker = new Worker('evaluation', this.processJob.bind(this), {
      connection,
      concurrency: 3,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<EvaluationQueueRequest>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      correlationId: job.data.correlationId,
      queueName: 'evaluation',
      userId: job.data.payload.userId,
    });

    try {
      this.logger.info('Processing evaluation job', {
        testId: job.data.payload.testId,
        userId: job.data.payload.userId,
        attempt: job.attemptsMade,
      });

      // Simulate evaluation processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const duration = Date.now() - startTime;

      const result = {
        success: true,
        jobId: job.id,
        duration,
        score: Math.random() * 100,
        completedAt: new Date().toISOString(),
      };

      this.logger.info('Evaluation job completed', { duration, score: result.score });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Evaluation job failed', error, {
        attempt: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        duration,
      });

      throw error;
    }
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      this.logger.info('Evaluation job completed', {
        jobId: job.id,
        result,
      });
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error('Evaluation job failed', error, {
        jobId: job?.id,
        attempt: job?.attemptsMade,
      });
    });

    this.worker.on('error', (error) => {
      this.logger.error('Evaluation worker error', error);
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
