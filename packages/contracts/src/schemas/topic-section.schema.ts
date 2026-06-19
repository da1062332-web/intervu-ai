import { z } from "zod";

export const CreateSectionTopicSchema = z.object({
  topicId: z.string(),
});

export type CreateSectionTopicRequest = z.infer<
  typeof CreateSectionTopicSchema
>;

export const SectionTopicResponseSchema = z.object({
  topicId: z.string(),
  topicName: z.string(),
  topicCode: z.string(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export type SectionTopicResponse = z.infer<typeof SectionTopicResponseSchema>;

export const SectionTopicListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SectionTopicResponseSchema),
});

export type SectionTopicListResponse = z.infer<
  typeof SectionTopicListResponseSchema
>;

export const CreateTopicWeightageSchema = z.object({
  topicId: z.string(),
  weightagePercentage: z.number().int().min(1).max(100),
});

export type CreateTopicWeightageRequest = z.infer<
  typeof CreateTopicWeightageSchema
>;

export const UpdateTopicWeightageSchema = z.object({
  weightagePercentage: z.number().int().min(1).max(100),
});

export type UpdateTopicWeightageRequest = z.infer<
  typeof UpdateTopicWeightageSchema
>;

export const TopicWeightageResponseSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  topicId: z.string(),
  weightagePercentage: z.number(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

export type TopicWeightageResponse = z.infer<
  typeof TopicWeightageResponseSchema
>;

export const TopicWeightageListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TopicWeightageResponseSchema),
});

export type TopicWeightageListResponse = z.infer<
  typeof TopicWeightageListResponseSchema
>;
