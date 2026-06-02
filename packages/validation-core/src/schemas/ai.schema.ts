import { z } from 'zod';
import { Difficulty } from '../enums/difficulty.enum';

export const GenerateQuestionRequestSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.nativeEnum(Difficulty),
  count: z.number().int().min(1).max(50),
});

export const AiQuestionResponseSchema = z.object({
  questions: z.array(z.object({
    text: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
  })),
});
