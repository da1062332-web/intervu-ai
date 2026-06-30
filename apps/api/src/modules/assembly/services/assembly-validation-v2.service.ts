import { Injectable, Logger } from "@nestjs/common";
import { BlueprintDto, BlueprintSectionDto } from "@intervu/shared";
import { AllocatedSectionDto } from "@intervu/shared";
import { AssemblyValidationReportDto } from "@intervu/shared";
import { DuplicateDetectionService } from "./duplicate-detection.service";

/**
 * AssemblyValidationV2Service — enriched assembly validation.
 *
 * This service runs ALONGSIDE the existing AssemblyValidatorService (V1).
 * V1 is untouched and still used by AssemblyService for fast hard-fail checks.
 * V2 provides a richer diagnostic report for:
 *   - Health dashboard (GET /assembly/:id/health)
 *   - Publish readiness gate (POST /assembly/:id/readiness)
 *   - Direct validation endpoint (POST /assembly/:id/validate-v2)
 *
 * V2 inherits all AVL-xxx error codes from V1 but additionally computes:
 *   - warnings (non-blocking, ±1 tolerance issues)
 *   - coverage % (actual questions / required questions)
 *   - difficultyAccuracy % (how closely actual difficulty matches blueprint)
 *   - topicAccuracy % (how closely actual topic distribution matches blueprint)
 *   - duplicateCount (via DuplicateDetectionService)
 *   - per-section breakdown
 */
@Injectable()
export class AssemblyValidationV2Service {
  private readonly logger = new Logger(AssemblyValidationV2Service.name);

  constructor(private readonly duplicateDetection: DuplicateDetectionService) {}

  /**
   * Run V2 validation on an in-memory assembly (blueprint + sections).
   * This is the core method — all other entry points delegate here.
   */
  validate(
    blueprint: BlueprintDto,
    sections: AllocatedSectionDto[],
  ): AssemblyValidationReportDto {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sectionBreakdown: AssemblyValidationReportDto["sectionBreakdown"] =
      [];

    // --- Assembly-level checks ---

    // AVL-001: Total question count
    const actualTotal = sections.reduce((sum, s) => sum + s.questionCount, 0);
    const expectedTotal = blueprint.totalQuestions;
    if (actualTotal !== expectedTotal) {
      errors.push(
        `AVL-001: Total question count mismatch. Expected ${expectedTotal}, got ${actualTotal}`,
      );
    }

    // AVL-002: Section count
    if (sections.length !== blueprint.sections.length) {
      errors.push(
        `AVL-002: Section count mismatch. Expected ${blueprint.sections.length}, got ${sections.length}`,
      );
    }

    // AVL-008: Empty sections
    if (sections.some((s) => s.questionCount === 0)) {
      errors.push(
        "AVL-008: Empty section detected. Every section must have at least one question",
      );
    }

    // --- Coverage calculation ---
    const coverage =
      expectedTotal > 0
        ? Math.min(
            100,
            Math.round((actualTotal / expectedTotal) * 100 * 10) / 10,
          )
        : 0;

    // --- Duplicate detection ---
    const dupeReport = this.duplicateDetection.detectDuplicates(sections);
    if (dupeReport.totalDuplicateCount > 0) {
      errors.push(
        `AVL-005: ${dupeReport.totalDuplicateCount} duplicate question(s) detected. ` +
          `IDs: ${dupeReport.duplicateQuestionIds.slice(0, 5).join(", ")}` +
          (dupeReport.duplicateQuestionIds.length > 5 ? "..." : ""),
      );
    }

    // --- Per-section checks ---
    let totalDiffAccuracy = 0;
    let totalTopicAccuracy = 0;
    let sectionCount = 0;

    for (const section of sections) {
      const bp: BlueprintSectionDto | undefined = blueprint.sections.find(
        (bs) => bs.sectionKey === section.sectionKey,
      );

      if (!bp) {
        errors.push(`AVL-010: Section ${section.sectionKey} not in blueprint`);
        continue;
      }

      // AVL-003: Per-section question count
      if (section.questionCount !== bp.questionCount) {
        errors.push(
          `AVL-003: Section ${section.sectionKey} expected ${bp.questionCount} questions, got ${section.questionCount}`,
        );
      }

      // AVL-006: Duration
      if (section.durationSeconds <= 0) {
        errors.push(
          `AVL-006: Section ${section.sectionKey} has invalid duration ${section.durationSeconds}s`,
        );
      }

      // AVL-013: Section order
      if (section.orderIndex !== bp.orderIndex) {
        errors.push(
          `AVL-013: Section order mismatch for ${section.sectionKey}. ` +
            `Expected ${bp.orderIndex}, got ${section.orderIndex}`,
        );
      }

      // --- Difficulty accuracy ---
      const sectionDiffAccuracy = this.calcDifficultyAccuracy(
        section,
        bp,
        warnings,
      );
      totalDiffAccuracy += sectionDiffAccuracy;

      // --- Topic accuracy ---
      const sectionTopicAccuracy = this.calcTopicAccuracy(
        section,
        bp,
        warnings,
      );
      totalTopicAccuracy += sectionTopicAccuracy;

      // --- Per-section duplicate count ---
      const sectionDupeReport = dupeReport.sectionReports.find(
        (r) => r.sectionKey === section.sectionKey,
      );

      sectionBreakdown.push({
        sectionKey: section.sectionKey,
        valid:
          errors.filter((e) => e.includes(section.sectionKey)).length === 0,
        questionCount: section.questionCount,
        expectedQuestionCount: bp.questionCount,
        difficultyAccuracy: sectionDiffAccuracy,
        topicAccuracy: sectionTopicAccuracy,
        duplicateCount: sectionDupeReport?.duplicateCount ?? 0,
      });

      sectionCount++;
    }

    const difficultyAccuracy =
      sectionCount > 0
        ? Math.round((totalDiffAccuracy / sectionCount) * 10) / 10
        : 0;
    const topicAccuracy =
      sectionCount > 0
        ? Math.round((totalTopicAccuracy / sectionCount) * 10) / 10
        : 0;

    const report: AssemblyValidationReportDto = {
      valid: errors.length === 0,
      errors,
      warnings,
      coverage,
      difficultyAccuracy,
      topicAccuracy,
      duplicateCount: dupeReport.totalDuplicateCount,
      sectionBreakdown,
    };

    this.logger.debug(
      `V2 validation complete: valid=${report.valid}, ` +
        `coverage=${coverage}%, diffAccuracy=${difficultyAccuracy}%, ` +
        `topicAccuracy=${topicAccuracy}%, duplicates=${dupeReport.totalDuplicateCount}`,
    );

    return report;
  }

  /**
   * Calculate difficulty distribution accuracy for a section.
   * Returns 0–100. Tolerance of ±1 question triggers warning instead of error.
   */
  private calcDifficultyAccuracy(
    section: AllocatedSectionDto,
    bp: BlueprintSectionDto,
    warnings: string[],
  ): number {
    const diffConfig = bp.difficultyDistribution;
    if (!diffConfig || section.questionCount === 0) return 100;

    const expected = {
      EASY: (diffConfig.EASY / 100) * bp.questionCount,
      MEDIUM: (diffConfig.MEDIUM / 100) * bp.questionCount,
      HARD: (diffConfig.HARD / 100) * bp.questionCount,
    };
    const actual = {
      EASY: section.questions.filter((q) => q.difficultyLevel === "EASY")
        .length,
      MEDIUM: section.questions.filter((q) => q.difficultyLevel === "MEDIUM")
        .length,
      HARD: section.questions.filter((q) => q.difficultyLevel === "HARD")
        .length,
    };

    const totalDeviation =
      Math.abs(actual.EASY - expected.EASY) +
      Math.abs(actual.MEDIUM - expected.MEDIUM) +
      Math.abs(actual.HARD - expected.HARD);

    if (totalDeviation > 1) {
      warnings.push(
        `Difficulty distribution off by ${totalDeviation} question(s) in section ${section.sectionKey}. ` +
          `Expected [E:${expected.EASY}, M:${expected.MEDIUM}, H:${expected.HARD}], ` +
          `Got [E:${actual.EASY}, M:${actual.MEDIUM}, H:${actual.HARD}]`,
      );
    }

    const maxDeviation = bp.questionCount;
    const accuracy =
      maxDeviation > 0
        ? Math.max(0, 100 - (totalDeviation / maxDeviation) * 100)
        : 100;
    return Math.round(accuracy * 10) / 10;
  }

  /**
   * Calculate topic distribution accuracy for a section.
   * Returns 0–100. Tolerance of ±1 question triggers warning instead of error.
   */
  private calcTopicAccuracy(
    section: AllocatedSectionDto,
    bp: BlueprintSectionDto,
    warnings: string[],
  ): number {
    if (!bp.topicAllocations.length || section.questionCount === 0) return 100;

    let totalDeviation = 0;

    for (const topicAlloc of bp.topicAllocations) {
      const expected = (topicAlloc.percentage / 100) * bp.questionCount;
      const actual = section.questions.filter(
        (q) => q.conceptKey === topicAlloc.topicId,
      ).length;
      const deviation = Math.abs(actual - expected);
      totalDeviation += deviation;

      if (deviation > 1) {
        warnings.push(
          `Topic distribution off by ${deviation.toFixed(1)} question(s) for topic ${topicAlloc.topicId} ` +
            `in section ${section.sectionKey}. Expected ${expected.toFixed(1)}, got ${actual}`,
        );
      }
    }

    const maxDeviation = bp.questionCount;
    const accuracy =
      maxDeviation > 0
        ? Math.max(0, 100 - (totalDeviation / maxDeviation) * 100)
        : 100;
    return Math.round(accuracy * 10) / 10;
  }
}
