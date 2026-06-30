import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * AssemblyValidationReportDto — enriched validation output from AssemblyValidationV2Service.
 *
 * Extends the V1 validation result with:
 * - warnings (non-blocking issues)
 * - coverage % (questions allocated vs required)
 * - difficultyAccuracy % (how closely actual matches blueprint difficulty ratios)
 * - topicAccuracy % (how closely actual matches blueprint topic ratios)
 * - duplicateCount (questions appearing more than once)
 *
 * Note: This does NOT replace AssemblyValidationResultDto (V1).
 * V1 is still used by AssemblyValidatorService and AssemblyService.
 */
export class AssemblyValidationReportDto {
  @ApiProperty({
    example: true,
    description: "Whether assembly passed all hard validations",
  })
  valid!: boolean;

  @ApiProperty({
    type: [String],
    example: ["AVL-001: Question count mismatch"],
  })
  errors!: string[];

  @ApiProperty({
    type: [String],
    example: ["Difficulty ratio off by 1 question in section APTITUDE"],
  })
  warnings!: string[];

  @ApiProperty({
    example: 95.5,
    description: "Percentage of required questions successfully allocated",
  })
  coverage!: number;

  @ApiProperty({
    example: 88.0,
    description:
      "How accurately difficulty distribution matches blueprint (0–100)",
  })
  difficultyAccuracy!: number;

  @ApiProperty({
    example: 92.0,
    description: "How accurately topic distribution matches blueprint (0–100)",
  })
  topicAccuracy!: number;

  @ApiProperty({
    example: 0,
    description: "Number of duplicate questions detected in the assembly",
  })
  duplicateCount!: number;

  @ApiPropertyOptional({ description: "Per-section breakdown of validation" })
  sectionBreakdown?: Array<{
    sectionKey: string;
    valid: boolean;
    questionCount: number;
    expectedQuestionCount: number;
    difficultyAccuracy: number;
    topicAccuracy: number;
    duplicateCount: number;
  }>;
}
