import { z } from 'zod';

export const GenerationRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  count: z.number().int().min(1).max(50),
  context: z.string().optional(),
});

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

export const GenerationDataSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  message: z.string().optional(),
});

export const GenerationResponseSchema = z.object({
  success: z.boolean(),
  data: GenerationDataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).nullable().optional(),
  meta: z.record(z.unknown()).nullable().optional(),
});

export type GenerationResponse = z.infer<typeof GenerationResponseSchema>;

export const CreateTestRequestSchema = z.object({
  companyId: z.string().min(1),
  testType: z.string().min(1),
});

export type CreateTestRequest = z.infer<typeof CreateTestRequestSchema>;

export const ApiSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.null().optional(),
  meta: z.unknown().nullable().optional(),
});

export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;

export const EvaluationRequestSchema = z.object({
  answerId: z.string().min(1),
  testId: z.string().min(1),
  candidateResponse: z.string().min(1),
});

export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>;
