import { z } from "zod";
import { DifficultyLevel } from "@intervu/shared";

export enum TemplateCategory {
  APTITUDE = "aptitude",
  LOGICAL_REASONING = "logical_reasoning",
  QUANTITATIVE_REASONING = "quantitative_reasoning",
  CODING = "coding",
}

export const VariableNumberRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
});

export const VariableSchema = z.discriminatedUnion("type", [
  z.object({
    name: z.string(),
    type: z.literal("number"),
    range: VariableNumberRangeSchema,
  }),
  z.object({
    name: z.string(),
    type: z.literal("string"),
    options: z.array(z.string()),
  }),
]);

export const ConstraintSeveritySchema = z.enum(["warning", "critical"]);

export const ConstraintSchema = z.object({
  rule: z.string(), // Evaluated mathematical expressions (e.g. "CP < SP" or "days_A !== days_B")
  severity: ConstraintSeveritySchema,
});

export const SolutionTemplateSchema = z.object({
  steps: z.array(z.string()),
  finalAnswer: z.string(), // Hydratable math/numeric result formula
});

export const DifficultyMetadataSchema = z.object({
  w1_steps: z.number(),
  w2_number_complexity: z.number(),
  w3_concept_overlap: z.number(),
  w4_trick_factor: z.number(),
});

export const QuestionTemplateSchema = z.object({
  templateId: z.string(),
  type: z.nativeEnum(TemplateCategory),
  topic: z.string(),
  difficulty: z.nativeEnum(DifficultyLevel),
  variables: z.array(VariableSchema),
  constraints: z.array(ConstraintSchema),
  questionTemplate: z.string(),
  solutionTemplate: SolutionTemplateSchema,
  metadata: DifficultyMetadataSchema,
  tags: z.array(z.string()).optional(),
});

// Infer TypeScript types from Zod schemas
export type VariableNumberRange = z.infer<typeof VariableNumberRangeSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type ConstraintSeverity = z.infer<typeof ConstraintSeveritySchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type SolutionTemplate = z.infer<typeof SolutionTemplateSchema>;
export type DifficultyMetadata = z.infer<typeof DifficultyMetadataSchema>;
export type QuestionTemplate = z.infer<typeof QuestionTemplateSchema>;
