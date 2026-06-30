import { ApiProperty } from "@nestjs/swagger";

export class RecentlyCompletedWorkflow {
  @ApiProperty()
  examId!: string;

  @ApiProperty()
  examName!: string;

  @ApiProperty()
  completedAt!: string;
}

export class AdminInsightsResponse {
  @ApiProperty()
  totalExams!: number;

  @ApiProperty()
  generatedQuestions!: number;

  @ApiProperty()
  pendingReviews!: number;

  @ApiProperty()
  publishedTests!: number;

  @ApiProperty()
  failedAssemblies!: number;

  @ApiProperty()
  recentlyCompletedCount!: number;

  @ApiProperty({ type: Number, nullable: true })
  averageGenerationTimeMs!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  averageReviewTimeMs!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  averageAssemblyTimeMs!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  averagePublishTimeMs!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  workflowFailureRate!: number | null;

  @ApiProperty({ type: [RecentlyCompletedWorkflow] })
  recentlyCompletedWorkflows!: RecentlyCompletedWorkflow[];
}
