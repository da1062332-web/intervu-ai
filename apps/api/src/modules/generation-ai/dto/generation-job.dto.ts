import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateGenerationJobDto {
  @ApiProperty({ example: "Percentages" })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  count!: number;

  @ApiProperty({ example: "Quantitative Aptitude", required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: "Medium", required: false })
  @IsString()
  @IsOptional()
  difficulty?: string;
}

export class TopicExpandDto {
  @ApiProperty({ example: "Percentages" })
  @IsString()
  @IsNotEmpty()
  topic!: string;
}

export class GenerationDashboardDto {
  @ApiProperty({ example: 15 })
  jobsCompleted!: number;

  @ApiProperty({ example: 150 })
  questionsGenerated!: number;

  @ApiProperty({ example: 87.5 })
  averageQuality!: number;

  @ApiProperty({ example: 5.2 })
  failureRate!: number;

  @ApiProperty({ example: 8 })
  reviewQueueSize!: number;
}
