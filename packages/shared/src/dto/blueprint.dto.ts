import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CreateBlueprint,
  UpdateBlueprint,
  BlueprintSection,
  ExamBlueprintSchema,
} from "@intervu-ai/contracts";
import { z } from "zod";

export class CreateBlueprintDto implements CreateBlueprint {
  @ApiProperty({ example: "cuid-exam-config-123" })
  configId!: string;

  @ApiProperty({ example: "uuid-style-profile-456" })
  styleProfileId!: string;

  @ApiProperty({
    example: [
      {
        sectionId: "sec-tech-1",
        questionCount: 15,
        topicAllocations: [
          { topicId: "se-ds-001", percentage: 60 },
          { topicId: "se-algo-001", percentage: 40 },
        ],
        difficultyAllocation: {
          easy: 30,
          medium: 50,
          hard: 20,
        },
        templateTypes: ["mcq", "coding"],
      },
    ],
    type: "array",
    items: {
      type: "object",
      properties: {
        sectionId: { type: "string" },
        questionCount: { type: "number" },
        topicAllocations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              topicId: { type: "string" },
              percentage: { type: "number" },
            },
          },
        },
        difficultyAllocation: {
          type: "object",
          properties: {
            easy: { type: "number" },
            medium: { type: "number" },
            hard: { type: "number" },
          },
        },
        templateTypes: { type: "array", items: { type: "string" } },
      },
    },
  })
  sections!: BlueprintSection[];

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateBlueprintDto> {
    return ExamBlueprintSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, CreateBlueprintDto>;
  }
}

export class UpdateBlueprintDto implements UpdateBlueprint {
  @ApiPropertyOptional({ example: "uuid-style-profile-456" })
  styleProfileId?: string;

  @ApiPropertyOptional({
    example: [
      {
        sectionId: "sec-tech-1",
        questionCount: 20,
        topicAllocations: [
          { topicId: "se-ds-001", percentage: 50 },
          { topicId: "se-algo-001", percentage: 50 },
        ],
        difficultyAllocation: {
          easy: 20,
          medium: 60,
          hard: 20,
        },
        templateTypes: ["mcq", "coding"],
      },
    ],
    type: "array",
    items: {
      type: "object",
      properties: {
        sectionId: { type: "string" },
        questionCount: { type: "number" },
        topicAllocations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              topicId: { type: "string" },
              percentage: { type: "number" },
            },
          },
        },
        difficultyAllocation: {
          type: "object",
          properties: {
            easy: { type: "number" },
            medium: { type: "number" },
            hard: { type: "number" },
          },
        },
        templateTypes: { type: "array", items: { type: "string" } },
      },
    },
  })
  sections?: BlueprintSection[];

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateBlueprintDto> {
    return ExamBlueprintSchema.partial().safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateBlueprintDto>;
  }
}

export interface TopicAllocationDto {
  topicId: string;
  percentage: number;
}

export interface DifficultyDistributionDto {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

export interface BlueprintSectionDto {
  sectionKey: string;
  displayName: string;
  durationSeconds: number;
  questionCount: number;
  orderIndex: number;
  topicAllocations: TopicAllocationDto[];
  difficultyDistribution?: DifficultyDistributionDto;
}

export interface BlueprintDto {
  testConfigId: string;
  totalQuestions: number;
  totalDurationSeconds: number;
  difficultyDistribution?: DifficultyDistributionDto;
  sections: BlueprintSectionDto[];
}
