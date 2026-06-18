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

  @ApiProperty({ example: "APTITUDE", maxLength: 100 })
  code!: string;

  @ApiProperty({ example: 10, minimum: 1 })
  questionCount!: number;

  @ApiProperty({ example: 20, minimum: 1 })
  sectionDurationMinutes!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  sectionOrder!: number;

  @ApiProperty({ example: true, default: true })
  isRequired!: boolean;

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

  @ApiPropertyOptional({ example: "LOGICAL_REASONING" })
  code?: string;

  @ApiPropertyOptional({ example: 15 })
  questionCount?: number;

  @ApiPropertyOptional({ example: 25 })
  sectionDurationMinutes?: number;

  @ApiPropertyOptional({ example: 2 })
  sectionOrder?: number;

  @ApiPropertyOptional({ example: true })
  isRequired?: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateExamSectionDto> {
    return UpdateExamSectionSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateExamSectionDto>;
  }
}

import { IsString, IsNotEmpty } from "class-validator";
import { CreateSectionTopicRequest } from "@intervu-ai/contracts";

export class CreateSectionTopicDto implements CreateSectionTopicRequest {
  @ApiProperty({ description: "The UUID of the topic to map", example: "se-ds-001" })
  @IsString()
  @IsNotEmpty()
  topicId!: string;
}
