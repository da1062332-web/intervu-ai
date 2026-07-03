import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * Item shapes for the candidate dashboard response.
 */
export class DashboardTestItemDto {
  @ApiProperty({ example: "clx1abc123" })
  configId!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  name!: string;

  @ApiProperty({ example: "TCS" })
  company!: string;

  @ApiProperty({ example: 3600 })
  durationSeconds!: number;

  @ApiProperty({ example: 10 })
  questionCount!: number;

  @ApiProperty({ example: ["Aptitude", "Coding"] })
  sections!: string[];

  @ApiPropertyOptional({ example: "ENROLLED" })
  enrollmentStatus?: string;
}

export class DashboardActiveAttemptDto {
  @ApiProperty({ example: "clx9xyz789" })
  instanceId!: string;

  @ApiProperty({ example: "clx1abc123" })
  configId!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  name!: string;

  @ApiProperty({ example: "2026-06-08T04:00:00.000Z", nullable: true })
  startedAt!: string | null;

  @ApiProperty({ example: 3240 })
  timeRemainingSeconds!: number;
}

export class DashboardCompletedTestDto {
  @ApiProperty({ example: "clx9xyz789" })
  instanceId!: string;

  @ApiProperty({ example: "clx1abc123" })
  configId!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  name!: string;

  @ApiProperty({ example: 82 })
  score!: number;

  @ApiProperty({ example: "2026-06-08T05:30:00.000Z", nullable: true })
  submittedAt!: string | null;
}

export class CandidateDashboardResponseDto {
  @ApiProperty({ type: [DashboardTestItemDto] })
  upcomingTests!: DashboardTestItemDto[];

  @ApiProperty({ type: [DashboardCompletedTestDto] })
  completedTests!: DashboardCompletedTestDto[];

  @ApiProperty({ type: [DashboardActiveAttemptDto] })
  activeAttempts!: DashboardActiveAttemptDto[];

  @ApiProperty({ type: [DashboardTestItemDto] })
  recommendedTests!: DashboardTestItemDto[];
}
