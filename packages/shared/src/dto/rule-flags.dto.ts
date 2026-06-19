import { ApiProperty } from "@nestjs/swagger";
import {
  UpdateRuleFlags,
  UpdateRuleFlagsSchema,
} from "../contracts/rule-flags";
import { z } from "zod";

export class UpdateRuleFlagsDto implements UpdateRuleFlags {
  @ApiProperty({ example: false })
  negativeMarkingEnabled!: boolean;

  @ApiProperty({ example: false })
  sectionalCutoffEnabled!: boolean;

  @ApiProperty({ example: false })
  adaptiveDifficultyEnabled!: boolean;

  @ApiProperty({ example: false })
  shuffleQuestionsEnabled!: boolean;

  @ApiProperty({ example: false })
  shuffleOptionsEnabled!: boolean;

  @ApiProperty({ example: false })
  allowSectionNavigation!: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateRuleFlagsDto> {
    return UpdateRuleFlagsSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateRuleFlagsDto>;
  }
}
