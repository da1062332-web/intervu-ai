import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { QuestionStatus } from "@prisma/client";

export class CreateQuestionDto {
  @ApiProperty({ example: "What is the capital of France?" })
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @ApiProperty({ example: "Paris" })
  @IsString()
  @IsNotEmpty()
  answer!: string;

  @ApiProperty({
    example:
      "Paris has been the capital of France since the French Revolution.",
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ example: "topic-123" })
  @IsString()
  @IsNotEmpty()
  topicId!: string;

  @ApiProperty({ example: "section-123" })
  @IsString()
  @IsNotEmpty()
  sectionId!: string;

  @ApiProperty({ example: "MEDIUM" })
  @IsString()
  @IsNotEmpty()
  @IsIn(["EASY", "MEDIUM", "HARD"])
  difficulty!: string;

  @ApiProperty({ example: "MANUAL", required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: "template-123", required: false })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    example: ["London", "Paris", "Berlin", "Madrid"],
    required: false,
  })
  @IsArray()
  @IsOptional()
  options?: string[];
}

export class UpdateQuestionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsIn(["EASY", "MEDIUM", "HARD"])
  difficulty?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;
}

export class BulkUploadDto {
  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}

export class SearchFiltersDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsIn(["EASY", "MEDIUM", "HARD"])
  difficulty?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ required: false, default: "createdAt" })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false, default: "desc" })
  @IsString()
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}

export class CheckDuplicateDto {
  @ApiProperty({ example: "What is 2 + 2?" })
  @IsString()
  @IsNotEmpty()
  questionText!: string;

  @ApiProperty({ example: "topic-123" })
  @IsString()
  @IsNotEmpty()
  topicId!: string;

  @ApiProperty({ example: "section-123" })
  @IsString()
  @IsNotEmpty()
  sectionId!: string;
}

export class ApproveRejectDto {
  @ApiProperty({
    example: "This question option has minor typos",
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
