import { z } from "zod";

export const DifficultyDistributionResponseSchema = z.object({
  id: z.string(),
  examConfigId: z.string().cuid(),
  easyPercentage: z.number().int().min(0).max(100),
  mediumPercentage: z.number().int().min(0).max(100),
  hardPercentage: z.number().int().min(0).max(100),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type DifficultyDistributionResponse = z.infer<
  typeof DifficultyDistributionResponseSchema
>;
