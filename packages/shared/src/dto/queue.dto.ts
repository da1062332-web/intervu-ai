import { QueueName } from '../enums/queue.enum';

export interface BaseQueueRequest {
  jobId: string;
  type: string;
  timestamp: number;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerationQueueRequest extends BaseQueueRequest {
  type: QueueName.GENERATION | 'generation';
  payload: {
    assemblyId: string;
    templateId?: string;
    difficulty?: string;
    customPrompt?: string;
    retryCount?: number;
  };
}

export interface EvaluationQueueRequest extends BaseQueueRequest {
  type: QueueName.EVALUATION | 'evaluation';
  payload: {
    testId: string;
    userId: string;
    evaluationCriteria?: Record<string, unknown>;
    retryCount?: number;
  };
}

export interface AnalyticsQueueRequest extends BaseQueueRequest {
  type: QueueName.ANALYTICS | 'analytics';
  payload: {
    eventType: string;
    eventData: Record<string, unknown>;
    batchId?: string;
  };
}

export type QueueRequest = GenerationQueueRequest | EvaluationQueueRequest | AnalyticsQueueRequest;

export interface QueueJobResult {
  success: boolean;
  jobId: string;
  result?: unknown;
  error?: string;
  duration: number;
  completedAt: number;
}
