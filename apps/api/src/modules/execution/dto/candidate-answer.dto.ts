import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CandidateAnswerDto {
  @ApiProperty({ description: "ID of the question" })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({ description: "The candidate's answer" })
  @IsString()
  @IsNotEmpty()
  answer!: string;
}
