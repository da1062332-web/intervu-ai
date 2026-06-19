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
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type RuleFlagsResponseDto = z.infer<typeof RuleFlagsResponseSchema>;
