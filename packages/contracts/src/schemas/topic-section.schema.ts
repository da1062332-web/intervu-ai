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
