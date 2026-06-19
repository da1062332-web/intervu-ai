import { z } from "zod";

export const ConceptMappingResponseSchema = z.object({
  id: z.string().cuid(),
  topicId: z.string(),
  conceptName: z.string(),
  conceptCode: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const ConceptMappingListResponseSchema = z.array(
  ConceptMappingResponseSchema,
);

export const TopicRegistryItemSchema = z.object({
  id: z.string(),
  domain: z.string(),
  topic: z.string(),
  subtopic: z.string(),
  concepts: z.array(z.string()),
  tags: z.array(z.string()),
  difficultySupport: z.object({
    easy: z.boolean(),
    medium: z.boolean(),
    hard: z.boolean(),
  }),
});

export const TopicRegistryListResponseSchema = z.array(TopicRegistryItemSchema);
