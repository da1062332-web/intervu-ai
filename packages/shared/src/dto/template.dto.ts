import { z } from "zod";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ─── Difficulty enum matching Prisma's DifficultyLevel ─────────────────────────
// NOTE: Matches Prisma enum values exactly: EASY | MEDIUM | HARD
export enum TemplateDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  templateKey: z.string().min(1).optional(),
  conceptKey: z.string().min(1).optional(),
  questionType: z.string().min(1).optional(),
  structure: z.record(z.unknown()).optional(),
  difficulty: z
    .nativeEnum(TemplateDifficulty)
    .default(TemplateDifficulty.MEDIUM),
  config: z.record(z.unknown()).optional(),
  isSystem: z.boolean().default(false),
  variableSchema: z.record(z.unknown()).optional(),
  solutionSchema: z.record(z.unknown()).optional(),
  constraints: z.record(z.unknown()).optional(),
  generationStrategy: z.enum(["VARIABLE", "DATASET", "HYBRID"]).default("VARIABLE"),
  datasetGenerationMode: z.enum(["DIRECT", "AI"]).optional(),
});

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  templateKey: z.string().min(1).optional(),
  conceptKey: z.string().min(1).optional(),
  questionType: z.string().min(1).optional(),
  structure: z.record(z.unknown()).optional(),
  difficulty: z.nativeEnum(TemplateDifficulty).optional(),
  config: z.record(z.unknown()).optional(),
  variableSchema: z.record(z.unknown()).optional(),
  solutionSchema: z.record(z.unknown()).optional(),
  constraints: z.record(z.unknown()).optional(),
  generationStrategy: z.enum(["VARIABLE", "DATASET", "HYBRID"]).optional(),
  datasetGenerationMode: z.enum(["DIRECT", "AI"]).optional(),
  isActive: z.boolean().optional(),
});

// ─── DTO Classes ───────────────────────────────────────────────────────────────

export class CreateTemplateDto {
  @ApiProperty({
    example: "Senior Backend Engineer",
    description: "Template name",
  })
  name!: string;

  @ApiPropertyOptional({
    example: "A template for senior backend roles",
    description: "Template description",
  })
  description?: string;

  @ApiPropertyOptional({
    enum: TemplateDifficulty,
    example: TemplateDifficulty.MEDIUM,
    description: "Difficulty level: EASY | MEDIUM | HARD",
  })
  difficulty?: TemplateDifficulty;

  @ApiProperty({
    example: { topics: ["data-structures", "system-design"], timeLimit: 3600 },
    description: "Template configuration object (JSON)",
  })
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: "react_hooks",
    description: "Concept Key",
  })
  conceptKey?: string;

  @ApiPropertyOptional({
    example: "demo-template-key",
    description: "Template Key",
  })
  templateKey?: string;

  @ApiPropertyOptional({
    example: "coding",
    description: "Question Type",
  })
  questionType?: string;

  @ApiPropertyOptional({
    example: { prompt: "..." },
    description: "Structure",
  })
  structure?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: false,
    description: "Whether this is a system-managed template",
  })
  isSystem?: boolean;

  @ApiPropertyOptional({
    example: { variables: [{ name: "price", type: "number", min: 100, max: 200 }] },
    description: "Variables schema configuration",
  })
  variableSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { correctVariable: "C", explanationTemplate: "The total is {{price}} + {{tax}} = {{price + tax}}." },
    description: "Solution schema configuration",
  })
  solutionSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: {},
    description: "Constraints configuration",
  })
  constraints?: Record<string, unknown>;

  @ApiPropertyOptional({
    enum: ["VARIABLE", "DATASET", "HYBRID"],
    example: "VARIABLE",
    description: "Template generation strategy",
  })
  generationStrategy?: "VARIABLE" | "DATASET" | "HYBRID";

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateTemplateDto> {
    return CreateTemplateSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateTemplateDto>;
  }
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    example: "Mid-Level Backend Engineer",
    description: "Updated template name",
  })
  name?: string;

  @ApiPropertyOptional({
    example: "Updated description for mid-level roles",
    description: "Updated description",
  })
  description?: string;

  @ApiPropertyOptional({
    enum: TemplateDifficulty,
    example: TemplateDifficulty.HARD,
    description: "Updated difficulty level: EASY | MEDIUM | HARD",
  })
  difficulty?: TemplateDifficulty;

  @ApiPropertyOptional({
    example: { topics: ["algorithms"], timeLimit: 1800 },
    description: "Updated configuration object (JSON)",
  })
  config?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: "react_hooks",
    description: "Concept Key",
  })
  conceptKey?: string;

  @ApiPropertyOptional({
    example: "demo-template-key",
    description: "Template Key",
  })
  templateKey?: string;

  @ApiPropertyOptional({
    example: "coding",
    description: "Question Type",
  })
  questionType?: string;

  @ApiPropertyOptional({
    example: { prompt: "..." },
    description: "Structure",
  })
  structure?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { variables: [{ name: "price", type: "number", min: 100, max: 200 }] },
    description: "Variables schema configuration",
  })
  variableSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { correctVariable: "C", explanationTemplate: "The total is {{price}} + {{tax}} = {{price + tax}}." },
    description: "Solution schema configuration",
  })
  solutionSchema?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: {},
    description: "Constraints configuration",
  })
  constraints?: Record<string, unknown>;

  @ApiPropertyOptional({
    enum: ["VARIABLE", "DATASET", "HYBRID"],
    example: "VARIABLE",
    description: "Template generation strategy",
  })
  generationStrategy?: "VARIABLE" | "DATASET" | "HYBRID";

  @ApiPropertyOptional({
    enum: ["DIRECT", "AI"],
    example: "AI",
    description: "Dataset generation mode: DIRECT | AI",
  })
  datasetGenerationMode?: "DIRECT" | "AI";

  @ApiPropertyOptional({
    example: true,
    description: "Template active status",
  })
  isActive?: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateTemplateDto> {
    return UpdateTemplateSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateTemplateDto>;
  }
}

export class TemplateVersionDto {
  @ApiProperty({ example: "cmbk1xyz0000abc123", description: "Template ID" })
  id!: string;

  @ApiProperty({
    example: "2026-06-04T10:00:00.000Z",
    description:
      "ISO timestamp of last update — used as optimistic version token",
  })
  version!: string;

  @ApiProperty({
    example: "Senior Backend Engineer",
    description: "Template name",
  })
  name!: string;
}

// ─── Template Dataset Config DTOs ──────────────────────────────────────────────────

export const TemplateDatasetConfigSchema = z.object({
  datasetId: z.string().min(1, "Dataset ID is required"),
  selectionMethod: z.string().default("RANDOM"),
  difficultyOverride: z.string().optional().nullable(),
  topicOverride: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  variableMapping: z.record(z.string(), z.string()).default({}),
  sampleSize: z.number().int().default(1),
  shuffle: z.boolean().default(true),
  allowReuse: z.boolean().default(true),
  specificItemId: z.string().optional().nullable(),
  fallbackPolicy: z.string().default("RELAX_FILTERS"),
});

export const UpdateTemplateDatasetConfigSchema = TemplateDatasetConfigSchema.partial();

export class UpdateTemplateDatasetConfigDto {
  @ApiProperty({
    example: "dataset-cuid-123",
    description: "ID of the dataset to pull from",
  })
  datasetId!: string;

  @ApiPropertyOptional({
    example: "RANDOM",
    description: "Method to select items: RANDOM | SEQUENTIAL | SPECIFIC",
  })
  selectionMethod?: string;

  @ApiPropertyOptional({
    example: "MEDIUM",
    description: "Optional difficulty level to override",
  })
  difficultyOverride?: string;

  @ApiPropertyOptional({
    example: "array-traversal",
    description: "Optional topic key to override",
  })
  topicOverride?: string;

  @ApiPropertyOptional({
    example: ["binary-tree", "dfs"],
    description: "Optional tag filters",
  })
  tags?: string[];

  @ApiPropertyOptional({
    example: { company_name: "companyName" },
    description: "Map template variables to dataset metadata fields",
  })
  variableMapping?: Record<string, string>;

  @ApiPropertyOptional({
    example: 1,
    description: "Number of records to select",
  })
  sampleSize?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Whether to shuffle records",
  })
  shuffle?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: "Whether to allow record reuse",
  })
  allowReuse?: boolean;

  @ApiPropertyOptional({
    example: "dataset-item-id-123",
    description: "Select a specific record ID",
  })
  specificItemId?: string;

  @ApiPropertyOptional({
    example: "RELAX_FILTERS",
    description: "Fallback strategy when no records match filters",
  })
  fallbackPolicy?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateTemplateDatasetConfigDto> {
    return UpdateTemplateDatasetConfigSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateTemplateDatasetConfigDto>;
  }
}

// ─── Template Prompt Config DTOs ───────────────────────────────────────────────────

export const TemplatePromptConfigSchema = z.object({
  systemPrompt: z.string().min(1, "System prompt is required"),
  userPrompt: z.string().min(1, "User prompt is required"),
  instructions: z.string().min(1, "Instructions are required"),
  outputRules: z.string().optional().nullable(),
});

export const UpdateTemplatePromptConfigSchema = TemplatePromptConfigSchema.partial();

export class UpdateTemplatePromptConfigDto {
  @ApiProperty({
    example: "You are an AI assistant that generates reading comprehension questions.",
    description: "System instructions for the LLM",
  })
  systemPrompt!: string;

  @ApiProperty({
    example: "Based on the passage: {{content}}, generate a question.",
    description: "User template prompt for the LLM",
  })
  userPrompt!: string;

  @ApiProperty({
    example: "Ensure output is a valid JSON with options and correct answer.",
    description: "Specific task instructions for the LLM",
  })
  instructions!: string;

  @ApiPropertyOptional({
    example: "Return format must be exactly matching the schema.",
    description: "Additional output constraints",
  })
  outputRules?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateTemplatePromptConfigDto> {
    return UpdateTemplatePromptConfigSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateTemplatePromptConfigDto>;
  }
}

