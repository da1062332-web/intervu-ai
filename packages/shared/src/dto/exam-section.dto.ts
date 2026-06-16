import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateExamSection, UpdateExamSection } from "@intervu-ai/contracts";
import {
  CreateExamSectionSchema,
  UpdateExamSectionSchema,
} from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateExamSectionDto implements CreateExamSection {
  @ApiProperty({ example: "Quantitative Aptitude", maxLength: 100 })
  name!: string;

  @ApiProperty({ example: 10, minimum: 1 })
  questionCount!: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, nullable: true })
  durationMinutes?: number | null;

  @ApiProperty({ example: 1, minimum: 1 })
  displayOrder!: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateExamSectionDto> {
    return CreateExamSectionSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateExamSectionDto>;
  }
}

export class UpdateExamSectionDto implements UpdateExamSection {
  @ApiPropertyOptional({ example: "Logical Reasoning" })
  name?: string;

  @ApiPropertyOptional({ example: 15 })
  questionCount?: number;

  @ApiPropertyOptional({ example: 25, nullable: true })
  durationMinutes?: number | null;

  @ApiPropertyOptional({ example: 2 })
  displayOrder?: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateExamSectionDto> {
    return UpdateExamSectionSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateExamSectionDto>;
  }
}
