import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsInt, Min, Max } from "class-validator";
import {
  CreateTopicWeightageRequest,
  UpdateTopicWeightageRequest,
} from "@intervu-ai/contracts";

export class CreateTopicWeightageDto implements CreateTopicWeightageRequest {
  @ApiProperty({
    description: "The ID of the topic (cuid)",
    example: "se-ds-001",
  })
  @IsString()
  @IsNotEmpty()
  topicId!: string;

  @ApiProperty({
    description: "Weightage percentage (1 to 100)",
    example: 40,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  weightagePercentage!: number;
}

export class UpdateTopicWeightageDto implements UpdateTopicWeightageRequest {
  @ApiProperty({
    description: "Weightage percentage (1 to 100)",
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  weightagePercentage!: number;
}
