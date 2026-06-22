import { z } from "zod";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RuleType } from "../enums/template-schema.enum";

export const CreateTemplateRuleSchema = z.object({
  ruleType: z.nativeEnum(RuleType),
  ruleConfig: z.record(z.unknown()),
});

export const UpdateTemplateRuleSchema = z.object({
  ruleType: z.nativeEnum(RuleType).optional(),
  ruleConfig: z.record(z.unknown()).optional(),
});

export class CreateTemplateRuleDto {
  @ApiProperty({
    enum: RuleType,
    example: RuleType.RANGE,
    description: "Rule type",
  })
  ruleType!: RuleType;

  @ApiProperty({
    example: { variableName: "num", min: 1, max: 100 },
    description: "Rule configuration",
  })
  ruleConfig!: Record<string, unknown>;

  static validate(data: unknown) {
    return CreateTemplateRuleSchema.safeParse(data);
  }
}

export class UpdateTemplateRuleDto {
  @ApiPropertyOptional({
    enum: RuleType,
    example: RuleType.RANGE,
    description: "Rule type",
  })
  ruleType?: RuleType;

  @ApiPropertyOptional({
    example: { variableName: "num", min: 1, max: 100 },
    description: "Rule configuration",
  })
  ruleConfig?: Record<string, unknown>;

  static validate(data: unknown) {
    return UpdateTemplateRuleSchema.safeParse(data);
  }
}
