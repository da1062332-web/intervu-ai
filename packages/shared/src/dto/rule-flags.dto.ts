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
  randomizeQuestions!: boolean;

  @ApiProperty({ example: false })
  randomizeOptions!: boolean;

  @ApiProperty({ example: false })
  calculatorAllowed!: boolean;

  @ApiProperty({ example: false })
  sectionLockingEnabled!: boolean;

  @ApiProperty({ example: true })
  freeNavigationEnabled!: boolean;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateRuleFlagsDto> {
    return UpdateRuleFlagsSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateRuleFlagsDto>;
  }
}
