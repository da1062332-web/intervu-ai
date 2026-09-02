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

  @ApiProperty({ example: false, required: false })
  candidateNoRepeatEnabled?: boolean;

  @ApiProperty({ example: false, required: false })
  runtimeGenerationOnDeficit?: boolean;

  @ApiProperty({ example: false, required: false, description: "Whether pre-generated pool is enabled for this exam" })
  poolEnabled?: boolean;

  @ApiProperty({ example: 10, required: false, description: "Target number of pre-generated ready pool instances to maintain" })
  poolTargetSize?: number;

  @ApiProperty({ example: 3, required: false, description: "Minimum pool threshold that triggers background refill" })
  poolMinThreshold?: number;

  @ApiProperty({ example: 5, required: false, description: "Number of instances generated per refill batch" })
  poolRefillBatchSize?: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateRuleFlagsDto> {
    return UpdateRuleFlagsSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, UpdateRuleFlagsDto>;
  }
}
