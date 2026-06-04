import { z } from 'zod';

/**
 * Queue message type definitions.
 * Defines strongly-typed structures for all queue job messages.
 *
 * Two layers exist:
 * 1. TypeScript interfaces — used by the worker app via @intervu/shared `queue.dto.ts`
 * 2. Zod schemas below   — used by THIS API app for runtime payload validation (Fail Fast)
 */

export enum QueueType {
  GENERATION = 'generation',
  EVALUATION = 'evaluation',
  ANALYTICS = 'analytics',
  VALIDATION = 'validation',
}

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

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

export interface ValidationQueueMessage extends BaseQueueMessage {
  type: QueueType.VALIDATION;
  payload: {
    questionId: string;
    content: Record<string, unknown>;
  };
}

export type QueueMessage =
  | GenerationQueueMessage
  | EvaluationQueueMessage
  | AnalyticsQueueMessage
  | ValidationQueueMessage;

export interface QueueJobResult {
  success: boolean;
  jobId: string;
  data?: unknown;
  error?: string;
}

// ─── Zod Schemas for Runtime Validation (Day 4 — Deliverable #4) ──────────────
// Shape: { jobId: string, type: "generation", payload: {} }

const BaseJobSchema = z.object({
  jobId: z.string().min(1, { message: 'jobId is required' }),
  timestamp: z.number().int().positive(),
  correlationId: z.string().optional(),
  userId: z.string().optional(),
});

export const GenerationJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.GENERATION),
  payload: z.object({
    assemblyId: z.string().min(1, 'assemblyId is required'),
    difficulty: z.string().optional(),
    count: z.number().int().positive().optional(),
    topicId: z.string().optional(),
  }),
});

export const EvaluationJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.EVALUATION),
  payload: z.object({
    testId: z.string().min(1, 'testId is required'),
    userId: z.string().min(1, 'userId is required'),
    answers: z.record(z.string()).optional(),
  }),
});

export const AnalyticsJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.ANALYTICS),
  payload: z.object({
    eventType: z.string().min(1, 'eventType is required'),
    eventData: z.record(z.unknown()),
  }),
});

export const ValidationJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.VALIDATION),
  payload: z.object({
    questionId: z.string().min(1, 'questionId is required'),
    content: z.record(z.unknown()),
  }),
});

// Discriminated union for full payload validation
export const AnyJobSchema = z.discriminatedUnion('type', [
  GenerationJobSchema,
  EvaluationJobSchema,
  AnalyticsJobSchema,
  ValidationJobSchema,
]);

export type GenerationJobInput = z.infer<typeof GenerationJobSchema>;
export type EvaluationJobInput = z.infer<typeof EvaluationJobSchema>;
export type AnalyticsJobInput = z.infer<typeof AnalyticsJobSchema>;
export type ValidationJobInput = z.infer<typeof ValidationJobSchema>;
