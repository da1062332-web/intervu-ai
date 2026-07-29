import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class CandidateListQueryDto {
  @ApiPropertyOptional({ description: "Search term for name or email" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by active/inactive status",
    enum: ["ACTIVE", "INACTIVE"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["ACTIVE", "INACTIVE", ""])
  status?: string;

  @ApiPropertyOptional({
    description: "Sort attribute",
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Sort direction",
    enum: ["asc", "desc"],
    default: "desc",
  })
  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";

  @ApiPropertyOptional({
    description: "Page number for pagination",
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of records per page (Max 100)",
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class CandidateListItemDto {
  @ApiProperty({ example: "cmw0v9g...001", description: "Candidate unique ID" })
  id!: string;

  @ApiProperty({ example: "John Doe", description: "Candidate full name" })
  name!: string;

  @ApiProperty({ example: "john.doe@example.com", description: "Email address" })
  email!: string;

  @ApiProperty({ example: "ACTIVE", description: "Account status: ACTIVE or INACTIVE" })
  status!: string;

  @ApiProperty({ example: 10, description: "Total number of tests assigned to candidate" })
  assignedTests!: number;

  @ApiProperty({ example: 8, description: "Total number of test instances attempted" })
  attemptedTests!: number;

  @ApiProperty({ example: 7, description: "Total number of completed tests" })
  completedTests!: number;

  @ApiProperty({ example: 82, description: "Average evaluation score percentage" })
  averageScore!: number;

  @ApiProperty({ example: 95, description: "Best evaluation score percentage" })
  bestScore!: number;

  @ApiProperty({ example: "2026-07-20T10:30:00.000Z", description: "Timestamp of last attempt" })
  lastAttempt!: string;

  @ApiProperty({ example: "2026-01-15T08:00:00.000Z", description: "Registration timestamp" })
  createdAt!: string;
}

export class CandidatePaginationDto {
  @ApiProperty({ example: 1, description: "Current page" })
  page!: number;

  @ApiProperty({ example: 10, description: "Limit per page" })
  limit!: number;

  @ApiProperty({ example: 150, description: "Total matching records" })
  total!: number;

  @ApiProperty({ example: 15, description: "Total pages available" })
  totalPages!: number;
}

export class CandidateListResponseDto {
  @ApiProperty({ type: [CandidateListItemDto], description: "List of candidates" })
  items!: CandidateListItemDto[];

  @ApiProperty({ type: CandidatePaginationDto, description: "Pagination metadata" })
  pagination!: CandidatePaginationDto;
}

export class CandidateDetailsResponseDto {
  @ApiProperty({ example: "cmw0v9g...001", description: "Candidate unique ID" })
  id!: string;

  @ApiProperty({ example: "John Doe", description: "Candidate full name" })
  name!: string;

  @ApiProperty({ example: "john.doe@example.com", description: "Email address" })
  email!: string;

  @ApiProperty({ example: "+1234567890", description: "Phone number" })
  phone!: string;

  @ApiProperty({ example: "2026-01-15T08:00:00.000Z", description: "Registration timestamp" })
  createdAt!: string;

  @ApiProperty({ example: "ACTIVE", description: "Account status: ACTIVE or INACTIVE" })
  status!: string;
}

export class CandidateStatsResponseDto {
  @ApiProperty({ example: 10, description: "Total assessments assigned" })
  assignedTests!: number;

  @ApiProperty({ example: 8, description: "Total assessments attempted" })
  attemptedTests!: number;

  @ApiProperty({ example: 7, description: "Total assessments completed" })
  completedTests!: number;

  @ApiProperty({ example: 82, description: "Average overall score" })
  averageScore!: number;

  @ApiProperty({ example: 95, description: "Best overall score" })
  bestScore!: number;

  @ApiProperty({ example: "2026-07-20T10:30:00.000Z", description: "Last attempt date" })
  lastAttempt!: string;
}

export class CandidateTestHistoryQueryDto {
  @ApiPropertyOptional({ default: 1, description: "Page number" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: "Items per page" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class CandidateTestHistoryItemDto {
  @ApiProperty({ example: "atm_123456", description: "Test attempt unique ID" })
  attemptId!: string;

  @ApiProperty({ example: "Frontend Engineer Screening", description: "Assessment title" })
  assessmentName!: string;

  @ApiProperty({ example: "COMPLETED", description: "Execution status of attempt" })
  status!: string;

  @ApiProperty({ example: 80, description: "Raw evaluation score" })
  score!: number;

  @ApiProperty({ example: 80, description: "Percentage evaluation score" })
  percentage!: number;

  @ApiProperty({ example: "2026-07-20T09:00:00.000Z", description: "Attempt start time" })
  startedAt!: string;

  @ApiProperty({ example: "2026-07-20T10:00:00.000Z", description: "Attempt submission time" })
  submittedAt!: string;
}

export class CandidateTestHistoryResponseDto {
  @ApiProperty({ type: [CandidateTestHistoryItemDto], description: "List of attempted tests" })
  items!: CandidateTestHistoryItemDto[];

  @ApiPropertyOptional({ type: CandidatePaginationDto, description: "Pagination metadata" })
  pagination?: CandidatePaginationDto;
}
