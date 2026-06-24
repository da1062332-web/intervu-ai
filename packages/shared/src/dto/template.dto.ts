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
