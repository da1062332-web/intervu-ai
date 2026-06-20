import { z } from "zod";

export enum TopicStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export const TopicBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Topic name is required")
    .max(255, "Topic name cannot exceed 255 characters"),
  code: z
    .string()
    .min(1, "Topic code is required")
    .max(100, "Topic code cannot exceed 100 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Topic code must contain only alphanumeric characters, underscores, or hyphens",
    ),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
  status: z.nativeEnum(TopicStatus).default(TopicStatus.ACTIVE),
});

export const CreateTopicSchema = TopicBaseSchema;

export const UpdateTopicSchema = TopicBaseSchema.partial();

export const TopicResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(TopicStatus),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const TopicListResponseSchema = z.array(TopicResponseSchema);
