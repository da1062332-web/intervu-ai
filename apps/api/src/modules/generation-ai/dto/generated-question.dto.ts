import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject } from "class-validator";

export class GeneratedQuestionDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsString()
  @IsNotEmpty()
  explanation!: string;

  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
