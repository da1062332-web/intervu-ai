import { z } from "zod";

export const DifficultyDistributionResponseSchema = z.object({
  id: z.string().uuid(),
  examConfigId: z.string().uuid(),
  easyCount: z.number().int().min(0),
  mediumCount: z.number().int().min(0),
  hardCount: z.number().int().min(0),
  totalQuestions: z.number().int().min(0),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type DifficultyDistributionResponse = z.infer<
  typeof DifficultyDistributionResponseSchema
>;
