import { ApiProperty } from "@nestjs/swagger";

export class SubmitExecutionResponseDto {
  @ApiProperty({ description: "Generated ID of the test execution" })
  executionId!: string;

  @ApiProperty({ description: "Status of the execution", example: "submitted" })
  status!: string;
}
