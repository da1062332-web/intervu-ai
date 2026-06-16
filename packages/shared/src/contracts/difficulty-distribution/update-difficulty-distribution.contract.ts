import { z } from "zod";

export const UpdateDifficultyDistributionSchema = z.object({
  easyCount: z.number().int().min(0),
  mediumCount: z.number().int().min(0),
  hardCount: z.number().int().min(0),
});

export type UpdateDifficultyDistributionDto = z.infer<
  typeof UpdateDifficultyDistributionSchema
>;
