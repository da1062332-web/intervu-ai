import { z } from 'zod';

export const SystemConfigSchema = z.object({
  id: z.string().optional(),
  difficultyWeights: z.record(z.string(), z.number()).optional(),
  generationTimeouts: z.record(z.string(), z.number()).optional(),
  queueConcurrency: z.record(z.string(), z.number()).optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
  updatedAt: z.date().optional(),
});

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  content: z.string(),
  schema: z.unknown().optional(),
  version: z.number().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TemplateListSchema = z.array(TemplateSchema);

export const TemplatePaginatedSchema = z.object({
  items: TemplateListSchema,
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const TemplateVersionSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
});

export const TemplateRemoveSchema = z.object({
  id: z.string(),
});
