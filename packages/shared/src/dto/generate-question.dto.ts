import { GenerateQuestionRequestSchema } from "../schemas/ai.schema";
import { DifficultyLevel } from "../enums/difficulty.enum";
import { z } from "zod";
import { ApiProperty } from "@nestjs/swagger";

export class GenerateQuestionRequestDto {
  @ApiProperty({
    example: "JavaScript Closures",
    description: "The topic for the generated questions",
  })
  topic!: string;

  @ApiProperty({
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
    description: "Question difficulty level",
  })
  difficulty!: DifficultyLevel;

  @ApiProperty({ example: 5, description: "Number of questions to generate" })
  count!: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, GenerateQuestionRequestDto> {
    return GenerateQuestionRequestSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, GenerateQuestionRequestDto>;
  }
}
