import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class DifficultyDistributionDto {
  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  EASY?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  MEDIUM?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  HARD?: number;
}

export class AssemblyProviderRequestDto {
  @ApiProperty({ example: "exam-cuid" })
  @IsString()
  @IsNotEmpty()
  examId!: string;

  @ApiProperty({ example: "section-cuid" })
  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(1)
  count!: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DifficultyDistributionDto)
  difficultyDistribution!: DifficultyDistributionDto;

  @ApiProperty({ example: ["topic-cuid-1"], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  topicIds?: string[];
}

export class ReleaseReservationsDto {
  @ApiProperty({ example: "assembly-cuid" })
  @IsString()
  @IsNotEmpty()
  assemblyId!: string;
}
