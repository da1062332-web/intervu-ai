import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitCodeDto {
  @ApiProperty({ description: "Question ID for the coding challenge" })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({ description: "Optional test instance ID for candidate session ownership verification" })
  @IsString()
  @IsOptional()
  testInstanceId?: string;

  @ApiProperty({ description: "Candidate source code to execute and submit" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: "Programming language (e.g., python, java, cpp, javascript, typescript)" })
  @IsString()
  @IsNotEmpty()
  language!: string;
}

export type CodingVerdict =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED";

export interface CategorySummary {
  total: number;
  passed: number;
  failed: number;
}

export interface SubmitCodeResponseDto {
  success: boolean;
  submissionId: string;
  status: "COMPLETED" | "ERROR";
  verdict: CodingVerdict;
  score: number; // 0 to 100
  summary: {
    total: number;
    passed: number;
    failed: number;
    categories: {
      public: CategorySummary;
      hidden: CategorySummary;
      boundary: CategorySummary;
      stress: CategorySummary;
    };
  };
  executionTime: number;
  memory: number;
  errorMessage?: string | null;
}
