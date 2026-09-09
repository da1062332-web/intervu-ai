import { z } from "zod";

export const RuleFlagsResponseSchema = z.object({
  id: z.string().or(z.literal("")),
  examConfigId: z.string().cuid(),
  negativeMarkingEnabled: z.boolean(),
  sectionalCutoffEnabled: z.boolean(),
  adaptiveDifficultyEnabled: z.boolean(),
  shuffleQuestionsEnabled: z.boolean(),
  shuffleOptionsEnabled: z.boolean(),
  allowSectionNavigation: z.boolean(),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  candidateNoRepeatEnabled: z.boolean().default(false),
  runtimeGenerationOnDeficit: z.boolean().default(false),
  poolEnabled: z.boolean().default(false),
  poolTargetSize: z.number().int().min(1).default(10),
  poolMinThreshold: z.number().int().min(1).default(3),
  poolRefillBatchSize: z.number().int().min(1).default(5),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type RuleFlagsResponseDto = z.infer<typeof RuleFlagsResponseSchema>;
