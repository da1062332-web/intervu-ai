import { z } from "zod";

export const RuleFlagsResponseSchema = z.object({
  id: z.string().cuid().or(z.literal("")),
  examConfigId: z.string().cuid(),
  negativeMarkingEnabled: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  calculatorAllowed: z.boolean(),
  sectionLockingEnabled: z.boolean(),
  freeNavigationEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RuleFlagsResponseDto = z.infer<typeof RuleFlagsResponseSchema>;
