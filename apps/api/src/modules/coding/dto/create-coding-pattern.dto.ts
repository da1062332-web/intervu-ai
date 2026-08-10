import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { CodingPatternStatus, DifficultyLevel } from "@prisma/client";

export class CreateCodingPatternDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @IsEnum(CodingPatternStatus)
  @IsOptional()
  status?: CodingPatternStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;

  @IsString()
  @IsNotEmpty()
  oracleKey!: string;

  @IsObject()
  @IsOptional()
  statementSpecification?: Record<string, any>;

  @IsObject()
  @IsOptional()
  parameterSchema?: Record<string, any>;

  @IsObject()
  @IsOptional()
  constraintSchema?: Record<string, any>;

  @IsObject()
  @IsOptional()
  aiConfiguration?: Record<string, any>;

  @IsObject()
  @IsOptional()
  starterCode?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
