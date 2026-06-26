import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class BulkReviewDto {
  @ApiProperty({
    example: ["q-1", "q-2"],
    description: "List of question IDs to analyze",
  })
  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];
}

export class ReviewQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ required: false, description: "Filter by status" })
  @IsOptional()
  @IsString()
  status?: string;
}

export class QuestionReviewResultDto {
  @ApiProperty()
  score!: number;

  @ApiProperty()
  recommendation!: string;

  @ApiProperty()
  issues!: string[];
}
