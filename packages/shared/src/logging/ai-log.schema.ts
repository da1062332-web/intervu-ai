import { z } from 'zod';

export const AiLogSchema = z.object({
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  latencyMs: z.number(),
  successful: z.boolean(),
  error: z.string().optional(),
});
