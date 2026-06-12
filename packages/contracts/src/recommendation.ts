import { z } from "zod";

export const RecommendationDtoSchema = z.object({
  recommendationId: z.string().min(1, "recommendationId is required"),
  skill: z.string().min(1, "skill is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
});

export type RecommendationDto = z.infer<typeof RecommendationDtoSchema>;

export const RecommendationResultDtoSchema = z.object({
  recommendations: z.array(RecommendationDtoSchema),
});

export type RecommendationResultDto = z.infer<typeof RecommendationResultDtoSchema>;
