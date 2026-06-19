import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CreateBlueprintConfigDtoType,
  UpdateBlueprintConfigDtoType,
  AddTopicConfigDtoType,
} from "@intervu-ai/contracts";

export class CreateBlueprintConfigDto implements CreateBlueprintConfigDtoType {
  @ApiProperty({ example: "Full Stack Developer L1" })
  name!: string;

  @ApiProperty({ example: "FSD_L1_001" })
  code!: string;

  @ApiPropertyOptional({ example: "Standard blueprint for entry-level FSD." })
  description?: string;

  @ApiProperty({ example: 40 })
  totalQuestions!: number;

  @ApiProperty({ example: 90 })
  totalDurationMinutes!: number;

  @ApiPropertyOptional({ example: true, default: true })
  isActive!: boolean;
}

export class UpdateBlueprintConfigDto implements UpdateBlueprintConfigDtoType {
  @ApiPropertyOptional({ example: "Full Stack Developer L1" })
  name?: string;

  @ApiPropertyOptional({ example: "FSD_L1_001" })
  code?: string;

  @ApiPropertyOptional({ example: "Standard blueprint for entry-level FSD." })
  description?: string;

  @ApiPropertyOptional({ example: 40 })
  totalQuestions?: number;

  @ApiPropertyOptional({ example: 90 })
  totalDurationMinutes?: number;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}

export class AddTopicConfigDto implements AddTopicConfigDtoType {
  @ApiProperty({ example: "valid-section-uuid" })
  sectionId!: string;

  @ApiProperty({ example: "valid-topic-uuid" })
  topicId!: string;

  @ApiProperty({ example: 10 })
  questionCount!: number;

  @ApiProperty({ example: 25.0 })
  weightage!: number;

  @ApiProperty({ example: 3 })
  easyCount!: number;

  @ApiProperty({ example: 4 })
  mediumCount!: number;

  @ApiProperty({ example: 3 })
  hardCount!: number;
}
