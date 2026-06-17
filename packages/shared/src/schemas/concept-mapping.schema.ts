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

export const ConceptMappingListResponseSchema = z.array(ConceptMappingResponseSchema);
