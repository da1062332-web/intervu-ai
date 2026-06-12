import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";
import { SubmitExecutionSchema } from "./execution.schema";

export class SubmitExecutionDto {
  @ApiProperty({ description: "ID of the test being executed" })
  testId!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, SubmitExecutionDto> {
    return SubmitExecutionSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, SubmitExecutionDto>;
  }
}
