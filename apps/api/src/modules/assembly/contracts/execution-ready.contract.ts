/**
 * Local re-export of Module 3 → Module 4 execution contracts.
 * This file resolves immediately from source without requiring a package build step.
 *
 * Canonical source: packages/contracts/src/execution-ready.dto.ts
 * This file is a passthrough to keep TestPackageService compilable without building the monorepo.
 */
export type {
  ExecutionQuestionDto,
  ExecutionSectionDto,
  ExecutionScoringRules,
  ExecutionReadyTestDto,
} from "../../../../../../packages/contracts/src/execution-ready.dto";
