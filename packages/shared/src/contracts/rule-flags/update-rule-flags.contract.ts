import { z } from "zod";

export const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  sectionalCutoffEnabled: z.boolean(),
  adaptiveDifficultyEnabled: z.boolean(),
  shuffleQuestionsEnabled: z.boolean(),
  shuffleOptionsEnabled: z.boolean(),
  allowSectionNavigation: z.boolean(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  candidateNoRepeatEnabled: z.boolean().optional(),
  runtimeGenerationOnDeficit: z.boolean().optional(),
  poolEnabled: z.boolean().optional(),
  poolTargetSize: z.number().int().min(1).max(500).optional(),
  poolMinThreshold: z.number().int().min(1).max(100).optional(),
  poolRefillBatchSize: z.number().int().min(1).max(50).optional(),
});

export type UpdateRuleFlags = z.infer<typeof UpdateRuleFlagsSchema>;
