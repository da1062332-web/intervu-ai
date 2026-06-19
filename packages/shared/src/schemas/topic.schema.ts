import { z } from "zod";

export const TopicResponseSchema = z.object({
  id: z.string(),
  domain: z.string(),
  topicName: z.string(),
  subtopic: z.string(),
  tags: z.array(z.string()),
  easySupport: z.boolean(),
  mediumSupport: z.boolean(),
  hardSupport: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  deletedAt: z.union([z.date(), z.string()]).nullable().optional(),
});

export const TopicListResponseSchema = z.array(TopicResponseSchema);
