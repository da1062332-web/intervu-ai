import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateExamConfig, UpdateExamConfig } from "@intervu-ai/contracts";
import {
  CreateExamConfigSchema,
  UpdateExamConfigSchema,
} from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateExamConfigDto implements CreateExamConfig {
  @ApiProperty({ example: "Software Engineer Screening", maxLength: 150 })
  name!: string;

  @ApiProperty({ example: "SWE_SCREENING", maxLength: 100 })
  code!: string;

  @ApiProperty({ example: "Software Engineer", maxLength: 100 })
  role!: string;

  @ApiPropertyOptional({ example: "Standard configuration for screening software engineering candidates" })
  description?: string | null;

  @ApiProperty({ example: 60, minimum: 1 })
  durationMinutes!: number;

  @ApiProperty({ example: 30, minimum: 1 })
  totalQuestions!: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateExamConfigDto> {
    return CreateExamConfigSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateExamConfigDto>;
  }
}

export class UpdateExamConfigDto implements UpdateExamConfig {
  @ApiPropertyOptional({ example: "Senior Software Engineer Screening" })
  name?: string;

  @ApiPropertyOptional({ example: "SENIOR_SWE_SCREENING" })
  code?: string;

  @ApiPropertyOptional({ example: "Senior Software Engineer" })
  role?: string;

  @ApiPropertyOptional({ example: "Updated description" })
  description?: string | null;

  @ApiPropertyOptional({ example: 90 })
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 45 })
  totalQuestions?: number;

  @ApiPropertyOptional({ enum: ["DRAFT", "ACTIVE", "ARCHIVED"], example: "ACTIVE" })
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";

  @ApiPropertyOptional({ example: false })
  isArchived?: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateExamConfigDto> {
    return UpdateExamConfigSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateExamConfigDto>;
  }
}
