import { Job } from 'bullmq';
import { AppLogger } from '@intervu-ai/shared-logger';
import { QueueFactory } from './queue-config';
import {
  QueueMessage,
  QueueType,
  GenerationQueueMessage,
  EvaluationQueueMessage,
  AnalyticsQueueMessage,
} from './queue-payloads';

export class QueueService {
  private logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
  }

  async enqueueGeneration(payload: Omit<GenerationQueueMessage, 'type'>): Promise<Job> {
    const fullPayload: GenerationQueueMessage = {
      ...payload,
      type: QueueType.GENERATION,
    };

    return this.enqueue(QueueType.GENERATION, fullPayload);
  }

  async enqueueEvaluation(payload: Omit<EvaluationQueueMessage, 'type'>): Promise<Job> {
    const fullPayload: EvaluationQueueMessage = {
      ...payload,
      type: QueueType.EVALUATION,
    };

    return this.enqueue(QueueType.EVALUATION, fullPayload);
  }

  async enqueueAnalytics(payload: Omit<AnalyticsQueueMessage, 'type'>): Promise<Job> {
    const fullPayload: AnalyticsQueueMessage = {
      ...payload,
      type: QueueType.ANALYTICS,
    };

    return this.enqueue(QueueType.ANALYTICS, fullPayload);
  }

  private async enqueue(queueType: QueueType, payload: QueueMessage): Promise<Job> {
    try {
      const queue = QueueFactory.getQueue(queueType);

      const job = await queue.add(payload.jobId, payload, {
        jobId: payload.jobId,
      });

      this.logger.info(`Job enqueued successfully`, {
        jobId: payload.jobId,
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
