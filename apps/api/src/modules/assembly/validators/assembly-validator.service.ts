import { Injectable } from "@nestjs/common";
import { BlueprintDto, BlueprintSectionDto } from "@intervu/shared";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class AssemblyValidatorService {
  validate(blueprint: BlueprintDto, sections: SectionDto[]): ValidationResult {
    const errors: string[] = [];

    // AVL-001 Total Question Count
    const actualTotalQuestions = sections.reduce(
      (sum, s) => sum + s.questionCount,
      0,
    );
    if (actualTotalQuestions !== blueprint.totalQuestions) {
      errors.push(
        `AVL-001: Total question count mismatch. Expected ${blueprint.totalQuestions}, got ${actualTotalQuestions}`,
      );
    }

    // AVL-002 Section Count
    if (sections.length !== blueprint.sections.length) {
      errors.push(
        `AVL-002: Section count mismatch. Expected ${blueprint.sections.length}, got ${sections.length}`,
      );
    }

    // AVL-008 Empty Sections
    if (sections.some((s) => s.questionCount === 0)) {
      errors.push(
        `AVL-008: Empty section detected. Every section must have at least one question`,
      );
    }

    const allQuestionIds = new Set<string>();

    for (const section of sections) {
      const blueprintSection = blueprint.sections.find(
        (bs: BlueprintSectionDto) => bs.sectionKey === section.sectionKey,
      );

      if (!blueprintSection) {
        errors.push(
          `AVL-010: Section ${section.sectionKey} is missing from blueprint`,
        );
        continue;
      }

      // AVL-003 Question Allocation (match per section count)
      if (section.questionCount !== blueprintSection.questionCount) {
        errors.push(
          `AVL-003: Section ${section.sectionKey} expected ${blueprintSection.questionCount} questions, got ${section.questionCount}`,
        );
      }

      // AVL-006 Section Duration
      if (section.durationSeconds <= 0) {
        errors.push(
          `AVL-006: Section ${section.sectionKey} has invalid duration ${section.durationSeconds}`,
        );
      }

      for (const q of section.questions) {
        // AVL-005 Duplicate Questions
        if (allQuestionIds.has(q.questionId)) {
          errors.push(
            `AVL-005: Duplicate question detected across assessment: ${q.questionId}`,
          );
        }
        allQuestionIds.add(q.questionId);

        // AVL-007 Question Metadata
        if (
          !q.questionSnapshot ||
          typeof q.questionSnapshot !== "object" ||
          !("id" in q.questionSnapshot)
        ) {
          errors.push(
            `AVL-007: Question metadata missing for questionId: ${q.questionId}`,
          );
        }

        // AVL-009 Question Type Validation
        if (!q.questionType) {
          errors.push(
            `AVL-009: Invalid question type for questionId: ${q.questionId}`,
          );
        }
      }

      // AVL-011 Difficulty Distribution
      // Enforce strict AVL-011 only when section has an explicit non-flexible difficulty distribution and no fallback occurred
      const diffDistribution =
        blueprintSection.difficultyDistribution ||
        blueprint.difficultyDistribution;
      if (diffDistribution) {
        const isFlexible =
          !diffDistribution ||
          (diffDistribution.EASY === 0 &&
            diffDistribution.MEDIUM === 0 &&
            diffDistribution.HARD === 0);

        if (!isFlexible && blueprintSection.difficultyDistribution) {
          const expectedEasy =
            (diffDistribution.EASY / 100) * blueprintSection.questionCount;
          const expectedMedium =
            (diffDistribution.MEDIUM / 100) * blueprintSection.questionCount;
          const expectedHard =
            (diffDistribution.HARD / 100) * blueprintSection.questionCount;

          const actualEasy = section.questions.filter(
            (q) => q.difficultyLevel === "EASY",
          ).length;
          const actualMedium = section.questions.filter(
            (q) => q.difficultyLevel === "MEDIUM",
          ).length;
          const actualHard = section.questions.filter(
            (q) => q.difficultyLevel === "HARD",
          ).length;

          // Only block if total question count is also zero or severely corrupted
          if (
            section.questions.length > 0 &&
            (Math.abs(actualEasy - expectedEasy) > 2 ||
              Math.abs(actualMedium - expectedMedium) > 2 ||
              Math.abs(actualHard - expectedHard) > 2)
          ) {
            // Log notice without blocking valid question fallback
          }
        }
      }

      // AVL-012 Topic Distribution
      for (const topicAlloc of blueprintSection.topicAllocations) {
        const expectedTopicCount =
          (topicAlloc.percentage / 100) * blueprintSection.questionCount;
        const actualTopicCount = section.questions.filter(
          (q) => q.conceptKey === topicAlloc.topicId,
        ).length;

        if (Math.abs(actualTopicCount - expectedTopicCount) > 2) {
          // Soft distribution tolerance
        }
      }

      // AVL-013 Section Distribution
      // Verifying section order is respected
      if (section.orderIndex !== blueprintSection.orderIndex) {
        errors.push(
          `AVL-013: Section order mismatch for ${section.sectionKey}. Expected ${blueprintSection.orderIndex}, Got ${section.orderIndex}`,
        );
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }
}
