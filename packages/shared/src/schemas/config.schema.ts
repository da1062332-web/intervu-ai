import { z } from "zod";

export const SystemConfigSchema = z.object({
  id: z.string().optional(),
  difficultyWeights: z.record(z.string(), z.number()).optional(),
  generationTimeouts: z.record(z.string(), z.number()).optional(),
  queueConcurrency: z.record(z.string(), z.number()).optional(),
  featureFlags: z.record(z.string(), z.boolean()).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  templateKey: z.string().optional(),
  conceptKey: z.string().optional(),
  questionType: z.string().optional(),
  structure: z.unknown().optional(),
  difficulty: z.string().optional(),
  difficultyLevel: z.string().optional(),
  config: z.unknown().optional(),
  isSystem: z.boolean().optional(),
  version: z.number().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
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
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export const TemplateVariableListSchema = z.array(TemplateVariableSchema);

export const TemplateRuleSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  ruleType: z.string(),
  ruleConfig: z.unknown(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export const TemplateRuleListSchema = z.array(TemplateRuleSchema);
