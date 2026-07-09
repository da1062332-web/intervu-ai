import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject } from "class-validator";

export class CreateDatasetDto {
  @ApiProperty({ description: "Unique name of the dataset", example: "Vocabulary Synonym List" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "Detailed description of dataset content", example: "Terms and synonyms" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Dataset type", example: "VOCABULARY" })
  @IsString()
  @IsNotEmpty()
  type!: string;
}

export class UpdateDatasetDto {
  @ApiPropertyOptional({ description: "Name of the dataset" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Detailed description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Dataset type" })
  @IsString()
  @IsOptional()
  type?: string;
}

export class CreateDatasetItemDto {
  @ApiProperty({ description: "Passage, vocabulary word, or sentence content", example: "abundant" })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ description: "Difficulty level", example: "EASY" })
  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @ApiProperty({ description: "Associated topic", example: "synonyms" })
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @ApiProperty({ description: "Filter tags", example: ["english", "synonyms"] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiPropertyOptional({ description: "Additional metadata (e.g., synonyms, distractors)", example: { synonym: "plentiful" } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
