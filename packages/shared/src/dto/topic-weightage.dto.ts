import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, Min, Max } from "class-validator";
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
    description: "Weightage percentage (0 to 100)",
    example: 40,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weightagePercentage!: number;
}

export class UpdateTopicWeightageDto implements UpdateTopicWeightageRequest {
  @ApiProperty({
    description: "Weightage percentage (0 to 100)",
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  weightagePercentage!: number;
}
