import { z } from "zod";

export const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  sectionalCutoffEnabled: z.boolean(),
  adaptiveDifficultyEnabled: z.boolean(),
  shuffleQuestionsEnabled: z.boolean(),
  shuffleOptionsEnabled: z.boolean(),
  allowSectionNavigation: z.boolean(),
});

export type UpdateRuleFlags = z.infer<typeof UpdateRuleFlagsSchema>;
