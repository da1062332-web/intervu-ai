import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum } from "class-validator";

export class AdminDashboardDto {
  @ApiProperty({ example: 120 })
  totalQuestions!: number;

  @ApiProperty({ example: 85 })
  approvedQuestions!: number;

  @ApiProperty({ example: 15 })
  pendingReviews!: number;

  @ApiProperty({ example: 5 })
  publishedAssessments!: number;

  @ApiProperty({ example: 30 })
  generatedThisWeek!: number;

  @ApiProperty({ example: 8 })
  activeCandidates!: number;
}

export enum ExportFormat {
  CSV = "csv",
  JSON = "json",
}

export class ExportQueryDto {
  @ApiProperty({
    required: false,
    enum: ExportFormat,
    default: ExportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
}
