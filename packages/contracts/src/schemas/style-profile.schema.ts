import { z } from "zod";

export const StyleCharacteristicSchema = z.object({
  name: z.string().min(1, "characteristic name is required"),
  value: z.unknown(),
});

export const LanguageStyleSchema = z.object({
  language: z.string().default("English"),
  sentenceLength: z.string().default("medium"),
  vocabularyLevel: z.string().default("intermediate"),
  grammarStyle: z.string().default("formal"),
});

export const ContextStyleSchema = z.object({
  preferredContexts: z.array(z.string()).default([]),
});

export const WordingDifficultySchema = z.object({
  easy: z.array(z.string()).default([]),
  medium: z.array(z.string()).default([]),
  hard: z.array(z.string()).default([]),
});

export const DistractorRulesSchema = z.object({
  exactlyFourOptions: z.boolean().default(true),
  oneCorrectAnswer: z.boolean().default(true),
  plausibleIncorrectOptions: z.boolean().default(true),
  avoidObviouslyWrongOptions: z.boolean().default(true),
  avoidHumorousOptions: z.boolean().default(true),
  representCommonStudentMistakes: z.boolean().default(true),
});

export const ExplanationStyleSchema = z.object({
  formulaFirst: z.boolean().default(true),
  stepWiseSolution: z.boolean().default(true),
  maxSteps: z.number().default(5),
  explanationLength: z.string().default("medium"),
  highlightFinalAnswer: z.boolean().default(true),
});

export const StyleProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "name is required"),
  description: z.string().optional().nullable(),
  profileType: z
    .enum(["campus", "lateral", "executive", "certification"])
    .default("campus"),
  characteristics: z.array(StyleCharacteristicSchema).default([]),
  active: z.boolean().default(true),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  isDefault: z.boolean().default(false),
  languageStyle: LanguageStyleSchema.default({}),
  contextStyle: ContextStyleSchema.default({}),
  difficultyStyle: WordingDifficultySchema.default({}),
  distractorRules: DistractorRulesSchema.default({}),
  explanationStyle: ExplanationStyleSchema.default({}),
  aiInstructions: z.string().default(""),
});

