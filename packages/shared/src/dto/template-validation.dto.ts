import { z } from "zod";
import { ApiProperty } from "@nestjs/swagger";

export const TemplateValidationRequestSchema = z.object({
  values: z.record(z.unknown()),
});

export const TemplateValidationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});

export class TemplateValidationRequestDto {
  @ApiProperty({
    example: { var1: "val1" },
    description:
      "Input values to validate against template variables and rules",
  })
  values!: Record<string, unknown>;

  static validate(data: unknown) {
    return TemplateValidationRequestSchema.safeParse(data);
  }
}

export class TemplateValidationResponseDto {
  @ApiProperty({ example: true, description: "Whether the validation passed" })
  valid!: boolean;

  @ApiProperty({
    example: [],
    description: "List of validation error messages",
  })
  errors!: string[];

  static validate(data: unknown) {
    return TemplateValidationResponseSchema.safeParse(data);
  }
}
