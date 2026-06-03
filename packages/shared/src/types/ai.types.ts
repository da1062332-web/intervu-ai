import { z } from 'zod';
import { GenerateQuestionRequestSchema, AiQuestionResponseSchema } from '../schemas/ai.schema';

export type GenerateQuestionRequest = z.infer<typeof GenerateQuestionRequestSchema>;
export type AiQuestionResponse = z.infer<typeof AiQuestionResponseSchema>;
