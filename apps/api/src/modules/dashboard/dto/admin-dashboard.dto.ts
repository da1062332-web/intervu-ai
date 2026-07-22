import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class AdminPaginationQueryDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class TotalAssessmentsDto {
  @ApiProperty({ example: 120 })
  totalAssessments!: number;
}

export class ActiveAssessmentsDto {
  @ApiProperty({ example: 18 })
  activeAssessments!: number;
}

export class TotalCandidatesDto {
  @ApiProperty({ example: 542 })
  totalCandidates!: number;
}

export class CompletedTestsDto {
  @ApiProperty({ example: 431 })
  completedTests!: number;
}

export class AverageScoreDto {
  @ApiProperty({ example: 74.25 })
  averageScore!: number;
}

export class QuestionBankCountDto {
  @ApiProperty({ example: 12450 })
  questionBankCount!: number;
}

export class AssessmentCompletionRateDto {
  @ApiProperty({ example: 84.5 })
  completionRate!: number;

  @ApiProperty({ example: 845 })
  completed!: number;

  @ApiProperty({ example: 155 })
  pending!: number;
}

export class RecentAssessmentItemDto {
  @ApiProperty({ example: "clx9xyz789" })
  id!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  assessmentName!: string;

  @ApiProperty({ example: "PUBLISHED" })
  status!: string;

  @ApiProperty({ example: 15 })
  candidateCount!: number;

  @ApiProperty({ example: "2026-06-08T04:00:00.000Z" })
  createdAt!: string;
}

export class RecentAssessmentsResponseDto {
  @ApiProperty({ type: [RecentAssessmentItemDto] })
  data!: RecentAssessmentItemDto[];

  @ApiProperty({ example: 20 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}

export class RecentTestAttemptItemDto {
  @ApiProperty({ example: "John Doe" })
  candidateName!: string;

  @ApiProperty({ example: "TCS NQT Assessment" })
  assessment!: string;

  @ApiProperty({ example: 82.5 })
  score!: number;

  @ApiProperty({ example: "COMPLETED" })
  status!: string;

  @ApiProperty({ example: "2026-06-08T04:00:00.000Z" })
  submittedAt!: string;
}

export class RecentTestAttemptsResponseDto {
  @ApiProperty({ type: [RecentTestAttemptItemDto] })
  data!: RecentTestAttemptItemDto[];

  @ApiProperty({ example: 40 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}

export class RecentActivityItemDto {
  @ApiProperty({ example: "ASSESSMENT_STARTED" })
  activityType!: string;

  @ApiProperty({ example: "Assessment Started" })
  title!: string;

  @ApiProperty({ example: "John Doe started TCS NQT Assessment" })
  description!: string;

  @ApiProperty({ example: "John Doe" })
  performedBy!: string;

  @ApiProperty({ example: "2026-06-08T04:00:00.000Z" })
  createdAt!: string;
}

export class RecentActivitiesResponseDto {
  @ApiProperty({ type: [RecentActivityItemDto] })
  data!: RecentActivityItemDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}
