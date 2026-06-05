import { z } from 'zod';

export const CreateTestRequestSchema = z.object({
  companyId: z.string().min(1),
  testType: z.string().min(1),
});

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown().optional(),
  error: z.null(),
  meta: z.unknown().nullable(),
});

export const QuestionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
});

export const TestQuestionSchema = z.object({
  questionId: z.string(),
  text: z.string(),
  options: z.array(z.string()).min(1),
  type: z.string(),
});

export const TestResponseSchema = z.object({
  testId: z.string(),
  companyId: z.string(),
  testType: z.string(),
  questions: z.array(TestQuestionSchema),
  timeLimit: z.number(),
  status: z.enum(['active', 'completed', 'expired', 'pending']),
});

export type TestQuestion = z.infer<typeof TestQuestionSchema>;
