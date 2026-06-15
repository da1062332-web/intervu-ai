import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateExamConfig, UpdateExamConfig } from "@intervu-ai/contracts";
import { CreateExamConfigSchema, UpdateExamConfigSchema } from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateExamConfigDto implements CreateExamConfig {
  @ApiProperty({ example: "Software Engineer Screening", maxLength: 150 })
  name!: string;

  @ApiProperty({ example: "Software Engineer", maxLength: 100 })
  role!: string;

  @ApiProperty({ example: 60, minimum: 1 })
  durationMinutes!: number;

  @ApiProperty({ example: 30, minimum: 1 })
  totalQuestions!: number;

  static validate(data: unknown): z.SafeParseReturnType<unknown, CreateExamConfigDto> {
    return CreateExamConfigSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, CreateExamConfigDto>;
  }
}

export class UpdateExamConfigDto implements UpdateExamConfig {
  @ApiPropertyOptional({ example: "Senior Software Engineer Screening" })
  name?: string;

  @ApiPropertyOptional({ example: "Senior Software Engineer" })
  role?: string;

  @ApiPropertyOptional({ example: 90 })
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 45 })
  totalQuestions?: number;

  static validate(data: unknown): z.SafeParseReturnType<unknown, UpdateExamConfigDto> {
    return UpdateExamConfigSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, UpdateExamConfigDto>;
  }
}
