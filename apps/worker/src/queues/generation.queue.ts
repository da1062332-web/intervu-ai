import { Worker, Job, type ConnectionOptions } from 'bullmq';
import { AppLogger } from '@intervu-ai/shared-logger';
import { GenerationQueueRequest } from '@intervu/shared';
import { QueueJobRequestSchema } from '@intervu/shared';

export class GenerationQueueProcessor {
  private worker: Worker;
  private logger: AppLogger;

  constructor(connection: ConnectionOptions, logger: AppLogger) {
    this.logger = logger;

    this.worker = new Worker('generation', this.processJob.bind(this), {
      connection,
      concurrency: 5,
    });

    this.setupEventHandlers();
  }

  private async processJob(job: Job<GenerationQueueRequest>): Promise<unknown> {
    const startTime = Date.now();

    this.logger.setContext({
      jobId: job.id,
      testId: job.data.payload.assemblyId,
      queue: 'generation',
    });

    try {
      this.logger.info(`Processing job ${job.id}`);
      
      // Input Validation Test via Shared Contract
      try {
        const payload = QueueJobRequestSchema.parse(job.data);
        this.logger.info('Payload validated against schema', { payload });
      } catch (err) {
        this.logger.error('Invalid queue payload contract', err as Error);
        throw err;
      }

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const duration = Date.now() - startTime;
      this.logger.info(`Successfully completed generation job ${job.id}`, { duration });
      return { status: 'completed', generatedItemCount: 10 };
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
