import { z } from "zod";

export const UpdateDifficultyDistributionSchema = z.object({
  easyPercentage: z.number().int().min(0).max(100),
  mediumPercentage: z.number().int().min(0).max(100),
  hardPercentage: z.number().int().min(0).max(100),
});

export type UpdateDifficultyDistribution = z.infer<
  typeof UpdateDifficultyDistributionSchema
>;
