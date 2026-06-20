import { z } from "zod";
import { ConceptStatus } from "@intervu-ai/contracts";

export const ConceptMappingResponseSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(ConceptStatus),
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
