import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
} from "class-validator";

export class CreateDatasetDto {
  @ApiProperty({
    description: "Unique name of the dataset",
    example: "Vocabulary Synonym List",
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: "Detailed description of dataset content",
    example: "Terms and synonyms",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Dataset type", example: "VOCABULARY" })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ description: "Associated topic ID" })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ description: "Associated concept ID" })
  @IsString()
  @IsOptional()
  conceptId?: string;
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

  @ApiPropertyOptional({ description: "Associated topic ID" })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ description: "Associated concept ID" })
  @IsString()
  @IsOptional()
  conceptId?: string;
}

export class CreateDatasetItemDto {
  @ApiPropertyOptional({ description: "Question text prompt" })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiProperty({
    description: "Passage, vocabulary word, or sentence content",
    example: "abundant",
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: "MCQ Options array", example: ["A", "B", "C", "D"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ description: "Correct Answer" })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({ description: "Explanation" })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ description: "Difficulty level", example: "EASY" })
  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @ApiPropertyOptional({ description: "Associated topic string", example: "synonyms" })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({ description: "Associated topic ID" })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ description: "Associated concept ID" })
  @IsString()
  @IsOptional()
  conceptId?: string;

  @ApiPropertyOptional({ description: "Filter tags", example: ["english", "synonyms"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: "Additional metadata (e.g., synonyms, distractors)",
    example: { synonym: "plentiful" },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDatasetItemDto {
  @ApiPropertyOptional({ description: "Question text prompt" })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiPropertyOptional({
    description: "Passage, vocabulary word, or sentence content",
    example: "abundant",
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: "MCQ Options array" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ description: "Correct Answer" })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({ description: "Explanation" })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ description: "Difficulty level", example: "EASY" })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({ description: "Associated topic string", example: "synonyms" })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({ description: "Associated topic ID" })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ description: "Associated concept ID" })
  @IsString()
  @IsOptional()
  conceptId?: string;

  @ApiPropertyOptional({ description: "Filter tags", example: ["english", "synonyms"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: "Additional metadata (e.g., synonyms, distractors)",
    example: { synonym: "plentiful" },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

