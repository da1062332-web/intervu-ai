import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";
import { CandidateAnswerSchema } from "./execution.schema";

export class CandidateAnswerDto {
  @ApiProperty({ description: "ID of the question" })
  questionId!: string;

  @ApiProperty({ description: "The candidate's answer" })
  answer!: string;
  
  @ApiProperty({ description: "Time spent on this question in seconds", required: false })
  timeSpentSeconds?: number;
  
  @ApiProperty({ description: "Whether the candidate marked this question for review", required: false })
  isMarkedForReview?: boolean;

  static validate(data: unknown): z.SafeParseReturnType<unknown, CandidateAnswerDto> {
    return CandidateAnswerSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, CandidateAnswerDto>;
  }
}
