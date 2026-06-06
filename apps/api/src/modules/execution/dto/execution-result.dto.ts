import { ApiProperty } from "@nestjs/swagger";
import { CandidateAnswerDto } from "./candidate-answer.dto";

export class ExecutionResultDto {
  @ApiProperty({ description: "ID of the execution" })
  executionId!: string;

  @ApiProperty({ description: "ID of the test" })
  testId!: string;

  @ApiProperty({ description: "Status of the execution", example: "submitted" })
  status!: string;

  @ApiProperty({
    description: "List of submitted answers",
    type: [CandidateAnswerDto],
  })
  answers!: CandidateAnswerDto[];

  @ApiProperty({ description: "Date when the execution was submitted" })
  submittedAt!: Date;
}
