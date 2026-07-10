import { z } from 'zod';
import type { GenerationStrategy } from '@/services/question-generation/types';

// ─── Per-strategy Zod schemas ──────────────────────────────────────────────

export const variableStrategySchema = z.object({
  variables: z
    .array(
      z.object({
        name: z.string().min(1, 'Variable name is required'),
        dataType: z.string().min(1, 'Data type is required'),
        generationRule: z.string().min(1, 'Generation rule is required'),
        valueRange: z.string().optional(),
      }),
    )
    .min(1, 'At least one variable is required'),
  formula: z.string().min(1, 'Formula / question template is required'),
  constraints: z.array(z.any()).optional(),
});

export const datasetStrategySchema = z.object({
  datasetType: z.string().min(1, 'Dataset Type is required'),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }),
  tags: z.array(z.string()).optional(),
  selectionRules: z.record(z.unknown()).optional(),
});

export const hybridStrategySchema = z.object({
  entitySchema: z
    .record(z.unknown())
    .refine((v) => Object.keys(v).length > 0, {
      message: 'Entity Schema is required — add at least one entity type',
    }),
  relationshipSchema: z
    .record(z.unknown())
    .refine((v) => Object.keys(v).length > 0, {
      message: 'Relationship Schema is required — add at least one relationship',
    }),
  constraintSchema: z.record(z.unknown()).optional(),
  scenarioId: z.string().optional(),
});

export type VariableStrategyConfig = z.infer<typeof variableStrategySchema>;
export type DatasetStrategyConfig = z.infer<typeof datasetStrategySchema>;
export type HybridStrategyConfig = z.infer<typeof hybridStrategySchema>;

// ─── Registry ─────────────────────────────────────────────────────────────

const strategyValidationRegistry: Record<GenerationStrategy, z.ZodSchema> = {
  VARIABLE: variableStrategySchema,
  DATASET: datasetStrategySchema,
  HYBRID: hybridStrategySchema,
};

/**
 * getValidationSchema
 *
 * Returns the Zod schema for the given strategy.
 * Forms call safeParse(config) to validate before saving.
 * No switch/if — registry lookup.
 */
export function getValidationSchema(strategy: GenerationStrategy): z.ZodSchema {
  return strategyValidationRegistry[strategy];
}

export function validateStrategyConfig(
  strategy: GenerationStrategy,
  config: unknown,
): z.SafeParseReturnType<unknown, unknown> {
  return getValidationSchema(strategy).safeParse(config);
}
