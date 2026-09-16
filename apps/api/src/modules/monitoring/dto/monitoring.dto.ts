import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SubmissionSource, SubmissionReason } from "@prisma/client";
import { CandidateLiveState } from "../constants/monitoring.constants";

export class CandidateHeartbeatDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentSectionKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentSectionIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentQuestionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentQuestionIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  answeredCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalQuestions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  markedQuestionsCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  remainingTimeSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latencyMs?: number;

  @ApiPropertyOptional({ enum: ["ONLINE", "SLOW", "RECONNECTING", "OFFLINE"] })
  @IsOptional()
  @IsString()
  networkStatus?: string;

  @ApiPropertyOptional({ enum: ["HEALTHY", "RETRYING", "FAILED"] })
  @IsOptional()
  @IsString()
  autosaveHealth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unsyncedAnswersCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientTimestamp?: string;
}

export class CandidateProctoringTelemetryDto {
  @ApiProperty({ description: "Proctoring event type" })
  @IsString()
  eventType!: string; // FACE_MISSING, MULTIPLE_FACES, TAB_HIDDEN, FULLSCREEN_EXIT

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  strikeCount?: number;
}

export class AuthorizeResumeDto {
  @ApiProperty({ description: "Grace time in minutes to grant candidate", default: 5 })
  @IsNumber()
  @Min(0)
  @Max(120)
  extraTimeMinutes!: number;

  @ApiProperty({ description: "Administrative reason for authorizing resume" })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: "Optional checkpoint ID or timestamp to restore" })
  @IsOptional()
  @IsString()
  checkpointId?: string;
}

export class ExtendTimeDto {
  @ApiProperty({ description: "Extra minutes to add to active attempt", default: 5 })
  @IsNumber()
  @Min(1)
  @Max(120)
  extraMinutes!: number;

  @ApiProperty({ description: "Reason for extending time" })
  @IsString()
  reason!: string;
}

export class ForceSubmitDto {
  @ApiProperty({ enum: SubmissionSource, default: SubmissionSource.ADMIN })
  @IsOptional()
  @IsEnum(SubmissionSource)
  source?: SubmissionSource;

  @ApiProperty({ enum: SubmissionReason, default: SubmissionReason.ADMIN_ACTION })
  @IsOptional()
  @IsEnum(SubmissionReason)
  reason?: SubmissionReason;

  @ApiPropertyOptional({ description: "Detailed reason for forced submission" })
  @IsOptional()
  @IsString()
  reasonDetails?: string;
}

export class ResolveAlertDto {
  @ApiPropertyOptional({ description: "Optional resolution notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryCandidatesDto {
  @ApiPropertyOptional({ description: "Search by candidate name or email" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by live state" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "Filter by section key" })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: "Only return candidates needing attention" })
  @IsOptional()
  @IsBoolean()
  attentionOnly?: boolean;

  @ApiPropertyOptional({ description: "Sort field", default: "remainingTime" })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
