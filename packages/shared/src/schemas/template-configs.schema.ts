import { z } from "zod";
import { ApiSuccessResponseSchema } from "./api.schema";

export const TemplateDatasetConfigBaseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  datasetId: z.string(),
  selectionMethod: z.string(),
  difficultyOverride: z.string().nullable(),
  topicOverride: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
  variableMapping: z.record(z.string(), z.string()).optional().nullable(),
  sampleSize: z.number().int().optional().nullable(),
  shuffle: z.boolean().optional().nullable(),
  allowReuse: z.boolean().optional().nullable(),
  specificItemId: z.string().optional().nullable(),
  fallbackPolicy: z.string().optional().nullable(),
});

export const TemplateDatasetConfigResponseSchema = TemplateDatasetConfigBaseSchema.nullable();

export const TemplatePromptConfigBaseSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  systemPrompt: z.string(),
  userPrompt: z.string(),
  instructions: z.string(),
  outputRules: z.string().nullable(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const TemplatePromptConfigResponseSchema = TemplatePromptConfigBaseSchema.nullable();
