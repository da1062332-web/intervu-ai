import { z } from "zod";

export const TopicAllocationSchema = z.object({
  topicId: z.string().min(1, "topicId is required"),
  percentage: z
    .number()
    .min(0)
    .max(100, "percentage must be between 0 and 100"),
});

export const DifficultyAllocationSchema = z.object({
  easy: z.number().min(0).max(100),
  medium: z.number().min(0).max(100),
  hard: z.number().min(0).max(100),
});

export const BlueprintSectionSchema = z.object({
  sectionId: z.string().min(1, "sectionId is required"),
  questionCount: z.number().int().positive("questionCount must be positive"),
  topicAllocations: z.array(TopicAllocationSchema),
  difficultyAllocation: DifficultyAllocationSchema,
  templateTypes: z.array(z.string()).default([]),
});

export const ExamBlueprintSchema = z.object({
  id: z.string().optional(),
  configId: z.string().min(1, "configId is required"),
  styleProfileId: z.string().min(1, "styleProfileId is required"),
  sections: z.array(BlueprintSectionSchema),
});
