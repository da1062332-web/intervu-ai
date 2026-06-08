import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import { CandidateAnswerDto } from "./candidate-answer.dto";

export class SubmitExecutionDto {
  @ApiProperty({ description: "ID of the test being executed" })
  @IsString()
  @IsNotEmpty()
  testId!: string;

  @ApiProperty({
    description: "List of answers for the test questions",
    type: [CandidateAnswerDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CandidateAnswerDto)
  answers!: CandidateAnswerDto[];
}
