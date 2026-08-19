import { IsEnum, IsInt, IsObject, IsOptional, IsString, IsBoolean } from "class-validator";
import { DifficultyLevel } from "@prisma/client";

export class PreviewCodingPatternDto {
  @IsString()
  @IsOptional()
  patternId?: string;

  @IsString()
  @IsOptional()
  oracleKey?: string;

  @IsObject()
  @IsOptional()
  parameterSchema?: Record<string, any>;

  @IsObject()
  @IsOptional()
  constraintSchema?: Record<string, any>;

  @IsInt()
  @IsOptional()
  seed?: number;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @IsBoolean()
  @IsOptional()
  generateStatement?: boolean;

  @IsBoolean()
  @IsOptional()
  forceRegenerate?: boolean;
}
