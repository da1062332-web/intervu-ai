import { z } from "zod";

/**
 * Queue message type definitions.
 * Defines strongly-typed structures for all queue job messages.
 *
 * Two layers exist:
 * 1. TypeScript interfaces — used by the worker app via @intervu/shared `queue.dto.ts`
 * 2. Zod schemas below   — used by THIS API app for runtime payload validation (Fail Fast)
 */

export enum QueueType {
  GENERATION = "generation",
  EVALUATION = "evaluation",
  ANALYTICS = "analytics",
  VALIDATION = "validation",
  CODE_EXECUTION = "code-execution",
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

/**
 * Code execution jobs carry the raw candidate submission (mode + DTO + caller
 * identity) through to a bounded-concurrency worker instead of every request
 * hitting Judge0 directly and unboundedly. `dto`/`user` are `unknown` here
 * because this file has no dependency on the coding module's types — the
 * processor casts them back to `RunCodeDto`/`SubmitCodeDto`/`AuthUser`.
 */
export interface CodeExecutionQueueMessage extends BaseQueueMessage {
  type: QueueType.CODE_EXECUTION;
  payload: {
    mode: "run" | "submit";
    // Optional here only to match the Zod-inferred type below (z.unknown()
    // fields infer as optional) — enqueueCodeExecution always supplies both.
    dto?: unknown;
    user?: unknown;
  };
}

export type QueueMessage =
  | GenerationQueueMessage
  | EvaluationQueueMessage
  | AnalyticsQueueMessage
  | ValidationQueueMessage
  | CodeExecutionQueueMessage;

export interface QueueJobResult {
  success: boolean;
  jobId: string;
  data?: unknown;
  error?: string;
}

// ─── Zod Schemas for Runtime Validation (Day 4 — Deliverable #4) ──────────────
// Shape: { jobId: string, type: "generation", payload: {} }

const BaseJobSchema = z.object({
  jobId: z.string().min(1, { message: "jobId is required" }),
  timestamp: z.number().int().positive(),
  correlationId: z.string().optional(),
  userId: z.string().optional(),
});

export const GenerationJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.GENERATION),
  payload: z.object({
    assemblyId: z.string().min(1, "assemblyId is required"),
    difficulty: z.string().optional(),
    count: z.number().int().positive().optional(),
    topicId: z.string().optional(),
  }),
});

export const EvaluationJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.EVALUATION),
  payload: z.object({
    testId: z.string().min(1, "testId is required"),
    userId: z.string().min(1, "userId is required"),
    answers: z.record(z.string()).optional(),
  }),
});

export const AnalyticsJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.ANALYTICS),
  payload: z.object({
    eventType: z.string().min(1, "eventType is required"),
    eventData: z.record(z.unknown()),
  }),
});

export const ValidationJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.VALIDATION),
  payload: z.object({
    questionId: z.string().min(1, "questionId is required"),
    content: z.record(z.unknown()),
  }),
});

export const CodeExecutionJobSchema = BaseJobSchema.extend({
  type: z.literal(QueueType.CODE_EXECUTION),
  payload: z.object({
    mode: z.union([z.literal("run"), z.literal("submit")]),
    dto: z.unknown(),
    user: z.unknown(),
  }),
});

// Discriminated union for full payload validation
export const AnyJobSchema = z.discriminatedUnion("type", [
  GenerationJobSchema,
  EvaluationJobSchema,
  AnalyticsJobSchema,
  ValidationJobSchema,
  CodeExecutionJobSchema,
]);

export type GenerationJobInput = z.infer<typeof GenerationJobSchema>;
export type EvaluationJobInput = z.infer<typeof EvaluationJobSchema>;
export type AnalyticsJobInput = z.infer<typeof AnalyticsJobSchema>;
export type ValidationJobInput = z.infer<typeof ValidationJobSchema>;
export type CodeExecutionJobInput = z.infer<typeof CodeExecutionJobSchema>;
