import { z } from "zod";

export const TopicBaseSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(150, "Domain cannot exceed 150 characters"),
  topicName: z
    .string()
    .min(1, "Topic Name is required")
    .max(150, "Topic Name cannot exceed 150 characters"),
  subtopic: z
    .string()
    .min(1, "Subtopic is required")
    .max(150, "Subtopic cannot exceed 150 characters"),
  tags: z.array(z.string()),
  easySupport: z.boolean().default(true),
  mediumSupport: z.boolean().default(true),
  hardSupport: z.boolean().default(true),
});

export const CreateTopicSchema = TopicBaseSchema.refine(
  (data) => data.easySupport || data.mediumSupport || data.hardSupport,
  {
    message: "At least one difficulty level must be supported",
    path: ["easySupport"],
  }
);

export const UpdateTopicSchema = TopicBaseSchema.partial().extend({
  isActive: z.boolean().optional(),
});
