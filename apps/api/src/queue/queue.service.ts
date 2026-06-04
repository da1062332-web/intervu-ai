import { Job } from 'bullmq';
import { AppLogger } from '@intervu-ai/shared-logger';
import { QueueFactory } from './queue-config';
import { QueuePayload } from '@intervu-ai/contracts';
import { QueueType } from './queue-payloads';

export class QueueService {
  private logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
  }

  async enqueueGeneration(payload: Extract<QueuePayload['payload'], { type: 'generation' }>['data'] & { jobId: string; correlationId: string; testId: string; timestamp: string; assemblyId?: string }): Promise<Job> {
    const fullPayload: QueuePayload = {
      requestId: payload.jobId, // reusing jobId for requestId for now
      correlationId: payload.correlationId,
      type: 'generation',
      timestamp: payload.timestamp,
      payload: {
        type: 'generation',
        testId: payload.testId,
        data: {
          topic: payload.topic,
          difficulty: payload.difficulty,
          count: payload.count,
        }
      }
    };

    return this.enqueue(QueueType.GENERATION, fullPayload);
  }

  async enqueueEvaluation(payload: Omit<Extract<QueuePayload['payload'], { type: 'evaluation' }>, 'type'> & { requestId: string; correlationId: string; timestamp: string }): Promise<Job> {
    const fullPayload: QueuePayload = {
      requestId: payload.requestId,
      correlationId: payload.correlationId,
      type: 'evaluation',
      timestamp: payload.timestamp,
      payload: {
        type: 'evaluation',
        data: payload.data
      },
    };
    return this.enqueue(QueueType.EVALUATION, fullPayload);
  }

  async enqueueAnalytics(payload: Omit<Extract<QueuePayload['payload'], { type: 'analytics' }>, 'type'> & { requestId: string; correlationId: string; timestamp: string }): Promise<Job> {
    const fullPayload: QueuePayload = {
      requestId: payload.requestId,
      correlationId: payload.correlationId,
      type: 'analytics',
      timestamp: payload.timestamp,
      payload: {
        type: 'analytics',
        data: payload.data
      },
    };
    return this.enqueue(QueueType.ANALYTICS, fullPayload);
  }

  private async enqueue(queueType: QueueType, payload: QueuePayload | any): Promise<Job> {
    try {
      const queue = QueueFactory.getQueue(queueType);

      const job = await queue.add(payload.requestId || payload.jobId, payload, {
        jobId: payload.requestId || payload.jobId,
      });

      this.logger.info(`Job enqueued successfully`, {
        jobId: job.id,
        queueName: queueType,
        correlationId: payload.correlationId,
      });

      return job;
    } catch (error) {
      this.logger.error(`Failed to enqueue job`, error, {
        jobId: payload.jobId,
        queueName: queueType,
      });
      throw error;
    }
  }

  async getJob(queueType: QueueType, jobId: string): Promise<Job | undefined> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      return await queue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Failed to get job`, error, { jobId, queueName: queueType });
      return undefined;
    }
  }

  async getJobState(queueType: QueueType, jobId: string): Promise<string | undefined> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.getJob(jobId);
      return job?.getState();
    } catch (error) {
      this.logger.error(`Failed to get job state`, error, { jobId, queueName: queueType });
      return undefined;
    }
  }

  async getQueueCounts(queueType: QueueType): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
      return {
        waiting: counts.wait || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue counts`, error, { queueName: queueType });
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  async retryFailedJob(queueType: QueueType, jobId: string): Promise<boolean> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.getJob(jobId);

      if (!job) {
        this.logger.warn(`Job not found for retry`, { jobId, queueName: queueType });
        return false;
      }

      await job.retry();
      this.logger.info(`Job retried successfully`, { jobId, queueName: queueType });
      return true;
    } catch (error) {
      this.logger.error(`Failed to retry job`, error, { jobId, queueName: queueType });
      return false;
    }
  }

  async removeJob(queueType: QueueType, jobId: string): Promise<boolean> {
    try {
      const queue = QueueFactory.getQueue(queueType);
      const job = await queue.getJob(jobId);

      if (!job) {
        this.logger.warn(`Job not found for removal`, { jobId, queueName: queueType });
        return false;
      }

      await job.remove();
      this.logger.info(`Job removed successfully`, { jobId, queueName: queueType });
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove job`, error, { jobId, queueName: queueType });
      return false;
    }
  }
}
