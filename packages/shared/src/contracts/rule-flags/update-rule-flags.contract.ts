import { z } from "zod";

export const UpdateRuleFlagsSchema = z.object({
  negativeMarkingEnabled: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  calculatorAllowed: z.boolean(),
  sectionLockingEnabled: z.boolean(),
  freeNavigationEnabled: z.boolean(),
});

export type UpdateRuleFlags = z.infer<typeof UpdateRuleFlagsSchema>;
