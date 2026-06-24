import { z } from "zod";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

export const CreateSolutionTemplateSchema = z.object({
  solutionTemplate: z.string().min(1),
  explanationTemplate: z.string().optional(),
});

export const UpdateSolutionTemplateSchema = z.object({
  solutionTemplate: z.string().min(1).optional(),
  explanationTemplate: z.string().optional(),
});

export const GenerateTemplatePreviewSchema = z.object({
  previewPayload: z.record(z.unknown()),
  solutionTemplate: z.string().optional(),
  explanationTemplate: z.string().optional(),
});

// ─── DTO Classes ───────────────────────────────────────────────────────────────

export class CreateSolutionTemplateRequest {
  @ApiProperty({
    example: "The answer is {{answer}}",
    description: "Solution template with placeholders",
  })
  solutionTemplate!: string;

  @ApiPropertyOptional({
    example: "Because {{explanation}}",
    description: "Explanation template with placeholders",
  })
  explanationTemplate?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateSolutionTemplateRequest> {
    return CreateSolutionTemplateSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<
      unknown,
      CreateSolutionTemplateRequest
    >;
  }
}

export class UpdateSolutionTemplateRequest {
  @ApiPropertyOptional({
    example: "The correct answer is {{answer}}",
    description: "Updated solution template",
  })
  solutionTemplate?: string;

  @ApiPropertyOptional({
    example: "Explanation: {{explanation}}",
    description: "Updated explanation template",
  })
  explanationTemplate?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateSolutionTemplateRequest> {
    return UpdateSolutionTemplateSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<
      unknown,
      UpdateSolutionTemplateRequest
    >;
  }
}

export class GenerateTemplatePreviewRequest {
  @ApiProperty({
    example: { answer: "42", explanation: "derived from formula" },
    description: "Payload to fill the template variables",
  })
  previewPayload!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: "Optional solution template override to preview without saving",
    description: "Solution template override",
  })
  solutionTemplate?: string;

  @ApiPropertyOptional({
    example: "Optional explanation template override",
    description: "Explanation template override",
  })
  explanationTemplate?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, GenerateTemplatePreviewRequest> {
    return GenerateTemplatePreviewSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<
      unknown,
      GenerateTemplatePreviewRequest
    >;
  }
}

export class SolutionTemplateResponse {
  @ApiProperty({
    example: "uuid-id",
    description: "ID of the solution template",
  })
  id!: string;

  @ApiProperty({ example: "template-uuid-id", description: "Template ID" })
  templateId!: string;

  @ApiProperty({
    example: "Answer: {{answer}}",
    description: "Solution template string",
  })
  solutionTemplate!: string;

  @ApiPropertyOptional({
    example: "Explanation: {{explanation}}",
    description: "Explanation template string",
  })
  explanationTemplate?: string | null;

  @ApiProperty({
    example: "2026-06-21T10:00:00.000Z",
    description: "Created at",
  })
  createdAt!: Date;

  @ApiProperty({
    example: "2026-06-21T10:00:00.000Z",
    description: "Updated at",
  })
  updatedAt!: Date;
}

export class TemplatePreviewResponse {
  @ApiProperty({
    example: "uuid-id",
    description: "ID of the template preview",
  })
  id!: string;

  @ApiProperty({ example: "template-uuid-id", description: "Template ID" })
  templateId!: string;

  @ApiProperty({
    example: { answer: "42" },
    description: "Preview payload used",
  })
  previewPayload!: Record<string, unknown>;

  @ApiProperty({
    example: {
      solution: "Answer: 42",
      resolvedVariables: { answer: "42" },
      validation: { valid: true },
    },
    description: "Rendered output",
  })
  previewResult!: {
    solution: string;
    explanation: string | null;
    resolvedVariables: Record<string, unknown>;
    validation: {
      valid: boolean;
      unknownVariables?: string[];
    };
  };

  @ApiProperty({
    example: "2026-06-21T10:00:00.000Z",
    description: "Created at",
  })
  createdAt!: Date;

  @ApiProperty({
    example: "2026-06-21T10:00:00.000Z",
    description: "Updated at",
  })
  updatedAt!: Date;
}
