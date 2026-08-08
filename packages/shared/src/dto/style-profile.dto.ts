import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CreateStyleProfile,
  UpdateStyleProfile,
  StyleCharacteristic,
  StyleProfileSchema,
  LanguageStyle,
  ContextStyle,
  WordingDifficulty,
  DistractorRules,
  ExplanationStyle,
} from "@intervu-ai/contracts";
import { z } from "zod";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsEnum,
} from "class-validator";

export class CreateStyleProfileDto implements CreateStyleProfile {
  @ApiProperty({ example: "Campus Placement Profile", maxLength: 150 })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: "Standard assessment style for entry-level developers",
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    example: "campus",
    enum: ["campus", "lateral", "executive", "certification"],
  })
  @IsString()
  @IsOptional()
  profileType?: "campus" | "lateral" | "executive" | "certification";

  @ApiPropertyOptional({
    example: [
      { name: "questionLength", value: "short" },
      { name: "complexity", value: "low" },
    ],
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        value: { type: "object" },
      },
    },
  })
  @IsOptional()
  characteristics?: StyleCharacteristic[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ example: "ACTIVE", enum: ["ACTIVE", "INACTIVE"] })
  @IsEnum(["ACTIVE", "INACTIVE"])
  @IsOptional()
  status?: "ACTIVE" | "INACTIVE";

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: {
      language: "English",
      sentenceLength: "medium",
      vocabularyLevel: "intermediate",
      grammarStyle: "formal",
    },
  })
  @IsObject()
  @IsOptional()
  languageStyle?: Partial<LanguageStyle>;

  @ApiPropertyOptional({
    example: {
      preferredContexts: ["Shopping", "Daily Life"],
    },
  })
  @IsObject()
  @IsOptional()
  contextStyle?: Partial<ContextStyle>;

  @ApiPropertyOptional({
    example: {
      easy: ["Short", "Direct", "Single-step"],
      medium: ["Moderate wording", "Two-step reasoning"],
      hard: ["Interpretive context", "Multi-step reasoning"],
    },
  })
  @IsObject()
  @IsOptional()
  difficultyStyle?: Partial<WordingDifficulty>;

  @ApiPropertyOptional({
    example: {
      exactlyFourOptions: true,
      oneCorrectAnswer: true,
      plausibleIncorrectOptions: true,
      avoidObviouslyWrongOptions: true,
      avoidHumorousOptions: true,
      representCommonStudentMistakes: true,
    },
  })
  @IsObject()
  @IsOptional()
  distractorRules?: Partial<DistractorRules>;

  @ApiPropertyOptional({
    example: {
      formulaFirst: true,
      stepWiseSolution: true,
      maxSteps: 5,
      explanationLength: "medium",
      highlightFinalAnswer: true,
    },
  })
  @IsObject()
  @IsOptional()
  explanationStyle?: Partial<ExplanationStyle>;

  @ApiPropertyOptional({
    example: "Keep instructions simple. Always output JSON.",
  })
  @IsString()
  @IsOptional()
  aiInstructions?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateStyleProfileDto> {
    return StyleProfileSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateStyleProfileDto>;
  }
}

export class UpdateStyleProfileDto implements UpdateStyleProfile {
  @ApiPropertyOptional({ example: "Experienced Hiring Profile" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "Updated description for lateral hiring" })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    example: "lateral",
    enum: ["campus", "lateral", "executive", "certification"],
  })
  @IsString()
  @IsOptional()
  profileType?: "campus" | "lateral" | "executive" | "certification";

  @ApiPropertyOptional({
    example: [
      { name: "questionLength", value: "long" },
      { name: "complexity", value: "high" },
    ],
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        value: { type: "object" },
      },
    },
  })
  @IsOptional()
  characteristics?: StyleCharacteristic[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ example: "ACTIVE", enum: ["ACTIVE", "INACTIVE"] })
  @IsEnum(["ACTIVE", "INACTIVE"])
  @IsOptional()
  status?: "ACTIVE" | "INACTIVE";

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: {
      language: "English",
      sentenceLength: "medium",
      vocabularyLevel: "intermediate",
      grammarStyle: "formal",
    },
  })
  @IsObject()
  @IsOptional()
  languageStyle?: Partial<LanguageStyle>;

  @ApiPropertyOptional({
    example: {
      preferredContexts: ["Shopping", "Daily Life"],
    },
  })
  @IsObject()
  @IsOptional()
  contextStyle?: Partial<ContextStyle>;

  @ApiPropertyOptional({
    example: {
      easy: ["Short", "Direct", "Single-step"],
      medium: ["Moderate wording", "Two-step reasoning"],
      hard: ["Interpretive context", "Multi-step reasoning"],
    },
  })
  @IsObject()
  @IsOptional()
  difficultyStyle?: Partial<WordingDifficulty>;

  @ApiPropertyOptional({
    example: {
      exactlyFourOptions: true,
      oneCorrectAnswer: true,
      plausibleIncorrectOptions: true,
      avoidObviouslyWrongOptions: true,
      avoidHumorousOptions: true,
      representCommonStudentMistakes: true,
    },
  })
  @IsObject()
  @IsOptional()
  distractorRules?: Partial<DistractorRules>;

  @ApiPropertyOptional({
    example: {
      formulaFirst: true,
      stepWiseSolution: true,
      maxSteps: 5,
      explanationLength: "medium",
      highlightFinalAnswer: true,
    },
  })
  @IsObject()
  @IsOptional()
  explanationStyle?: Partial<ExplanationStyle>;

  @ApiPropertyOptional({ example: "Keep instructions simple." })
  @IsString()
  @IsOptional()
  aiInstructions?: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateStyleProfileDto> {
    return StyleProfileSchema.partial().safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateStyleProfileDto>;
  }
}
