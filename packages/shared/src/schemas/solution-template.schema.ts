import { z } from "zod";
import { ApiSuccessResponseSchema } from "./api.schema";

export const SolutionTemplateBaseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  solutionTemplate: z.string(),
  explanationTemplate: z.string().nullable(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const TemplatePreviewBaseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  previewPayload: z.record(z.unknown()),
  previewResult: z.object({
    solution: z.string(),
    explanation: z.string().nullable(),
    resolvedVariables: z.record(z.unknown()),
    validation: z.object({
      valid: z.boolean(),
      unknownVariables: z.array(z.string()).optional(),
    }),
  }),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const SolutionTemplateSchema = ApiSuccessResponseSchema.extend({
  data: SolutionTemplateBaseSchema.nullable(),
});

export const TemplatePreviewSchema = ApiSuccessResponseSchema.extend({
  data: TemplatePreviewBaseSchema.nullable(),
});

export const NullableSolutionTemplateBaseSchema = SolutionTemplateBaseSchema.nullable();
export const NullableTemplatePreviewBaseSchema = TemplatePreviewBaseSchema.nullable();
