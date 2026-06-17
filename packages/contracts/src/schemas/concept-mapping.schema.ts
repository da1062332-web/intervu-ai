import { z } from "zod";

export const ConceptMappingBaseSchema = z.object({
  conceptName: z
    .string()
    .min(1, "Concept Name is required")
    .max(150, "Concept Name cannot exceed 150 characters"),
  conceptCode: z
    .string()
    .min(1, "Concept Code is required")
    .max(50, "Concept Code cannot exceed 50 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Concept Code must contain only alphanumeric characters, underscores, or hyphens",
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .nullable()
    .optional(),
});

export const CreateConceptMappingSchema = ConceptMappingBaseSchema;
export const UpdateConceptMappingSchema =
  ConceptMappingBaseSchema.partial().extend({
    isActive: z.boolean().optional(),
  });
