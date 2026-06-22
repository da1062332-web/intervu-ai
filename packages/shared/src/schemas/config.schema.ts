import { z } from "zod";

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
  description: z.string().nullable().optional(),
  difficulty: z.string().optional(),
  config: z.unknown().optional(),
  isSystem: z.boolean().optional(),
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

export const TemplateVariableSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  variableName: z.string(),
  variableType: z.string(),
  required: z.boolean(),
  defaultValue: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TemplateVariableListSchema = z.array(TemplateVariableSchema);

export const TemplateRuleSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  ruleType: z.string(),
  ruleConfig: z.unknown(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TemplateRuleListSchema = z.array(TemplateRuleSchema);
