import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from "class-validator";

/**
 * Shared request DTO for all three question-generation endpoints.
 * Generate, Preview, and Validate all accept the same shape —
 * only backend behavior differs.
 */
export class QuestionGenerationRequestDto {
  @ApiProperty({
    description: "ID of the template to generate a question from",
    example: "cmbk1xyz0000abc123",
  })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiPropertyOptional({
    description:
      "Optional context overrides (e.g., force specific variables for preview)",
    example: { variables: { x: 42, y: 10 } },
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Generation options (e.g., difficulty override)",
    example: { difficulty: "HARD" },
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;
}

/**
 * Validate endpoint additionally accepts an existing question object to validate.
 */
export class ValidateQuestionRequestDto extends QuestionGenerationRequestDto {
  @ApiPropertyOptional({
    description: "The question object to validate (if already generated)",
    example: {
      questionText: "What is 2+2?",
      options: ["A. 3", "B. 4", "C. 5", "D. 6"],
      correctAnswer: "B",
      explanation: "2+2=4",
    },
  })
  @IsObject()
  @IsOptional()
  question?: Record<string, unknown>;
}

/**
 * Batch endpoint additionally accepts a count of questions to generate.
 */
export class BatchGenerationRequestDto extends QuestionGenerationRequestDto {
  @ApiProperty({
    description: "Number of questions to generate in this batch",
    example: 10,
  })
  count!: number;
}
