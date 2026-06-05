import { ApiProperty } from "@nestjs/swagger";
import { DashboardAnalyticsSummary } from "@intervu/shared";

export class DashboardAnalyticsSummaryEntity implements DashboardAnalyticsSummary {
  @ApiProperty({
    example: 82,
    description: "Average score for communication skills",
  })
  communicationScore!: number;

  @ApiProperty({
    example: 78,
    description: "Average score for technical proficiency",
  })
  technicalScore!: number;

  @ApiProperty({ example: 88, description: "Average score for confidence" })
  confidenceScore!: number;

  @ApiProperty({
    example: 4.3,
    description: "Average overall rating on a 1.0 to 5.0 scale",
  })
  overallRating!: number;
}
