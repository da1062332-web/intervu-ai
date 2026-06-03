import { z } from 'zod';
import { DifficultyLevel, QuestionType } from '@intervu/shared';

export const QuestionMetadataSchema = z.object({
  difficulty: z.nativeEnum(DifficultyLevel),
  concept: z.string(),
});

export const GeneratedQuestionSchema = z.object({
  question_id: z.string().cuid(),
  type: z.nativeEnum(QuestionType),
  question: z.string(),
  options: z.array(z.string()).length(4),
  answer_type: z.literal('single'),
  metadata: QuestionMetadataSchema,
});

export const TestSectionSchema = z.object({
  section_id: z.string().cuid(),
  name: z.string(),
  questions: z.array(GeneratedQuestionSchema),
});

export const TestInstanceSchema = z.object({
  id: z.string().cuid(),
  current_section: z.string(),
  sections: z.array(TestSectionSchema),
});

export const TestInstanceResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    test_instance: TestInstanceSchema,
  }),
  error: z.null(),
  meta: z.object({
    timestamp: z.string(),
    request_id: z.string(),
  }),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  meta: z.object({
    timestamp: z.string(),
    request_id: z.string(),
  }),
});

// Relational Persistence Question schema (Full database sync format)
export const FullGeneratedQuestionSchema = z.object({
  id: z.string().cuid(),
  templateId: z.string(),
  questionHash: z.string(), // CUID or Sha256 hash checking
  questionText: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  solutionSteps: z.array(z.string()),
  difficulty: z.nativeEnum(DifficultyLevel),
  difficultyScore: z.number(),
  parameters: z.record(z.any()),
  isImmutable: z.boolean().default(true),
  createdAt: z.date(),
});

// Infer types
export type QuestionMetadata = z.infer<typeof QuestionMetadataSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type TestSection = z.infer<typeof TestSectionSchema>;
export type TestInstance = z.infer<typeof TestInstanceSchema>;
export type TestInstanceResponse = z.infer<typeof TestInstanceResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type FullGeneratedQuestion = z.infer<typeof FullGeneratedQuestionSchema>;
