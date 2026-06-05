import { z } from 'zod';

export const AIQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).min(2, 'At least 2 options required').optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  topic: z.string(),
  tags: z.array(z.string()).optional(),
});

export type AIQuestion = z.infer<typeof AIQuestionSchema>;

export const AIResponseSchema = z.object({
  questions: z.array(AIQuestionSchema),
  metadata: z.object({
    model: z.string(),
    tokensUsed: z.number().int().min(0).optional(),
    generationTimeMs: z.number().int().min(0).optional(),
  }).optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
