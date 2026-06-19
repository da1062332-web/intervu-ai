import { ApiProperty } from "@nestjs/swagger";
import {
  UpdateDifficultyDistribution,
  UpdateDifficultyDistributionSchema,
} from "../contracts/difficulty-distribution";
import { z } from "zod";

export class UpdateDifficultyDistributionDto implements UpdateDifficultyDistribution {
  @ApiProperty({ example: 20 })
  easyPercentage!: number;

  @ApiProperty({ example: 50 })
  mediumPercentage!: number;

  @ApiProperty({ example: 30 })
  hardPercentage!: number;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, UpdateDifficultyDistributionDto> {
    return UpdateDifficultyDistributionSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<
      unknown,
      UpdateDifficultyDistributionDto
    >;
  }
}
