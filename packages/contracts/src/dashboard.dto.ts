/**
 * Shared frontend–backend contracts for the dashboard vertical slice.
 *
 * These interfaces are the single source of truth consumed by:
 *   - Backend: DashboardService, TestsService (maps DB rows → these shapes)
 *   - Frontend: dashboard page components (renders these shapes)
 *
 * No Nest.js / Swagger decorators here — pure TypeScript.
 */

/** A test assessment that is available for a candidate to start. */
export interface AvailableTestDto {
  /** Template.id */
  configId: string;
  /** Template.config.company — empty string when not set */
  company: string;
  /** Template.name */
  name: string;
  /** Template.difficulty enum value as string */
  difficulty: string;
  /** Template.config.durationSeconds — 0 when not set */
  duration: number;
  /** Template.config.sections — empty array when not set */
  sections: string[];
}

/** A test instance currently in progress for the authenticated candidate. */
export interface ActiveTestDto {
  /** Test.id */
  instanceId: string;
  /** Test.templateId */
  configId: string;
  /** Test.template.name */
  name: string;
  /** Test.startedAt ISO string — null when startedAt is not set */
  startedAt: string | null;
  /** Remaining seconds derived from config.durationSeconds minus elapsed time */
  timeRemainingSeconds: number;
}

/** A test instance the candidate has completed. */
export interface CompletedAttemptDto {
  /** Test.id */
  instanceId: string;
  /** Test.templateId */
  configId: string;
  /** Test.template.name */
  name: string;
  /** Test.score — 0 when score is null (not yet evaluated) */
  score: number;
  /** Test.completedAt ISO string — null when completedAt is not set */
  submittedAt: string | null;
}

/** Top-level response shape for GET /api/v1/dashboard */
export interface DashboardResponseDto {
  availableTests: AvailableTestDto[];
  activeTests: ActiveTestDto[];
  completedAttempts: CompletedAttemptDto[];
}
