import { ApiProperty } from "@nestjs/swagger";
import type {
  AvailableTestDto as IAvailableTestDto,
  ActiveTestDto as IActiveTestDto,
  CompletedAttemptDto as ICompletedAttemptDto,
  DashboardResponseDto as IDashboardResponseDto,
} from "@intervu-ai/contracts";

/**
 * Backend-only interface for the opaque Template.config JSON blob.
 * This type is NEVER exported to the frontend — use AvailableTestDto for that.
 * All fields are optional because the JSON blob has no enforced schema in the DB.
 */
export interface TemplateConfig {
  company?: string;
  /** Duration of the test in seconds */
  durationSeconds?: number;
  sections?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// AvailableTestDto
// ─────────────────────────────────────────────────────────────────────────────

export class AvailableTestDto implements IAvailableTestDto {
  @ApiProperty({
    example: "clx1abc123",
    description: "Template ID — uniquely identifies an assessment config",
  })
  configId!: string;

  @ApiProperty({
    example: "Acme Corp",
    description:
      "Company name from Template.config.company — empty string when not configured",
  })
  company!: string;

  @ApiProperty({ example: "Senior Frontend Engineer Interview" })
  name!: string;

  @ApiProperty({
    example: "MEDIUM",
    description: "Difficulty level from Template.difficulty enum",
  })
  difficulty!: string;

  @ApiProperty({
    example: 3600,
    description:
      "Test duration in seconds from Template.config.durationSeconds — 0 when not configured",
  })
  duration!: number;

  @ApiProperty({
    example: ["HTML & CSS", "JavaScript", "React"],
    description:
      "Sections from Template.config.sections — empty array when not configured",
    type: [String],
  })
  sections!: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ActiveTestDto
// ─────────────────────────────────────────────────────────────────────────────

export class ActiveTestDto implements IActiveTestDto {
  @ApiProperty({ example: "clx9xyz789", description: "Test instance ID" })
  instanceId!: string;

  @ApiProperty({ example: "clx1abc123", description: "Template ID" })
  configId!: string;

  @ApiProperty({ example: "Senior Frontend Engineer Interview" })
  name!: string;

  @ApiProperty({
    example: "2026-06-08T04:00:00.000Z",
    nullable: true,
    description:
      "ISO 8601 timestamp when the candidate started — null if not yet started",
  })
  startedAt!: string | null;

  @ApiProperty({
    example: 3240,
    description:
      "Remaining seconds derived from config.durationSeconds minus elapsed time",
  })
  timeRemainingSeconds!: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CompletedAttemptDto
// ─────────────────────────────────────────────────────────────────────────────

export class CompletedAttemptDto implements ICompletedAttemptDto {
  @ApiProperty({ example: "clx9xyz789", description: "Test instance ID" })
  instanceId!: string;

  @ApiProperty({ example: "clx1abc123", description: "Template ID" })
  configId!: string;

  @ApiProperty({ example: "Senior Frontend Engineer Interview" })
  name!: string;

  @ApiProperty({
    example: 82,
    description: "Test.score — 0 when score is null (evaluation pending)",
  })
  score!: number;

  @ApiProperty({
    example: "2026-06-08T05:30:00.000Z",
    nullable: true,
    description:
      "ISO 8601 timestamp of submission — null when completedAt is not set",
  })
  submittedAt!: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DashboardResponseDto — top-level GET /api/v1/dashboard response data shape
// ─────────────────────────────────────────────────────────────────────────────

export class DashboardResponseDto implements IDashboardResponseDto {
  @ApiProperty({ type: [AvailableTestDto] })
  availableTests!: AvailableTestDto[];

  @ApiProperty({ type: [ActiveTestDto] })
  activeTests!: ActiveTestDto[];

  @ApiProperty({ type: [CompletedAttemptDto] })
  completedAttempts!: CompletedAttemptDto[];
}
