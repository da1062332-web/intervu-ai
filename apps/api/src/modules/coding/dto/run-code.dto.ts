import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RunCodeDto {
  @ApiProperty({ description: "Question ID for the coding challenge" })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional({ description: "Optional test instance ID for candidate session ownership verification" })
  @IsString()
  @IsOptional()
  testInstanceId?: string;

  @ApiProperty({ description: "Candidate code to execute" })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: "Programming language (e.g., python, java, cpp, javascript, typescript, go, rust, csharp)" })
  @IsString()
  @IsNotEmpty()
  language!: string;
}

export type PublicTestStatus =
  | "PASSED"
  | "FAILED"
  | "TIME_LIMIT_EXCEEDED"
  | "COMPILATION_ERROR"
  | "ERROR";

export interface PublicTestResultDto {
  testIndex: number;
  status: PublicTestStatus;
  input: any;
  expectedOutput: any;
  actualOutput: string | null;
  runtimeSeconds: number | null;
  memoryKb: number | null;
  error: string | null;
}

export interface RunCodeResponseDto {
  success: boolean;
  questionId: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  results: PublicTestResultDto[];
}
