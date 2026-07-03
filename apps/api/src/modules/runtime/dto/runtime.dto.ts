import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class RuntimeQuestionDto {
  @IsString()
  questionId!: string;

  @IsString()
  questionType!: string;

  @IsString()
  questionText!: string;

  @IsArray()
  @IsOptional()
  options?: any[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RuntimeSectionDto {
  @IsString()
  sectionId!: string;

  @IsString()
  title!: string;

  @IsNumber()
  duration!: number;

  @IsNumber()
  questionCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuntimeQuestionDto)
  @IsOptional()
  questions?: RuntimeQuestionDto[];
}

export class RuntimeTestDto {
  @IsString()
  testId!: string;

  @IsString()
  title!: string;

  @IsNumber()
  duration!: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuntimeSectionDto)
  sections!: RuntimeSectionDto[];
}

export class RuntimeValidationResultDto {
  @IsBoolean()
  valid!: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];
}
