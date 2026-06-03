/**
 * Queue message type definitions.
 * Defines the strongly-typed structures for all queue job messages.
 */

export enum QueueType {
  GENERATION = 'generation',
  EVALUATION = 'evaluation',
  ANALYTICS = 'analytics',
}

export interface BaseQueueMessage {
  jobId: string;
  timestamp: number;
  correlationId?: string;
  userId?: string;
  type: QueueType;
}

export interface GenerationQueueMessage extends BaseQueueMessage {
  type: QueueType.GENERATION;
  payload: {
    assemblyId: string;
    difficulty?: string;
    count?: number;
    topicId?: string;
  };
}

export interface EvaluationQueueMessage extends BaseQueueMessage {
  type: QueueType.EVALUATION;
  payload: {
    testId: string;
    userId: string;
    answers?: Record<string, string>;
  };
}

export interface AnalyticsQueueMessage extends BaseQueueMessage {
  type: QueueType.ANALYTICS;
  payload: {
    eventType: string;
    eventData: Record<string, unknown>;
  };
}

export type QueueMessage =
  | GenerationQueueMessage
  | EvaluationQueueMessage
  | AnalyticsQueueMessage;

export interface QueueJobResult {
  success: boolean;
  jobId: string;
  data?: unknown;
  error?: string;
}
