import { ApiProperty } from "@nestjs/swagger";
import type {
  AvailableTestDto as IAvailableTestDto,
} from "@intervu-ai/contracts";

/**
 * Backend-only interface for the opaque Template.config JSON blob.
 * All fields are optional — the DB column has no enforced schema.
 */
export interface TemplateConfig {
  company?: string;
  /** Test duration in seconds */
  durationSeconds?: number;
  sections?: string[];
}

/**
 * Swagger-annotated DTO implementing the shared AvailableTestDto contract.
 * Used by GET /api/v1/tests/configs.
 */
export class AvailableConfigDto implements IAvailableTestDto {
  @ApiProperty({
    example: "clx1abc123",
    description: "Template ID — uniquely identifies an assessment config",
  })
  configId!: string;

  @ApiProperty({
    example: "Acme Corp",
    description:
      "Company from Template.config.company — empty string when not configured",
  })
  company!: string;

  @ApiProperty({ example: "Senior Frontend Engineer Interview" })
  name!: string;

  @ApiProperty({
    example: "MEDIUM",
    description: "Difficulty level from Template.difficulty enum",
  })
  difficulty!: string;

  @ApiProperty({
    example: 3600,
    description:
      "Test duration in seconds from Template.config.durationSeconds — 0 when not configured",
  })
  duration!: number;

  @ApiProperty({
    example: ["HTML & CSS", "JavaScript", "React"],
    type: [String],
    description:
      "Sections from Template.config.sections — empty array when not configured",
  })
  sections!: string[];
}

/**
 * Top-level response shape for GET /api/v1/tests/configs.
 * Wrapped in the standard { success, data, error, meta } envelope by ResponseInterceptor.
 */
export class TestConfigsResponseDto {
  @ApiProperty({ type: [AvailableConfigDto] })
  configs!: AvailableConfigDto[];
}
