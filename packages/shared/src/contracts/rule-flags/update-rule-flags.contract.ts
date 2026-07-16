import { z } from "zod";

export const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  sectionalCutoffEnabled: z.boolean(),
  adaptiveDifficultyEnabled: z.boolean(),
  shuffleQuestionsEnabled: z.boolean(),
  shuffleOptionsEnabled: z.boolean(),
  allowSectionNavigation: z.boolean(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
});

export type UpdateRuleFlags = z.infer<typeof UpdateRuleFlagsSchema>;
