import { Injectable, Logger } from "@nestjs/common";
import { BlueprintDto, BlueprintSectionDto } from "@intervu/shared";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class AssemblyValidatorService {
  private readonly logger = new Logger(AssemblyValidatorService.name);

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

        // AVL-014 Question Content Integrity Gate
        const snapshot = q.questionSnapshot as Record<string, any> | undefined;
        if (snapshot) {
          const qText = snapshot.questionText || snapshot.questionStatement || snapshot.question;
          if (!qText || String(qText).trim().length === 0) {
            errors.push(
              `AVL-014: Question ${q.questionId} has empty question statement`,
            );
          }

          const qType = String(q.questionType || snapshot.questionType || "").toUpperCase();
          const isObjective = ["MCQ", "MULTIPLE_CHOICE", "MSQ"].includes(qType);

          if (isObjective) {
            const rawOpts = snapshot.options || snapshot.mcqData?.options || [];
            if (!Array.isArray(rawOpts) || rawOpts.length < 2) {
              errors.push(
                `AVL-014: Objective question ${q.questionId} has fewer than 2 options (got ${Array.isArray(rawOpts) ? rawOpts.length : 0})`,
              );
            } else {
              // Check uniqueness of option texts
              const optTexts = rawOpts.map((o) => (typeof o === "string" ? o.trim() : o?.text?.trim() || ""));
              const uniqueTexts = new Set(optTexts.filter((t) => t.length > 0));
              if (uniqueTexts.size < optTexts.length) {
                errors.push(
                  `AVL-014: Objective question ${q.questionId} contains duplicate option texts`,
                );
              }

              // Verify answer is present
              const rawAns = String(snapshot.correctAnswer ?? snapshot.answer ?? "").trim();
              if (rawAns.length === 0) {
                errors.push(
                  `AVL-014: Objective question ${q.questionId} is missing correct answer`,
                );
              }
            }
          }
        }
      }

      // AVL-011 Difficulty Distribution
      const diffDistribution =
        blueprintSection.difficultyDistribution ||
        blueprint.difficultyDistribution;
      if (diffDistribution) {
        const isFlexible =
          !diffDistribution ||
          (diffDistribution.EASY === 0 &&
            diffDistribution.MEDIUM === 0 &&
            diffDistribution.HARD === 0);

        if (!isFlexible && blueprintSection.difficultyDistribution && section.questions.length > 0) {
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

          // Flag severe difficulty deviation (> 4 questions variance when pool has questions)
          if (
            Math.abs(actualEasy - expectedEasy) > 4 ||
            Math.abs(actualMedium - expectedMedium) > 4 ||
            Math.abs(actualHard - expectedHard) > 4
          ) {
            this.logger.warn(
              `AVL-011: Noticeable difficulty deviation in section ${section.sectionKey}. Expected [E:${expectedEasy}, M:${expectedMedium}, H:${expectedHard}], Got [E:${actualEasy}, M:${actualMedium}, H:${actualHard}]`,
            );
          }
        }
      }

      // AVL-012 Topic Distribution
      if (blueprintSection.topicAllocations && blueprintSection.topicAllocations.length > 0) {
        for (const topicAlloc of blueprintSection.topicAllocations) {
          const expectedTopicCount =
            (topicAlloc.percentage / 100) * blueprintSection.questionCount;
          const actualTopicCount = section.questions.filter(
            (q) => q.conceptKey === topicAlloc.topicId,
          ).length;

          if (expectedTopicCount >= 1 && actualTopicCount === 0 && section.questions.length > 0) {
            this.logger.warn(
              `AVL-012: Topic '${topicAlloc.topicId}' in section ${section.sectionKey} received 0 questions (expected ~${Math.round(expectedTopicCount)})`,
            );
          }
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
