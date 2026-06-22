import { z } from "zod";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { VariableType } from "../enums/template-schema.enum";

export const CreateTemplateVariableSchema = z.object({
  variableName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
      message:
        "Variable name must be alphanumeric and start with a letter or underscore",
    }),
  variableType: z.nativeEnum(VariableType),
  required: z.boolean().default(false),
  defaultValue: z.string().optional().nullable(),
});

export const UpdateTemplateVariableSchema = z.object({
  variableName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .optional(),
  variableType: z.nativeEnum(VariableType).optional(),
  required: z.boolean().optional(),
  defaultValue: z.string().optional().nullable(),
});

export class CreateTemplateVariableDto {
  @ApiProperty({ example: "max_connections", description: "Variable name" })
  variableName!: string;

  @ApiProperty({
    enum: VariableType,
    example: VariableType.NUMBER,
    description: "Variable type",
  })
  variableType!: VariableType;

  @ApiPropertyOptional({
    example: false,
    description: "Whether variable is required",
  })
  required?: boolean;

  @ApiPropertyOptional({ example: "100", description: "Default value" })
  defaultValue?: string | null;

  static validate(data: unknown) {
    return CreateTemplateVariableSchema.safeParse(data);
  }
}

export class UpdateTemplateVariableDto {
  @ApiPropertyOptional({
    example: "max_connections",
    description: "Variable name",
  })
  variableName?: string;

  @ApiPropertyOptional({
    enum: VariableType,
    example: VariableType.NUMBER,
    description: "Variable type",
  })
  variableType?: VariableType;

  @ApiPropertyOptional({
    example: false,
    description: "Whether variable is required",
  })
  required?: boolean;

  @ApiPropertyOptional({ example: "100", description: "Default value" })
  defaultValue?: string | null;

  static validate(data: unknown) {
    return UpdateTemplateVariableSchema.safeParse(data);
  }
}
