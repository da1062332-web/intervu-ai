import { CreateTestRequestSchema } from "../schemas/api.schema";
import { z } from "zod";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTestRequestDto {
  @ApiProperty({
    example: "google",
    description: "Identifier of the target company",
  })
  companyId!: string;

  @ApiProperty({
    example: "backend",
    description: "Type of the test (e.g. backend, frontend)",
  })
  testType!: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, CreateTestRequestDto> {
    return CreateTestRequestSchema.safeParse(data);
  }
}
