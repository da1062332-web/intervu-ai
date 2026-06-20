import { z } from "zod";

export enum ConceptStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export const ConceptBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Concept name is required")
    .max(255, "Concept name cannot exceed 255 characters"),
  code: z
    .string()
    .min(1, "Concept code is required")
    .max(100, "Concept code cannot exceed 100 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Concept code must contain only alphanumeric characters, underscores, or hyphens",
    ),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
  status: z.nativeEnum(ConceptStatus).default(ConceptStatus.ACTIVE),
});

export const CreateConceptSchema = ConceptBaseSchema;

export const UpdateConceptSchema = ConceptBaseSchema.partial();

export const ConceptResponseSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(ConceptStatus),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const ConceptListResponseSchema = z.array(ConceptResponseSchema);

// Backwards compatibility aliases
export const ConceptMappingBaseSchema = ConceptBaseSchema.extend({
  conceptName: z.string(),
  conceptCode: z.string(),
});
export const CreateConceptMappingSchema = CreateConceptSchema;
export const UpdateConceptMappingSchema = UpdateConceptSchema;
export const ConceptMappingResponseSchema = ConceptResponseSchema.extend({
  conceptName: z.string().optional(),
  conceptCode: z.string().optional(),
});
export const ConceptMappingListResponseSchema = z.array(ConceptMappingResponseSchema);
