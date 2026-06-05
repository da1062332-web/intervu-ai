import { Worker, Job, type ConnectionOptions } from 'bullmq';
import { AppLogger } from '@intervu-ai/shared-logger';
import { QueuePayload } from '@intervu-ai/contracts';

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

  private async processJob(job: Job<QueuePayload>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      correlationId: job.data.correlationId,
      queueName: 'evaluation',
    });

    try {
      this.logger.info('Processing evaluation job', {
        jobId: job.id,
        correlationId: job.data.correlationId,
        attempt: job.attemptsMade,
      });

      // Simulate evaluation processing
      await new Promise((resolve) => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 10 : 2000));

      const duration = Date.now() - startTime;

      const result = {
        success: true,
        jobId: job.id,
        duration,
        score: 85, // Deterministic score for compliance
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

  async close(force: boolean = false): Promise<void> {
    await this.worker.close(force);
  }
}
