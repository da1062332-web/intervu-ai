import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class DraftStrategyRequestDto {
  @ApiProperty({
    description:
      "Plain-English description of the variable and constraint logic",
    example:
      "Create a question where price is between 100 and 500, quantity is an integer, and total cost equals price times quantity.",
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt!: string;
}

export class VariableDraftDto {
  @ApiProperty({
    description: "Variable name (identifier)",
    example: "price",
  })
  name!: string;

  @ApiProperty({
    description: "Variable type",
    enum: ["number", "integer", "decimal", "boolean", "string"],
    example: "number",
  })
  type!: "number" | "integer" | "decimal" | "boolean" | "string";

  @ApiPropertyOptional({
    description: "Minimum value for numeric types",
    example: 100,
  })
  min?: number;

  @ApiPropertyOptional({
    description: "Maximum value for numeric types",
    example: 500,
  })
  max?: number;

  @ApiPropertyOptional({
    description: "Default or static value",
    example: 250,
  })
  defaultValue?: unknown;

  @ApiPropertyOptional({
    description: "Generation mode for numeric variables",
    enum: ["random", "even", "odd", "prime", "static"],
    example: "random",
  })
  generator?: string;
}

export class DerivedVariableDraftDto {
  @ApiProperty({
    description: "Derived variable name",
    example: "totalCost",
  })
  name!: string;

  @ApiProperty({
    description: "Mathematical expression using base variable names",
    example: "price * quantity",
  })
  expression!: string;
}

export class ConstraintDraftDto {
  @ApiProperty({
    description: "Constraint rule or expression",
    example: "totalCost > 1000",
  })
  rule!: string;

  @ApiProperty({
    description: "Severity level",
    enum: ["critical", "warning"],
    example: "critical",
  })
  severity!: "critical" | "warning";
}

export class StrategyDraftDto {
  @ApiProperty({
    description: "Base variables",
    type: [VariableDraftDto],
  })
  variables!: VariableDraftDto[];

  @ApiProperty({
    description: "Derived/computed variables",
    type: [DerivedVariableDraftDto],
  })
  derivedVariables!: DerivedVariableDraftDto[];

  @ApiProperty({
    description: "Constraints and validation rules",
    type: [ConstraintDraftDto],
  })
  constraints!: ConstraintDraftDto[];

  @ApiProperty({
    description: "Notes and observations",
    type: [String],
  })
  notes!: string[];
}

export class DraftStrategyResponseDto {
  @ApiProperty({
    description: "Success flag",
    example: true,
  })
  success!: boolean;

  @ApiPropertyOptional({
    description: "Drafted strategy object",
    type: StrategyDraftDto,
  })
  data?: StrategyDraftDto;

  @ApiPropertyOptional({
    description: "Error message if failed",
  })
  error?: string;

  @ApiPropertyOptional({
    description: "Validation warnings about the draft",
    type: [String],
  })
  validationWarnings?: string[];
}

export class ApplyStrategyRequestDto {
  @ApiProperty({
    description: "The drafted strategy to apply",
    type: StrategyDraftDto,
  })
  draft!: StrategyDraftDto;
}

export class ApplyStrategyResponseDto {
  @ApiProperty({
    description: "Success flag",
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: "Template ID",
    example: "clm1abc123xyz",
  })
  templateId?: string;

  @ApiProperty({
    description: "Whether template was updated",
    example: true,
  })
  updated?: boolean;

  @ApiPropertyOptional({
    description: "Error message if failed",
  })
  error?: string;
}

export class PreviewStrategyRequestDto {
  @ApiProperty({
    description: "The strategy to preview",
    type: StrategyDraftDto,
  })
  draft!: StrategyDraftDto;
}

export class PreviewStrategyResponseDto {
  @ApiProperty({
    description: "Success flag",
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: "Preview of the strategy",
    type: StrategyDraftDto,
  })
  preview?: StrategyDraftDto;

  @ApiProperty({
    description: "Validation issues",
    type: [String],
  })
  warnings!: string[];

  @ApiPropertyOptional({
    description: "Error message if failed",
  })
  error?: string;
}
